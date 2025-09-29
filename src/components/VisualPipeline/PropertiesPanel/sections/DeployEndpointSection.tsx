import { LabeledField } from '../../LabeledField/LabeledField';
import type { AppNodeData } from '../../types';

type Props = {
  data: AppNodeData & { kind: 'deployModelEndpoint' };
  register: any;
  showError: (name: string) => string | undefined;
  update: (partial: Partial<AppNodeData>) => void;
};

export function DeployEndpointSection({ data, register, showError, update }: Props) {
  const ensurePv = (overrides: Partial<any>) => {
    const current = (data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0] ?? {};
    const pv = [
      {
        InitialInstanceCount: current.InitialInstanceCount ?? 1,
        ManagedInstanceScaling: current.ManagedInstanceScaling ?? {},
        InstanceType: current.InstanceType ?? '',
        ModelName: current.ModelName ?? { Get: '' },
        VariantName: current.VariantName ?? 'AllTraffic',
        ...overrides,
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
  };

  const handleEndpointNameChange = (value: string) =>
    update({
      Arguments: {
        ...(data as any).Arguments,
        EndpointName: value,
      },
    } as any);

  const handlePvInstanceTypeChange = (value: string) =>
    ensurePv({ InstanceType: value });

  const handlePvInitialInstanceCountChange = (value: string) =>
    ensurePv({ InitialInstanceCount: Number(value) });

  const handlePvMaxInstanceCountChange = (value: string) =>
    ensurePv({
      ManagedInstanceScaling: {
        ...((data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]?.ManagedInstanceScaling ?? {}),
        MaxInstanceCount: Number(value),
      },
    });

  const handlePvModelNameGetChange = (value: string) =>
    ensurePv({ ModelName: { Get: value } });

  const handlePvVariantNameChange = (value: string) =>
    ensurePv({ VariantName: value });
  return (
    <>
      <div className="right-pane-header">Endpoint</div>
      <LabeledField label="Endpoint Name*">
        <input
          {...register('dme.endpointName', { required: 'Required' })}
          value={(data as any).Arguments?.EndpointName ?? ''}
          onChange={(e) => handleEndpointNameChange(e.target.value)}
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
          onChange={(e) => handlePvInstanceTypeChange(e.target.value)}
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
          onChange={(e) => handlePvInitialInstanceCountChange(e.target.value)}
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
          onChange={(e) => handlePvMaxInstanceCountChange(e.target.value)}
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
          onChange={(e) => handlePvModelNameGetChange(e.target.value)}
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
          onChange={(e) => handlePvVariantNameChange(e.target.value)}
        />
        {showError('dme.pvVariantName0') && (
          <small style={{ color: 'crimson' }}>{showError('dme.pvVariantName0')}</small>
        )}
      </LabeledField>
    </>
  );
}
