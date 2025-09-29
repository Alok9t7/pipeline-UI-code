import { LabeledField } from '../../LabeledField/LabeledField';
import type { AppNodeData } from '../../types';

type Props = {
  data: AppNodeData & { kind: 'trainModel' };
  register: any;
  showError: (name: string) => string | undefined;
  update: (partial: Partial<AppNodeData>) => void;
  trainingInputs: any[];
  addTrainDatasetsInputModal: boolean;
  openTrainDatasetsInputModal: () => void;
  closeTrainDatasetsInputModal: () => void;
  editTrainingInputIndex: number | null;
  setEditTrainingInputIndex: (i: number | null) => void;
  handleSaveTrainingInput: (
    payload: {
      channelName: string;
      s3DataType: string;
      s3Uri: string;
      s3DataDistributionType?: string;
    },
    editIndex: number | null
  ) => void;
  handleDeleteTrainingInput: (index: number) => void;
  TrainDatasetsInputModal: any;
  s3OrHttpsRegex: RegExp;
};

export function TrainModelSection(props: Props) {
  const {
    data,
    register,
    showError,
    update,
    trainingInputs,
    addTrainDatasetsInputModal,
    openTrainDatasetsInputModal,
    closeTrainDatasetsInputModal,
    editTrainingInputIndex,
    setEditTrainingInputIndex,
    handleSaveTrainingInput,
    handleDeleteTrainingInput,
    TrainDatasetsInputModal,
    s3OrHttpsRegex,
  } = props;

  const handleS3OutputPathChange = (value: string) =>
    update({
      Arguments: {
        ...data.Arguments,
        OutputDataConfig: {
          ...data.Arguments?.OutputDataConfig,
          S3OutputPath: value,
        },
      },
    });

  const handleTrainingImageChange = (value: string) =>
    update({
      Arguments: {
        ...data.Arguments,
        AlgorithmSpecification: {
          ...data.Arguments?.AlgorithmSpecification,
          TrainingImage: value,
        },
      },
    });

  const handleTrainingInputModeChange = (value: string) =>
    update({
      Arguments: {
        ...data.Arguments,
        AlgorithmSpecification: {
          ...data.Arguments?.AlgorithmSpecification,
          TrainingInputMode: value,
        },
      },
    });

  const handleRoleArnChange = (value: string) =>
    update({
      Arguments: {
        ...data.Arguments,
        RoleArn: value,
      },
    });

  const handleRcInstanceTypeChange = (value: string) =>
    update({
      Arguments: {
        ...data.Arguments,
        ResourceConfig: {
          ...data.Arguments?.ResourceConfig,
          InstanceType: value,
        },
      },
    });

  const handleRcInstanceCountChange = (value: string) =>
    update({
      Arguments: {
        ...data.Arguments,
        ResourceConfig: {
          ...data.Arguments?.ResourceConfig,
          InstanceCount: Number(value),
        },
      },
    });

  const handleRcVolumeSizeChange = (value: string) =>
    update({
      Arguments: {
        ...data.Arguments,
        ResourceConfig: {
          ...data.Arguments?.ResourceConfig,
          VolumeSizeInGB: Number(value),
        },
      },
    });

  const handleStoppingMaxChange = (value: string) =>
    update({
      Arguments: {
        ...data.Arguments,
        StoppingCondition: {
          ...data.Arguments?.StoppingCondition,
          MaxRuntimeInSeconds: Number(value),
        },
      },
    });

  return (
    <>
      <div className="right-pane-header">Dataset (Input)</div>
      <div className="dataset-input-container">
        {trainingInputs.length === 0 ? (
          <div>
            <h4 className="input-heading">No datasets.</h4>
            <p className="input-desc">No datasets have been added to this step yet.</p>
          </div>
        ) : (
          <div className="dataset-list">
            {trainingInputs.map((inp, idx) => (
              <div key={idx} className="dataset-item">
                <p className="dataset-name">{inp.ChannelName}</p>
                <div className="dataset-item-actions">
                  <button
                    onClick={() => {
                      setEditTrainingInputIndex(idx);
                      openTrainDatasetsInputModal();
                    }}
                  >
                    &#9998;
                  </button>
                  <button onClick={() => handleDeleteTrainingInput(idx)}>X</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => {
            setEditTrainingInputIndex(null);
            openTrainDatasetsInputModal();
          }}
        >
          Add
        </button>
      </div>
      <TrainDatasetsInputModal
        isOpen={addTrainDatasetsInputModal}
        onClose={closeTrainDatasetsInputModal}
        onSave={handleSaveTrainingInput}
        editIndex={editTrainingInputIndex}
        initialValues={
          editTrainingInputIndex != null
            ? {
                channelName: trainingInputs[editTrainingInputIndex]?.ChannelName,
                s3DataType:
                  trainingInputs[editTrainingInputIndex]?.DataSource?.S3DataSource?.S3DataType,
                s3Uri: trainingInputs[editTrainingInputIndex]?.DataSource?.S3DataSource?.S3Uri,
                s3DataDistributionType:
                  trainingInputs[editTrainingInputIndex]?.DataSource?.S3DataSource
                    ?.S3DataDistributionType,
              }
            : undefined
        }
      />
      <div className="right-pane-header">Model(Output)</div>
      <LabeledField label="Location(S3 URI)*">
        <input
          {...register('tm.S3OutputPath', {
            required: 'Required',
            pattern: {
              value: s3OrHttpsRegex,
              message: 'Must be https:// or s3:// URI',
            },
          })}
          value={data.Arguments?.OutputDataConfig?.S3OutputPath ?? ''}
          onChange={(e) => handleS3OutputPathChange(e.target.value)}
        />
        {showError('tm.S3OutputPath') && (
          <small style={{ color: 'crimson' }}>{showError('tm.S3OutputPath')}</small>
        )}
      </LabeledField>
      <div className="right-pane-header">Algorithm Configuration</div>
      <LabeledField label="Location (ECR URI)*">
        <input
          {...register('tm.TrainingImage', { required: 'Required' })}
          value={data.Arguments?.AlgorithmSpecification?.TrainingImage ?? ''}
          onChange={(e) => handleTrainingImageChange(e.target.value)}
        />
        {showError('tm.TrainingImage') && (
          <small style={{ color: 'crimson' }}>{showError('tm.TrainingImage')}</small>
        )}
      </LabeledField>
      <LabeledField label="Input Mode*">
        <input
          {...register('tm.TrainingInputMode', { required: 'Required' })}
          value={data.Arguments?.AlgorithmSpecification?.TrainingInputMode ?? ''}
          onChange={(e) => handleTrainingInputModeChange(e.target.value)}
        />
        {showError('tm.TrainingInputMode') && (
          <small style={{ color: 'crimson' }}>{showError('tm.TrainingInputMode')}</small>
        )}
      </LabeledField>
      <div className="right-pane-header">Execution Role</div>
      <LabeledField label="IAM Role">
        <input
          value={data.Arguments?.RoleArn ?? ''}
          onChange={(e) => handleRoleArnChange(e.target.value)}
        />
      </LabeledField>
      <div className="right-pane-header">Instance</div>
      <LabeledField label="Type*">
        <input
          {...register('tm.InstanceType', { required: 'Required' })}
          value={data.Arguments?.ResourceConfig?.InstanceType ?? ''}
          onChange={(e) => handleRcInstanceTypeChange(e.target.value)}
        />
        {showError('tm.InstanceType') && (
          <small style={{ color: 'crimson' }}>{showError('tm.InstanceType')}</small>
        )}
      </LabeledField>
      <LabeledField label="Count*">
        <input
          type="number"
          {...register('tm.InstanceCount', {
            required: 'Required',
            min: { value: 1, message: 'Must be at least 1' },
            valueAsNumber: true,
          })}
          value={data.Arguments?.ResourceConfig?.InstanceCount ?? 0}
          onChange={(e) => handleRcInstanceCountChange(e.target.value)}
        />
        {showError('tm.InstanceCount') && (
          <small style={{ color: 'crimson' }}>{showError('tm.InstanceCount')}</small>
        )}
      </LabeledField>
      <LabeledField label="Additional storage per instance (GB)*">
        <input
          type="number"
          {...register('tm.VolumeSizeInGB', {
            required: 'Required',
            min: { value: 1, message: 'Must be at least 1' },
            valueAsNumber: true,
          })}
          value={data.Arguments?.ResourceConfig?.VolumeSizeInGB ?? 0}
          onChange={(e) => handleRcVolumeSizeChange(e.target.value)}
        />
        {showError('tm.VolumeSizeInGB') && (
          <small style={{ color: 'crimson' }}>{showError('tm.VolumeSizeInGB')}</small>
        )}
      </LabeledField>
      <div className="right-pane-header">Configurations</div>
      <LabeledField label="Stopping condition (max runtime in seconds)*">
        <input
          type="number"
          {...register('tm.MaxRuntimeInSeconds', {
            required: 'Required',
            min: { value: 1, message: 'Must be at least 1' },
            valueAsNumber: true,
          })}
          value={data.Arguments?.StoppingCondition?.MaxRuntimeInSeconds ?? 0}
          onChange={(e) => handleStoppingMaxChange(e.target.value)}
        />
        {showError('tm.MaxRuntimeInSeconds') && (
          <small style={{ color: 'crimson' }}>{showError('tm.MaxRuntimeInSeconds')}</small>
        )}
      </LabeledField>
    </>
  );
}
