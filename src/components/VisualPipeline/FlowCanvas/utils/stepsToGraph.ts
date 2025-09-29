import type { Edge, Node } from '@xyflow/react';

import type { AppNodeData, NodeKind } from '../../types';
import { topoSortSteps } from './topoSort';

type LabelStrategy = 'byKind' | 'byDisplayName';

export function stepsToGraph(
  stepsInput: any[],
  options: { labelStrategy: LabelStrategy }
): { nodes: Node<AppNodeData>[]; edges: Edge[] } {
  const steps = Array.isArray(stepsInput) ? stepsInput : [];
  const createdAt = Date.now();
  const allowedTypes = [
    'Model',
    'Processing',
    'Training',
    'Transform',
    'Endpoint',
    'EndpointConfig',
  ];
  const filteredSteps = steps.filter((s: any) => allowedTypes.includes(s.Type));

  const sortedSteps = topoSortSteps(filteredSteps);

  const endpointConfigs = new Map<string, any>();
  const endpoints = new Map<string, any>();
  const otherSteps: any[] = [];
  for (const s of sortedSteps) {
    if (s.Type === 'EndpointConfig') endpointConfigs.set(s.Name, s);
    else if (s.Type === 'Endpoint') endpoints.set(s.Name, s);
    else otherSteps.push(s);
  }

  type NodeBuild = { stepNames: string[]; node: Node<AppNodeData> };
  const nodeBuilds: NodeBuild[] = [];

  endpoints.forEach((ep, epName) => {
    const getRef: string | undefined = ep?.Arguments?.EndpointConfigName?.Get;
    const configName = getRef?.match(/^Steps\.(.+)\.EndpointConfigName$/)?.[1];
    const ec = configName ? endpointConfigs.get(configName) : undefined;
    const idx = nodeBuilds.length;
    nodeBuilds.push({
      stepNames: [epName as string, ec?.Name].filter(Boolean) as string[],
      node: {
        id: `${createdAt + idx}`,
        type: 'appNode',
        position: { x: 100, y: 120 + idx * 100 },
        data: {
          kind: 'deployModelEndpoint',
          name: ep.Name,
          label: ep.DisplayName || 'Deploy Model(endpoint)',
          Type: 'Endpoint',
          Name: ep.Name,
          DisplayName: ep.DisplayName || ep.Name,
          Arguments: {
            EndpointName: ep?.Arguments?.EndpointName ?? '',
            EndpointConfig: {
              ProductionVariants: ec?.Arguments?.ProductionVariants ?? [],
            },
          },
        } as any,
      },
    });
  });

  for (const s of otherSteps) {
    let kind: NodeKind = 'dataProcess';
    if (s.Type === 'Processing') kind = 'dataProcess';
    else if (s.Type === 'Training') kind = 'trainModel';
    else if (s.Type === 'Model') kind = 'createModel';
    else if (s.Type === 'Transform') kind = 'deployModelBatchInference';
    const idx = nodeBuilds.length;
    const labelByKind =
      kind === 'dataProcess'
        ? 'Data Process'
        : kind === 'trainModel'
          ? 'Train Model'
          : kind === 'deployModelBatchInference'
            ? 'Deploy Model(batch inference)'
            : 'Create Model';
    nodeBuilds.push({
      stepNames: [s.Name],
      node: {
        id: `${createdAt + idx}`,
        type: 'appNode',
        position: { x: 100, y: 120 + idx * 100 },
        data: {
          kind,
          name: s.Name,
          label:
            options.labelStrategy === 'byKind' ? labelByKind : s.DisplayName || s.Name || s.Type,
          Type: s.Type,
          Name: s.Name,
          DisplayName: s.DisplayName || s.Name,
          Arguments: s.Arguments ?? {},
        } as any,
      },
    });
  }
  // order nodes according to topological step order
  const stepNameOrder = sortedSteps.map((s: any) => s.Name);
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
  filteredSteps.forEach((s: any) => {
    const targetId = nameToId.get(s.Name);
    if (!targetId) return;
    const deps: string[] = Array.isArray(s.DependsOn) ? s.DependsOn : [];
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
