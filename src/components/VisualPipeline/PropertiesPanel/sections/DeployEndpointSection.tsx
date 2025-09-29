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

  const handleEndpointNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...(data as any).Arguments,
        EndpointName: e.target.value,
      },
    } as any);

  const handlePvInstanceTypeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    ensurePv({ InstanceType: e.target.value });

  const handlePvInitialInstanceCountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    ensurePv({ InitialInstanceCount: Number(e.target.value) });

  const handlePvMaxInstanceCountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    ensurePv({
      ManagedInstanceScaling: {
        ...((data as any).Arguments?.EndpointConfig?.ProductionVariants?.[0]?.ManagedInstanceScaling ?? {}),
        MaxInstanceCount: Number(e.target.value),
      },
    });

  const handlePvModelNameGetChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    ensurePv({ ModelName: { Get: e.target.value } });

  const handlePvVariantNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    ensurePv({ VariantName: e.target.value });
  return (
    <>
      <div className="right-pane-header">Endpoint</div>
      <LabeledField label="Endpoint Name*">
        <input
          {...register('dme.endpointName', { required: 'Required' })}
          value={(data as any).Arguments?.EndpointName ?? ''}
          onChange={handleEndpointNameChange}
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
          onChange={handlePvInstanceTypeChange}
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
          onChange={handlePvInitialInstanceCountChange}
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
          onChange={handlePvMaxInstanceCountChange}
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
          onChange={handlePvModelNameGetChange}
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
          onChange={handlePvVariantNameChange}
        />
        {showError('dme.pvVariantName0') && (
          <small style={{ color: 'crimson' }}>{showError('dme.pvVariantName0')}</small>
        )}
      </LabeledField>
    </>
  );
}
