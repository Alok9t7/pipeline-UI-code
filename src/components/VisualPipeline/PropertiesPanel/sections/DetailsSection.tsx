import { LabeledField } from '../../LabeledField/LabeledField';
import type { AppNodeData } from '../../types';
import { nameRegex } from '../../validation';

type Props = {
  data: AppNodeData;
  register: any;
  showError: (name: string) => string | undefined;
  update: <K extends AppNodeData['kind']>(
    partial: Partial<Extract<AppNodeData, { kind: K }>>
  ) => void;
};

export function DetailsSection({ data, register, showError, update }: Props) {
  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({ name: e.target.value });
  const handlePipelineNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({ Name: e.target.value } as any);
  return (
    <>
      <LabeledField label="Step type">
        <input value={data.label} disabled readOnly />
      </LabeledField>
      <LabeledField label="Display name">
        <input value={data.name ?? ''} onChange={handleDisplayNameChange} />
      </LabeledField>
      <LabeledField label="Pipeline step Name*">
        <input
          {...register('common.Name', {
            required: 'Required',
            pattern: { value: nameRegex, message: 'Must match ^[A-Za-z0-9\\-_]{1,64}$' },
          })}
          value={(data as any).Name ?? ''}
          onChange={handlePipelineNameChange}
        />
        {showError('common.Name') && (
          <small style={{ color: 'crimson' }}>{showError('common.Name')}</small>
        )}
      </LabeledField>
    </>
  );
}
