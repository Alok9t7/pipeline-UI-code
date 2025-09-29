import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { memo } from 'react';

import type { AppNode } from '../types';

const AppNodeInner = memo(function AppNodeInner({ data }: NodeProps<AppNode>) {
  return (
    <div className={`app-node app-node-${data.kind.toLowerCase()}`}>
      <div className="app-node-title">{data.label}</div>
      {data.name && <div className="app-node-sub">{data.name}</div>}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

export { AppNodeInner as AppNode };
