import type { SageMakerStep } from '../../types';

export function topoSortSteps(steps: SageMakerStep[]): SageMakerStep[] {
  const nameToStep = new Map<string, SageMakerStep>();
  steps.forEach((s: SageMakerStep) => nameToStep.set(s.Name, s));
  const visited = new Set<string>();
  const result: SageMakerStep[] = [];

  function visit(s: SageMakerStep) {
    if (visited.has(s.Name)) return;
    visited.add(s.Name);
    const deps: string[] = Array.isArray(s.DependsOn) ? s.DependsOn : [];
    deps.forEach((depName) => {
      const dep = nameToStep.get(depName);
      if (dep) visit(dep);
    });
    result.push(s);
  }

  steps.forEach((s) => visit(s));
  return result;
}
