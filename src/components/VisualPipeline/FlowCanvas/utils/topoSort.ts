export function topoSortSteps(steps: any[]): any[] {
  const nameToStep = new Map<string, any>();
  steps.forEach((s: any) => nameToStep.set(s.Name, s));
  const visited = new Set<string>();
  const result: any[] = [];

  function visit(s: any) {
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
