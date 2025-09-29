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
  const handleModelNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        ModelName: { Get: e.target.value },
      },
    });

  const handleTransformInputS3UriChange = (e: React.ChangeEvent<HTMLInputElement>) =>
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
    });

  const handleTransformInputS3DataTypeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
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
    });

  const handleTransformInputContentTypeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        TransformInput: {
          ...data.Arguments?.TransformInput,
          ContentType: e.target.value,
        },
      },
    });

  const handleTransformInputCompressionTypeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        TransformInput: {
          ...data.Arguments?.TransformInput,
          CompressionType: e.target.value,
        },
      },
    });

  const handleTransformInputSplitTypeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        TransformInput: {
          ...data.Arguments?.TransformInput,
          SplitType: e.target.value,
        },
      },
    });

  const handleTransformOutputS3PathChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        TransformOutput: {
          ...data.Arguments?.TransformOutput,
          S3OutputPath: e.target.value,
        },
      },
    });

  const handleTransformResourcesInstanceTypeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        TransformResources: {
          ...data.Arguments?.TransformResources,
          InstanceType: e.target.value,
        },
      },
    });

  const handleTransformResourcesInstanceCountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        TransformResources: {
          ...data.Arguments?.TransformResources,
          InstanceCount: Number(e.target.value),
        },
      },
    });

  const handleDataCaptureDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        DataCaptureConfig: {
          ...data.Arguments?.DataCaptureConfig,
          DestinationS3Uri: e.target.value,
        },
      },
    });
  return (
    <>
      <div className="right-pane-header">Model Name</div>
      <LabeledField label="Model Name*">
        <input
          {...register('dmbi.modelName', { required: 'Required' })}
          value={data.Arguments?.ModelName?.Get ?? ''}
          onChange={handleModelNameChange}
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
          onChange={handleTransformInputS3UriChange}
        />
        {showError('dmbi.s3Uri') && (
          <small style={{ color: 'crimson' }}>{showError('dmbi.s3Uri')}</small>
        )}
      </LabeledField>
      <LabeledField label="S3 Data Type*">
        <input
          {...register('dmbi.s3DataType', { required: 'Required' })}
          value={data.Arguments?.TransformInput?.DataSource?.S3DataSource?.S3DataType ?? ''}
          onChange={handleTransformInputS3DataTypeChange}
        />
        {showError('dmbi.s3DataType') && (
          <small style={{ color: 'crimson' }}>{showError('dmbi.s3DataType')}</small>
        )}
      </LabeledField>
      <LabeledField label="Content Type">
        <input
          value={data.Arguments?.TransformInput?.ContentType ?? ''}
          onChange={handleTransformInputContentTypeChange}
        />
      </LabeledField>
      <LabeledField label="Compression Type">
        <input
          value={data.Arguments?.TransformInput?.CompressionType ?? ''}
          onChange={handleTransformInputCompressionTypeChange}
        />
      </LabeledField>
      <LabeledField label="Split Type">
        <input
          value={data.Arguments?.TransformInput?.SplitType ?? ''}
          onChange={handleTransformInputSplitTypeChange}
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
          onChange={handleTransformOutputS3PathChange}
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
          onChange={handleTransformResourcesInstanceTypeChange}
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
          onChange={handleTransformResourcesInstanceCountChange}
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
          onChange={handleDataCaptureDestinationChange}
        />
        {showError('dmbi.dataCaptureDestination') && (
          <small style={{ color: 'crimson' }}>{showError('dmbi.dataCaptureDestination')}</small>
        )}
      </LabeledField>
    </>
  );
}
