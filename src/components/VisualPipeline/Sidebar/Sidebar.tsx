import { memo } from 'react';

import '../VisualPipeline.scss';
import type { NodeKind } from '../types';

const items: { kind: NodeKind; label: string }[] = [
  { kind: 'dataProcess', label: 'Data Process' },
  { kind: 'trainModel', label: 'Train Model' },
  { kind: 'createModel', label: 'Create Model' },
  { kind: 'deployModelEndpoint', label: 'Deploy Model(endpoint)' },
  { kind: 'deployModelBatchInference', label: 'Deploy Model(batch inference)' },
];

export const Sidebar = memo(function Sidebar() {
  const onDragStart = (event: React.DragEvent, kind: NodeKind) => {
    event.dataTransfer.setData('application/reactflow', kind);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="left-pane">
      <div className="left-pane-header">Pipeline step types</div>
      <div className="left-pane-content">
        {items.map((it) => (
          <div
            key={it.kind}
            className="palette-item"
            draggable
            onDragStart={(e) => onDragStart(e, it.kind)}
          >
            {it.label}
          </div>
        ))}
      </div>
    </aside>
  );
});
