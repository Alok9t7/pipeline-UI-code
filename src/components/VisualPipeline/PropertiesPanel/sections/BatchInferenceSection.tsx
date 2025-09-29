import { LabeledField } from '../../LabeledField/LabeledField';
import type { AppNodeData } from '../../types';

type Props = {
  data: AppNodeData & { kind: 'deployModelBatchInference' };
  register: any;
  showError: (name: string) => string | undefined;
  update: (partial: Partial<AppNodeData>) => void;
  s3OrHttpsRegex: RegExp;
};

export function BatchInferenceSection({
  data,
  register,
  showError,
  update,
  s3OrHttpsRegex,
}: Props) {
  return (
    <>
      <div className="right-pane-header">Model Name</div>
      <LabeledField label="Model Name*">
        <input
          {...register('dmbi.modelName', { required: 'Required' })}
          value={data.Arguments?.ModelName?.Get ?? ''}
          onChange={(e) =>
            update({
              Arguments: {
                ...data.Arguments,
                ModelName: { Get: e.target.value },
              },
            })
          }
        />
        {showError('dmbi.modelName') && (
          <small style={{ color: 'crimson' }}>{showError('dmbi.modelName')}</small>
        )}
      </LabeledField>
      <div className="right-pane-header">Transform Input</div>
      <LabeledField label="S3 URI*">
        <input
          {...register('dmbi.s3Uri', {
            required: 'Required',
            pattern: { value: s3OrHttpsRegex, message: 'Must be https:// or s3:// URI' },
            maxLength: { value: 1024, message: 'Must be at most 1024 characters' },
          })}
          value={data.Arguments?.TransformInput?.DataSource?.S3DataSource?.S3Uri ?? ''}
          onChange={(e) =>
            update({
              Arguments: {
                ...data.Arguments,
                TransformInput: {
                  ...data.Arguments?.TransformInput,
                  DataSource: {
                    S3DataSource: {
                      ...data.Arguments?.TransformInput?.DataSource?.S3DataSource,
                      S3Uri: e.target.value,
                    },
                  },
                },
              },
            })
          }
        />
        {showError('dmbi.s3Uri') && (
          <small style={{ color: 'crimson' }}>{showError('dmbi.s3Uri')}</small>
        )}
      </LabeledField>
      <LabeledField label="S3 Data Type*">
        <input
          {...register('dmbi.s3DataType', { required: 'Required' })}
          value={data.Arguments?.TransformInput?.DataSource?.S3DataSource?.S3DataType ?? ''}
          onChange={(e) =>
            update({
              Arguments: {
                ...data.Arguments,
                TransformInput: {
                  ...data.Arguments?.TransformInput,
                  DataSource: {
                    S3DataSource: {
                      ...data.Arguments?.TransformInput?.DataSource?.S3DataSource,
                      S3DataType: e.target.value,
                    },
                  },
                },
              },
            })
          }
        />
        {showError('dmbi.s3DataType') && (
          <small style={{ color: 'crimson' }}>{showError('dmbi.s3DataType')}</small>
        )}
      </LabeledField>
      <LabeledField label="Content Type">
        <input
          value={data.Arguments?.TransformInput?.ContentType ?? ''}
          onChange={(e) =>
            update({
              Arguments: {
                ...data.Arguments,
                TransformInput: {
                  ...data.Arguments?.TransformInput,
                  ContentType: e.target.value,
                },
              },
            })
          }
        />
      </LabeledField>
      <LabeledField label="Compression Type">
        <input
          value={data.Arguments?.TransformInput?.CompressionType ?? ''}
          onChange={(e) =>
            update({
              Arguments: {
                ...data.Arguments,
                TransformInput: {
                  ...data.Arguments?.TransformInput,
                  CompressionType: e.target.value,
                },
              },
            })
          }
        />
      </LabeledField>
      <LabeledField label="Split Type">
        <input
          value={data.Arguments?.TransformInput?.SplitType ?? ''}
          onChange={(e) =>
            update({
              Arguments: {
                ...data.Arguments,
                TransformInput: {
                  ...data.Arguments?.TransformInput,
                  SplitType: e.target.value,
                },
              },
            })
          }
        />
      </LabeledField>
      <div className="right-pane-header">Transform Output</div>
      <LabeledField label="S3 Output Path*">
        <input
          {...register('dmbi.s3OutputPath', {
            required: 'Required',
            pattern: { value: s3OrHttpsRegex, message: 'Must be https:// or s3:// URI' },
            maxLength: { value: 1024, message: 'Must be at most 1024 characters' },
          })}
          value={data.Arguments?.TransformOutput?.S3OutputPath ?? ''}
          onChange={(e) =>
            update({
              Arguments: {
                ...data.Arguments,
                TransformOutput: {
                  ...data.Arguments?.TransformOutput,
                  S3OutputPath: e.target.value,
                },
              },
            })
          }
        />
        {showError('dmbi.s3OutputPath') && (
          <small style={{ color: 'crimson' }}>{showError('dmbi.s3OutputPath')}</small>
        )}
      </LabeledField>
      <div className="right-pane-header">Transform Resources</div>
      <LabeledField label="Instance Type*">
        <input
          {...register('dmbi.instanceType', { required: 'Required' })}
          value={data.Arguments?.TransformResources?.InstanceType ?? ''}
          onChange={(e) =>
            update({
              Arguments: {
                ...data.Arguments,
                TransformResources: {
                  ...data.Arguments?.TransformResources,
                  InstanceType: e.target.value,
                },
              },
            })
          }
        />
        {showError('dmbi.instanceType') && (
          <small style={{ color: 'crimson' }}>{showError('dmbi.instanceType')}</small>
        )}
      </LabeledField>
      <LabeledField label="Instance Count*">
        <input
          type="number"
          {...register('dmbi.instanceCount', {
            required: 'Required',
            min: { value: 1, message: 'Must be at least 1' },
            valueAsNumber: true,
          })}
          value={data.Arguments?.TransformResources?.InstanceCount ?? 0}
          onChange={(e) =>
            update({
              Arguments: {
                ...data.Arguments,
                TransformResources: {
                  ...data.Arguments?.TransformResources,
                  InstanceCount: Number(e.target.value),
                },
              },
            })
          }
        />
        {showError('dmbi.instanceCount') && (
          <small style={{ color: 'crimson' }}>{showError('dmbi.instanceCount')}</small>
        )}
      </LabeledField>
      <div className="right-pane-header">Data Capture</div>
      <LabeledField label="Destination S3 URI">
        <input
          {...register('dmbi.dataCaptureDestination', {
            pattern: { value: s3OrHttpsRegex, message: 'Must be https:// or s3:// URI' },
            maxLength: { value: 1024, message: 'Must be at most 1024 characters' },
          })}
          value={data.Arguments?.DataCaptureConfig?.DestinationS3Uri ?? ''}
          onChange={(e) =>
            update({
              Arguments: {
                ...data.Arguments,
                DataCaptureConfig: {
                  ...data.Arguments?.DataCaptureConfig,
                  DestinationS3Uri: e.target.value,
                },
              },
            })
          }
        />
        {showError('dmbi.dataCaptureDestination') && (
          <small style={{ color: 'crimson' }}>{showError('dmbi.dataCaptureDestination')}</small>
        )}
      </LabeledField>
    </>
  );
}
