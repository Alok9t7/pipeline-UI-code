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
  const handleExecutionRoleChange = (value: string) =>
    update({
      Arguments: {
        ...data.Arguments,
        ExecutionRoleArn: value,
      },
    });

  const handleModelDataUrlGetChange = (value: string) =>
    update({
      Arguments: {
        ...data.Arguments,
        PrimaryContainer: {
          ...data.Arguments?.PrimaryContainer,
          ModelDataUrl: { Get: value },
        },
      },
    });

  const handlePrimaryContainerImageChange = (value: string) =>
    update({
      Arguments: {
        ...data.Arguments,
        PrimaryContainer: {
          ...data.Arguments?.PrimaryContainer,
          Image: value,
        },
      },
    });
  return (
    <>
      <div className="right-pane-header">Execution Role</div>
      <LabeledField label="IAM Role">
        <input
          {...register('cm.ExecutionRoleArn', { required: 'Required' })}
          value={data.Arguments?.ExecutionRoleArn ?? ''}
          onChange={(e) => handleExecutionRoleChange(e.target.value)}
        />
        {showError('cm.ExecutionRoleArn') && (
          <small style={{ color: 'crimson' }}>{showError('cm.ExecutionRoleArn')}</small>
        )}
      </LabeledField>
      <div className="right-pane-header">Model (Input)</div>
      <LabeledField label="Location(S3 URI)*">
        <input
          {...register('cm.ModelDataUrlGet', {
            required: 'Required',
            // pattern: { value: s3OrHttpsRegex, message: 'Must be https:// or s3:// URI' },
            maxLength: { value: 1024, message: 'Must be at most 1024 characters' },
          })}
          value={data.Arguments?.PrimaryContainer?.ModelDataUrl?.Get ?? ''}
          onChange={(e) => handleModelDataUrlGetChange(e.target.value)}
        />
        {showError('cm.ModelDataUrlGet') && (
          <small style={{ color: 'crimson' }}>{showError('cm.ModelDataUrlGet')}</small>
        )}
      </LabeledField>
      <div className="right-pane-header">Container</div>
      <LabeledField label="Location(ECR URI)">
        <input
          value={data.Arguments?.PrimaryContainer?.Image ?? ''}
          onChange={(e) => handlePrimaryContainerImageChange(e.target.value)}
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
                onChange={(e) => {
                  const newKey = e.target.value;
                  const { [key]: oldVal, ...rest } = environment;
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
                }}
              />
              <input
                className="env-value-input"
                type="text"
                value={value}
                onChange={(e) => handleEnvChange(key, e.target.value)}
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
