import { LabeledField } from '../../LabeledField/LabeledField';
import type { AppNodeData } from '../../types';

type Props = {
  data: AppNodeData & { kind: 'deployModelEndpoint' };
  register: any;
  showError: (name: string) => string | undefined;
  update: (partial: Partial<AppNodeData>) => void;
};

export function DeployEndpointSection({ data, register, showError, update }: Props) {
  return (
    <>
      <div className="right-pane-header">Endpoint</div>
      <LabeledField label="Endpoint Name*">
        <input
          {...register('dme.endpointName', { required: 'Required' })}
          value={(data as any).Arguments?.EndpointName ?? ''}
          onChange={(e) =>
            update({
              Arguments: {
                ...(data as any).Arguments,
                EndpointName: e.target.value,
              },
            } as any)
          }
        />
        {showError('dme.endpointName') && (
          <small style={{ color: 'crimson' }}>{showError('dme.endpointName')}</small>
        )}
      </LabeledField>
      <div className="right-pane-header">Production Variant</div>
      <LabeledField label="Instance Type*">
        <input
          {...register('dme.pvInstanceType0', { required: 'Required' })}
          value={
            (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]?.InstanceType ?? ''
          }
          onChange={(e) => {
            const pv = [
              {
                InitialInstanceCount:
                  (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]
                    ?.InitialInstanceCount ?? 1,
                ManagedInstanceScaling:
                  (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]
                    ?.ManagedInstanceScaling ?? {},
                InstanceType: e.target.value,
                ModelName: (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]
                  ?.ModelName ?? {
                  Get: '',
                },
                VariantName:
                  (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]?.VariantName ??
                  'AllTraffic',
              },
            ];
            update({
              Arguments: {
                ...(data as any).Arguments,
                EndpointConfig: {
                  ProductionVariants: pv,
                },
              },
            } as any);
          }}
        />
        {showError('dme.pvInstanceType0') && (
          <small style={{ color: 'crimson' }}>{showError('dme.pvInstanceType0')}</small>
        )}
      </LabeledField>
      <LabeledField label="Initial Instance Count*">
        <input
          type="number"
          {...register('dme.pvInitial0', { required: 'Required', valueAsNumber: true })}
          value={
            (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]
              ?.InitialInstanceCount ?? 1
          }
          onChange={(e) => {
            const pv = [
              {
                InitialInstanceCount: Number(e.target.value),
                ManagedInstanceScaling:
                  (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]
                    ?.ManagedInstanceScaling ?? {},
                InstanceType:
                  (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]?.InstanceType ??
                  '',
                ModelName: (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]
                  ?.ModelName ?? {
                  Get: '',
                },
                VariantName:
                  (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]?.VariantName ??
                  'AllTraffic',
              },
            ];
            update({
              Arguments: {
                ...(data as any).Arguments,
                EndpointConfig: {
                  ProductionVariants: pv,
                },
              },
            } as any);
          }}
        />
        {showError('dme.pvInitial0') && (
          <small style={{ color: 'crimson' }}>{showError('dme.pvInitial0')}</small>
        )}
      </LabeledField>
      <LabeledField label="Max Instance Count">
        <input
          type="number"
          {...register('dme.pvMax0', { valueAsNumber: true })}
          value={
            (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]?.ManagedInstanceScaling
              ?.MaxInstanceCount ?? ''
          }
          onChange={(e) => {
            const current = (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0] ?? {};
            const pv = [
              {
                InitialInstanceCount: current.InitialInstanceCount ?? 1,
                ManagedInstanceScaling: {
                  ...(current.ManagedInstanceScaling ?? {}),
                  MaxInstanceCount: Number(e.target.value),
                },
                InstanceType: current.InstanceType ?? '',
                ModelName: current.ModelName ?? { Get: '' },
                VariantName: current.VariantName ?? 'AllTraffic',
              },
            ];
            update({
              Arguments: {
                ...(data as any).Arguments,
                EndpointConfig: {
                  ProductionVariants: pv,
                },
              },
            } as any);
          }}
        />
        {showError('dme.pvMax0') && (
          <small style={{ color: 'crimson' }}>{showError('dme.pvMax0')}</small>
        )}
      </LabeledField>
      <LabeledField label="Model Name (Get)*">
        <input
          {...register('dme.pvModelNameGet0', { required: 'Required' })}
          value={
            (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]?.ModelName?.Get ?? ''
          }
          onChange={(e) => {
            const pv = [
              {
                InitialInstanceCount:
                  (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]
                    ?.InitialInstanceCount ?? 1,
                ManagedInstanceScaling:
                  (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]
                    ?.ManagedInstanceScaling ?? {},
                InstanceType:
                  (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]?.InstanceType ??
                  '',
                ModelName: { Get: e.target.value },
                VariantName:
                  (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]?.VariantName ??
                  'AllTraffic',
              },
            ];
            update({
              Arguments: {
                ...(data as any).Arguments,
                EndpointConfig: {
                  ProductionVariants: pv,
                },
              },
            } as any);
          }}
        />
        {showError('dme.pvModelNameGet0') && (
          <small style={{ color: 'crimson' }}>{showError('dme.pvModelNameGet0')}</small>
        )}
      </LabeledField>
      <LabeledField label="Variant Name*">
        <input
          {...register('dme.pvVariantName0', { required: 'Required' })}
          value={
            (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]?.VariantName ??
            'AllTraffic'
          }
          onChange={(e) => {
            const pv = [
              {
                InitialInstanceCount:
                  (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]
                    ?.InitialInstanceCount ?? 1,
                ManagedInstanceScaling:
                  (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]
                    ?.ManagedInstanceScaling ?? {},
                InstanceType:
                  (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]?.InstanceType ??
                  '',
                ModelName: (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]
                  ?.ModelName ?? {
                  Get: '',
                },
                VariantName: e.target.value,
              },
            ];
            update({
              Arguments: {
                ...(data as any).Arguments,
                EndpointConfig: {
                  ProductionVariants: pv,
                },
              },
            } as any);
          }}
        />
        {showError('dme.pvVariantName0') && (
          <small style={{ color: 'crimson' }}>{showError('dme.pvVariantName0')}</small>
        )}
      </LabeledField>
    </>
  );
}
