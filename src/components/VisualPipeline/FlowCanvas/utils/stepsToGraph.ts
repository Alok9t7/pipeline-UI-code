import type { Edge, Node } from '@xyflow/react';

import type { AppNodeData, NodeKind, SageMakerStep, DeployModelEndpointData } from '../../types';
import { topoSortSteps } from './topoSort';

type LabelStrategy = 'byKind' | 'byDisplayName';

export function stepsToGraph(
  stepsInput: SageMakerStep[],
  options: { labelStrategy: LabelStrategy }
): { nodes: Node<AppNodeData>[]; edges: Edge[] } {
  const steps: SageMakerStep[] = Array.isArray(stepsInput) ? stepsInput : [];
  const createdAt = Date.now();
  const allowedTypes = [
    'Model',
    'Processing',
    'Training',
    'Transform',
    'Endpoint',
    'EndpointConfig',
  ];
  const filteredSteps: SageMakerStep[] = steps.filter((s) => allowedTypes.includes(s.Type));

  const sortedSteps = topoSortSteps(filteredSteps);

  const endpointConfigs = new Map<string, SageMakerStep>();
  const endpoints = new Map<string, SageMakerStep>();
  const otherSteps: SageMakerStep[] = [];
  for (const s of sortedSteps) {
    if (s.Type === 'EndpointConfig') endpointConfigs.set(s.Name, s);
    else if (s.Type === 'Endpoint') endpoints.set(s.Name, s);
    else otherSteps.push(s);
  }

  type NodeBuild = { stepNames: string[]; node: Node<AppNodeData> };
  const nodeBuilds: NodeBuild[] = [];

  endpoints.forEach((endpointStep, endpointStepName) => {
    const endpointConfigGetRef: string | undefined = (endpointStep?.Arguments?.EndpointConfigName as { Get?: string } | undefined)?.Get;
    const endpointConfigName = endpointConfigGetRef?.match(/^Steps\.(.+)\.EndpointConfigName$/)?.[1];
    const endpointConfigStep = endpointConfigName ? endpointConfigs.get(endpointConfigName) : undefined;
    const nodeIndex = nodeBuilds.length;
    const endpointArguments = (endpointStep.Arguments as { EndpointName?: string; EndpointConfigName?: { Get?: string } }) || {};
    type ProductionVariants = NonNullable<DeployModelEndpointData['Arguments']['EndpointConfig']>['ProductionVariants'];
    const endpointConfigArguments = (endpointConfigStep?.Arguments as { ProductionVariants?: ProductionVariants }) || {};
    
    nodeBuilds.push({
      stepNames: [endpointStepName as string, endpointConfigStep?.Name].filter(Boolean) as string[],
      node: {
        id: `${createdAt + nodeIndex}`,
        type: 'appNode',
        position: { x: 100, y: 120 + nodeIndex * 100 },
        data: {
          kind: 'deployModelEndpoint',
          name: endpointStep.Name,
          label: endpointStep.DisplayName || 'Deploy Model(endpoint)',
          Type: 'Endpoint',
          Name: endpointStep.Name,
          DisplayName: endpointStep.DisplayName || endpointStep.Name,
          Arguments: {
            EndpointName: endpointArguments.EndpointName ?? '',
            EndpointConfig: {
              ProductionVariants: endpointConfigArguments.ProductionVariants ?? [],
            },
          },
        } as AppNodeData,
      },
    });
  });

  for (const step of otherSteps) {
    let kind: NodeKind = 'dataProcess';
    if (step.Type === 'Processing') kind = 'dataProcess';
    else if (step.Type === 'Training') kind = 'trainModel';
    else if (step.Type === 'Model') kind = 'createModel';
    else if (step.Type === 'Transform') kind = 'deployModelBatchInference';
    const nodeIndex = nodeBuilds.length;
    const labelByKind =
      kind === 'dataProcess'
        ? 'Data Process'
        : kind === 'trainModel'
          ? 'Train Model'
          : kind === 'deployModelBatchInference'
            ? 'Deploy Model(batch inference)'
            : 'Create Model';
    nodeBuilds.push({
      stepNames: [step.Name],
      node: {
        id: `${createdAt + nodeIndex}`,
        type: 'appNode',
        position: { x: 100, y: 120 + nodeIndex * 100 },
        data: {
          kind,
          name: step.Name,
          label:
            options.labelStrategy === 'byKind' ? labelByKind : step.DisplayName || step.Name || step.Type,
          Type: step.Type,
          Name: step.Name,
          DisplayName: step.DisplayName || step.Name,
          Arguments: step.Arguments ?? {},
        } as unknown as AppNodeData,
      },
    });
  }
  // order nodes according to topological step order
  const stepNameOrder = sortedSteps.map((step) => step.Name);
  nodeBuilds.sort((a, b) => {
    const aIdx = Math.min(
      ...a.stepNames.map((n) => stepNameOrder.indexOf(n)).filter((i) => i >= 0)
    );
    const bIdx = Math.min(
      ...b.stepNames.map((n) => stepNameOrder.indexOf(n)).filter((i) => i >= 0)
    );
    return aIdx - bIdx;
  });
  // assign y positions based on topo order
  nodeBuilds.forEach((nb, idx) => {
    nb.node.position = { x: 100, y: 120 + idx * 100 };
  });

  const newNodes = nodeBuilds.map((nb) => nb.node);
  const nameToId = new Map<string, string>();
  nodeBuilds.forEach((nb) => nb.stepNames.forEach((nm) => nameToId.set(nm, nb.node.id)));
  const newEdges: Edge[] = [];
  filteredSteps.forEach((step) => {
    const targetId = nameToId.get(step.Name);
    if (!targetId) return;
    const deps: string[] = Array.isArray(step.DependsOn) ? step.DependsOn : [];
    for (const depName of deps) {
      const sourceId = nameToId.get(depName);
      if (!sourceId || sourceId === targetId) continue;
      const id = `${sourceId}->${targetId}`;
      if (!newEdges.find((e) => e.id === id))
        newEdges.push({ id, source: sourceId, target: targetId } as Edge);
    }
  });

  return { nodes: newNodes, edges: newEdges };
}
