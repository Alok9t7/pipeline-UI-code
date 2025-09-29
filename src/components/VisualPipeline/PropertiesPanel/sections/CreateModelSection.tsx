import { LabeledField } from '../../LabeledField/LabeledField';
import type { AppNodeData } from '../../types';

type Props = {
  data: AppNodeData & { kind: 'createModel' };
  register: any;
  showError: (name: string) => string | undefined;
  update: (partial: Partial<AppNodeData>) => void;
  environment: Record<string, string>;
  handleEnvChange: (key: string, value: string) => void;
  handleDeleteEnv: (key: string) => void;
  handleAddEnv: () => void;
};

export function CreateModelSection({
  data,
  register,
  showError,
  update,
  environment,
  handleEnvChange,
  handleDeleteEnv,
  handleAddEnv,
}: Props) {
  const handleExecutionRoleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        ExecutionRoleArn: e.target.value,
      },
    });

  const handleModelDataUrlGetChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        PrimaryContainer: {
          ...data.Arguments?.PrimaryContainer,
          ModelDataUrl: { Get: e.target.value },
        },
      },
    });

  const handlePrimaryContainerImageChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        PrimaryContainer: {
          ...data.Arguments?.PrimaryContainer,
          Image: e.target.value,
        },
      },
    });

  const modelDataUrlMode: 'step' | 'string' =
    typeof data.Arguments?.PrimaryContainer?.ModelDataUrl === 'string' ? 'string' : 'step';

  const handleModelDataUrlModeChange = (mode: 'step' | 'string') => {
    const current = data.Arguments?.PrimaryContainer?.ModelDataUrl;
    let nextValue: any;
    if (mode === 'step') {
      const existing = typeof current === 'object' && current?.Get ? current.Get : '';
      nextValue = { Get: existing };
    } else {
      const existing = typeof current === 'string' ? current : '';
      nextValue = existing;
    }
    update({
      Arguments: {
        ...data.Arguments,
        PrimaryContainer: {
          ...data.Arguments?.PrimaryContainer,
          ModelDataUrl: nextValue,
        },
      },
    });
  };

  const handleModelDataUrlStringChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        PrimaryContainer: {
          ...data.Arguments?.PrimaryContainer,
          ModelDataUrl: e.target.value,
        },
      },
    });

  const handleEnvKeyChangeFactory = (prevKey: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    const { [prevKey]: oldVal, ...rest } = environment;
    update({
      Arguments: {
        ...data.Arguments,
        PrimaryContainer: {
          ...data.Arguments?.PrimaryContainer,
          Environment: {
            ...rest,
            [newKey]: oldVal,
          },
        },
      },
    });
  };

  const handleEnvValueChangeFactory = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    handleEnvChange(key, e.target.value);
  };
  return (
    <>
      <div className="right-pane-header">Execution Role</div>
      <LabeledField label="IAM Role">
        <input
          {...register('cm.ExecutionRoleArn', { required: 'Required' })}
          value={data.Arguments?.ExecutionRoleArn ?? ''}
          onChange={handleExecutionRoleChange}
        />
        {showError('cm.ExecutionRoleArn') && (
          <small style={{ color: 'crimson' }}>{showError('cm.ExecutionRoleArn')}</small>
        )}
      </LabeledField>
      <div className="right-pane-header">Model (Input)</div>
      <LabeledField label="Source type">
        <select
          value={modelDataUrlMode}
          onChange={(e) => handleModelDataUrlModeChange(e.target.value as 'step' | 'string')}
        >
          <option value="step">Step variable</option>
          <option value="string">String</option>
        </select>
      </LabeledField>
      {modelDataUrlMode === 'step' ? (
        <LabeledField label="Step variable (e.g. Steps.Training.ModelArtifacts.S3ModelArtifacts)*">
          <input
            {...register('cm.ModelDataUrlGet', {
              required: 'Required',
              maxLength: { value: 1024, message: 'Must be at most 1024 characters' },
            })}
            value={
              typeof data.Arguments?.PrimaryContainer?.ModelDataUrl === 'object'
                ? data.Arguments?.PrimaryContainer?.ModelDataUrl?.Get ?? ''
                : ''
            }
            onChange={handleModelDataUrlGetChange}
          />
          {showError('cm.ModelDataUrlGet') && (
            <small style={{ color: 'crimson' }}>{showError('cm.ModelDataUrlGet')}</small>
          )}
        </LabeledField>
      ) : (
        <LabeledField label="S3 URI*">
          <input
            {...register('cm.ModelDataUrl', {
              required: 'Required',
              maxLength: { value: 1024, message: 'Must be at most 1024 characters' },
            })}
            value={
              typeof data.Arguments?.PrimaryContainer?.ModelDataUrl === 'string'
                ? data.Arguments?.PrimaryContainer?.ModelDataUrl
                : ''
            }
            onChange={handleModelDataUrlStringChange}
          />
          {showError('cm.ModelDataUrl') && (
            <small style={{ color: 'crimson' }}>{showError('cm.ModelDataUrl')}</small>
          )}
        </LabeledField>
      )}
      <div className="right-pane-header">Container</div>
      <LabeledField label="Location(ECR URI)">
        <input
          value={data.Arguments?.PrimaryContainer?.Image ?? ''}
          onChange={handlePrimaryContainerImageChange}
        />
      </LabeledField>
      <LabeledField label="Environment">
        <div>
          {Object.entries(environment).map(([key, value]) => (
            <div key={key} className="env-row">
              <input
                className="env-key-input"
                type="text"
                value={key}
                onChange={handleEnvKeyChangeFactory(key)}
              />
              <input
                className="env-value-input"
                type="text"
                value={value}
                onChange={handleEnvValueChangeFactory(key)}
              />
              <button className="delete-env" onClick={() => handleDeleteEnv(key)}>
                ❌
              </button>
            </div>
          ))}
        </div>
      </LabeledField>
      <button className="env-add-button" onClick={handleAddEnv}>
        Add
      </button>
    </>
  );
}
