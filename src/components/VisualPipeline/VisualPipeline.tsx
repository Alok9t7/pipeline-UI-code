import {
  type OnEdgesChange,
  type OnNodesChange,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import type { Edge, Node } from '@xyflow/react';
// import '@xyflow/react/dist/style.css';
import { useMemo, useState } from 'react';

import { FlowCanvas } from './FlowCanvas/FlowCanvas';
import './VisualPipeline.scss';
import type { AppNodeData, NodeKind } from './types';

function VisualPipelineInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<AppNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  const handleCreateNode = (kind: NodeKind, position: { x: number; y: number }) => {
    const id = `${Date.now()}`;
    const defaultData: AppNodeData = {
      kind,
      name: defaultNameForKind(kind),
      Name: defaultNameForKind(kind),
      label: labelForKind(kind),
      // type-specific defaults
      ...(kind === 'dataProcess' ? { Type: 'Processing' } : {}),
      ...(kind === 'trainModel' ? { Type: 'Training' } : {}),
      ...(kind === 'createModel' ? { Type: 'Model' } : {}),
      ...(kind === 'deployModelEndpoint' ? { Type: 'Endpoint' } : {}),
      ...(kind === 'deployModelBatchInference' ? { Type: 'Transform' } : {}),
    } as AppNodeData;

    const newNode: Node<AppNodeData> = {
      id,
      type: 'appNode',
      position,
      data: defaultData,
    };
    setNodes((prev) => prev.concat(newNode));
  };

  const handleUpdateNodeData = (id: string, updater: (data: AppNodeData) => AppNodeData) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, data: updater(n.data) } : n)));
  };

  return (
    <div className="app-shell">
      <FlowCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange as unknown as OnNodesChange<Node<AppNodeData>>}
        onEdgesChange={onEdgesChange as unknown as OnEdgesChange<Edge>}
        setEdges={setEdges}
        setNodes={setNodes}
        onSelectNode={setSelectedNodeId}
        onCreateNode={handleCreateNode}
        selectedNode={selectedNode}
        onChangeNodeData={handleUpdateNodeData}
      />
    </div>
  );
}

export default function VisualPipeline() {
  return (
    <ReactFlowProvider>
      <VisualPipelineInner />
    </ReactFlowProvider>
  );
}

function labelForKind(kind: NodeKind): string {
  switch (kind) {
    case 'dataProcess':
      return 'Data Process';
    case 'trainModel':
      return 'Train Model';
    case 'createModel':
      return 'Create Model';
    case 'deployModelEndpoint':
      return 'Deploy Model(endpoint)';
    case 'deployModelBatchInference':
      return 'Deploy Model(batch inference)';
  }
}

function defaultNameForKind(kind: NodeKind): string {
  switch (kind) {
    case 'dataProcess':
      return 'data-process';
    case 'trainModel':
      return 'train-model';
    case 'createModel':
      return 'create-model';
    case 'deployModelEndpoint':
      return 'deploy-model-endpoint';
    case 'deployModelBatchInference':
      return 'deploy-model-batch-inference';
  }
}
