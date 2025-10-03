import {
  Background,
  type Connection,
  ConnectionMode,
  Controls,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type OnEdgesChange,
  type OnNodesChange,
  Panel,
  ReactFlow,
  addEdge,
  useReactFlow,
} from '@xyflow/react';
import {
  type Dispatch,
  type SetStateAction,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useAuthToken } from '../../../hooks/useAuthToken';
import { createPipeline, listPipelines, startTraining } from '../../../utils/api';
import '../VisualPipeline.scss';
import { nodeTypes } from '../nodes/nodeTypes';
import { PropertiesPanel } from '../PropertiesPanel/PropertiesPanel';
import { Sidebar } from '../Sidebar/Sidebar';
import type { AppNodeData, NodeKind, PipelineStep } from '../types';
import { summarizeErrors, validateNodeData } from '../validation';
import { buildStepsFromGraph } from './utils/graphToSteps';
import { stepsToGraph } from './utils/stepsToGraph';

type Props = {
  nodes: Node<AppNodeData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node<AppNodeData>>;
  onEdgesChange: OnEdgesChange<Edge>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  setNodes: Dispatch<SetStateAction<Node<AppNodeData>[]>>;
  onSelectNode: (id: string | null) => void;
  onCreateNode: (kind: NodeKind, position: { x: number; y: number }) => void;
  selectedNode?: Node<AppNodeData> | null;
  onChangeNodeData?: (id: string, updater: (data: AppNodeData) => AppNodeData) => void;
};

export const FlowCanvas = memo(function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setEdges,
  setNodes,
  onSelectNode,
  onCreateNode,
  selectedNode,
  onChangeNodeData,
}: Props) {
  const { screenToFlowPosition } = useReactFlow();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { get: getToken } = useAuthToken();
  const [creatingPipeline, setCreatingPipeline] = useState(false);
  const [pipelines, setPipelines] = useState<PipelineStep[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<PipelineStep>({
    name: '',
    definition: {},
  });
  const [trainingStarting, setTrainingStarting] = useState(false);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) return;
      try {
        const apiBase = process.env.REACT_APP_START_TRAINING_API_URL_ENDPOINT;
        if (!apiBase) return;
        const apiUrl = apiBase + '/list-pipeline';
        const data = await listPipelines(apiUrl, token);
        setPipelines((data.pipelines || []) as PipelineStep[]);
        if (data.pipelines?.length > 0) setSelectedPipeline(data.pipelines[0] as PipelineStep);
      } catch (err) {
        console.error('Failed to fetch pipelines:', err);
      }
    })();
  }, [getToken]);
  const handleStartTrainingPipeline = async () => {
    const token = getToken();
    if (!token) return;

    if (!selectedPipeline || !selectedPipeline.name?.trim()) {
      alert('Please select a valid pipeline before starting training.');
      return;
    }

    try {
      setTrainingStarting(true);
      const apiUrl = process.env.REACT_APP_START_TRAINING_API_URL;
      if (!apiUrl) {
        alert('Training trigger API URL not configured.');
        setTrainingStarting(false);
        return;
      }
      const data = await startTraining(apiUrl, token, selectedPipeline.name);
      alert(`✅ Training started successfully!\nExecution ARN: ${data.executionArn || 'N/A'}`);
    } catch (error: any) {
      console.error(error);
      alert(`❌ Error starting training: ${error.message}`);
    } finally {
      setTrainingStarting(false);
    }
  };

  const exportConnectedSteps = useCallback(async () => {
    // collect only nodes that participate in at least one edge
    const connectedIds = new Set<string>();
    for (const edge of edges) {
      if (edge.source) connectedIds.add(edge.source);
      if (edge.target) connectedIds.add(edge.target);
    }
    const connectedNodes = nodes.filter((n) => connectedIds.has(n.id));

    // validate connected nodes
    const problems: string[] = [];
    for (const node of connectedNodes) {
      const result = validateNodeData(node.data as AppNodeData);
      if (!result.valid)
        problems.push(summarizeErrors(node.id, (node.data as AppNodeData).label, result));
    }
    if (problems.length > 0) {
      alert(problems.join('\n\n'));
      return;
    }
    const steps = buildStepsFromGraph(nodes, edges);

    const payload = {
      Version: '2020-12-01',
      Metadata: {},
      Parameters: [],
      PipelineName: `test-pipeline-${Date.now()}`,
      Steps: steps,
    };

    const apiUrl = process.env.REACT_APP_CREATE_PIPELINE_API_URL;
    if (!apiUrl) {
      alert('Training pipeline API URL not configured.');
      return;
    }
    const token = getToken();
    if (!token) {
      alert('Authentication required. Please sign in again.');
      return;
    }
    try {
      setCreatingPipeline(true);
      const resp = await createPipeline(apiUrl, token, payload);
      alert(
        `✅ Training pipeline created successfully!\nPipeline ARN: ${resp.pipelineArn || 'N/A'}`
      );
    } catch (err: any) {
      console.error(err);
      alert(`❌ Error creating training pipeline: ${err?.message || String(err)}`);
    } finally {
      setCreatingPipeline(false);
    }
  }, [edges, nodes, getToken]);

  const exportAsJSON = useCallback(() => {
    // collect only nodes that participate in at least one edge
    const connectedIds = new Set<string>();
    for (const edge of edges) {
      if (edge.source) connectedIds.add(edge.source);
      if (edge.target) connectedIds.add(edge.target);
    }
    const connectedNodes = nodes.filter((n) => connectedIds.has(n.id));

    // validate connected nodes
    const problems: string[] = [];
    for (const node of connectedNodes) {
      const result = validateNodeData(node.data as AppNodeData);
      if (!result.valid)
        problems.push(summarizeErrors(node.id, (node.data as AppNodeData).label, result));
    }
    if (problems.length > 0) {
      alert(problems.join('\n\n'));
      return;
    }

    const steps = buildStepsFromGraph(nodes, edges);

    const payload = {
      Version: '2020-12-01',
      Metadata: {},
      Parameters: [],
      PipelineName: `test-pipeline-${Date.now()}`,
      Steps: steps,
    };

    const dataStr = JSON.stringify(payload, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `pipeline-${Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [edges, nodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const kind = event.dataTransfer.getData('application/reactflow') as NodeKind;
      if (!kind) return;
      // const bounds = containerRef.current?.getBoundingClientRect();
      // const client = { x: event.clientX, y: event.clientY };
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      onCreateNode(kind, position);
    },
    [onCreateNode, screenToFlowPosition]
  );

  const onNodeClick: NodeMouseHandler<Node<AppNodeData>> = useCallback(
    (_, node) => {
      onSelectNode(node.id);
    },
    [onSelectNode]
  );

  const onPaneClick = useCallback(() => onSelectNode(null), [onSelectNode]);

  const handleImportJson = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        const steps = Array.isArray(json?.Steps) ? json.Steps : [];
        const { nodes: newNodes, edges: newEdges } = stepsToGraph(steps, {
          labelStrategy: 'byKind',
        });
        setNodes(newNodes);
        setEdges(newEdges);
        if (newNodes.length > 0) onSelectNode(newNodes[0].id);
      } catch (e) {
        console.error('Failed to import pipeline JSON', e);
      }
    },
    [onSelectNode, setEdges, setNodes]
  );

  const handlePipelineChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const pipeline = pipelines.find((p) => p.name === event.target.value);
    if (pipeline) setSelectedPipeline(pipeline);
  };

  useEffect(() => {
    if (
      selectedPipeline &&
      selectedPipeline.definition &&
      Array.isArray(selectedPipeline.definition.Steps)
    ) {
      const { nodes: newNodes, edges: newEdges } = stepsToGraph(selectedPipeline.definition.Steps, {
        labelStrategy: 'byDisplayName',
      });
      setNodes(newNodes);
      setEdges(newEdges);
      if (newNodes.length > 0) onSelectNode(newNodes[0].id);
    }
  }, [selectedPipeline]);

  // Topological sort utility moved to utils

  return (
    <main className="center-pane">
      <div className="canvas" ref={containerRef}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
        >
          {/* Left palette inside canvas */}
          <Panel position="top-left">
            <Sidebar />
          </Panel>

          {/* Right properties panel inside canvas */}
          {selectedNode && onChangeNodeData && (
            <Panel position="top-right">
                <PropertiesPanel
                  selectedNode={selectedNode}
                  onChangeNode={onChangeNodeData}
                  onClose={() => onSelectNode(null)}
                />
            </Panel>
          )}
          {/* <Panel position="top-left"> */}
          {/* <div style={{ display: 'grid', gap: 8 }}> */}
          {/* <div>Drag items from left onto the canvas</div> */}
          {/* <button onClick={exportConnectedSteps} style={{ width: 'fit-content' }}>
                Log Steps JSON
              </button> */}
          {/* </div> */}
          {/* </Panel> */}
          {/* Select pipeline */}
          <Panel position="top-right" style={{ background: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-end' }}>
              <select
                style={{
                  height: 42,
                  fontSize: 12,
                  padding: '0 4px',
                  borderRadius: 4,
                  border: '1px solid #888',
                }}
                id="pipeline-select"
                value={selectedPipeline.name}
                onChange={handlePipelineChange}
              >
                {pipelines.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStartTrainingPipeline}
                disabled={trainingStarting || !selectedPipeline}
                className="start-labeling-btn"
                title={!selectedPipeline ? 'Choose a pipeline first' : 'Start training'}
              >
                {trainingStarting ? 'Starting...' : 'Start Training Pipeline'}
              </button>
            </div>
          </Panel>
          <Panel position="bottom-left">
            <div className="bottom-left-panel">
              <h2 className="bottom-left-panel-header">Quick Actions</h2>
              {/* <button>Delete Step</button> */}
              <button onClick={exportConnectedSteps} disabled={creatingPipeline}>
                {creatingPipeline ? 'Creating...' : 'Create Training Pipeline'}
              </button>
              <button onClick={exportAsJSON}>Export JSON</button>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  border: '1px solid #888',
                  padding: '4px 8px',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                <span>Import JSON</span>
                <input
                  type="file"
                  accept="application/json"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImportJson(file);
                    e.currentTarget.value = '';
                  }}
                />
              </label>
            </div>
          </Panel>
          {/* <Controls /> */}
          {/* <MiniMap /> */}
          <Background />
        </ReactFlow>
      </div>
    </main>
  );
});
