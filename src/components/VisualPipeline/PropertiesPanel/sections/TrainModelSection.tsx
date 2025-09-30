import { LabeledField } from '../../LabeledField/LabeledField';
import type { AppNodeData, FormRegister, ShowErrorFunction, NodeUpdateFunction, TrainingInput, TrainDatasetsInputModalComponent } from '../../types';

type Props = {
  data: AppNodeData & { kind: 'trainModel' };
  register: FormRegister;
  showError: ShowErrorFunction;
  update: NodeUpdateFunction;
  trainingInputs: TrainingInput[];
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
  TrainDatasetsInputModal: TrainDatasetsInputModalComponent;
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

  const handleS3OutputPathChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        OutputDataConfig: {
          ...data.Arguments?.OutputDataConfig,
          S3OutputPath: e.target.value,
        },
      },
    });

  const handleTrainingImageChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        AlgorithmSpecification: {
          ...data.Arguments?.AlgorithmSpecification,
          TrainingImage: e.target.value,
        },
      },
    });

  const handleTrainingInputModeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        AlgorithmSpecification: {
          ...data.Arguments?.AlgorithmSpecification,
          TrainingInputMode: e.target.value,
        },
      },
    });

  const handleRoleArnChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        RoleArn: e.target.value,
      },
    });

  const handleRcInstanceTypeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        ResourceConfig: {
          ...data.Arguments?.ResourceConfig,
          InstanceType: e.target.value,
        },
      },
    });

  const handleRcInstanceCountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        ResourceConfig: {
          ...data.Arguments?.ResourceConfig,
          InstanceCount: Number(e.target.value),
        },
      },
    });

  const handleRcVolumeSizeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        ResourceConfig: {
          ...data.Arguments?.ResourceConfig,
          VolumeSizeInGB: Number(e.target.value),
        },
      },
    });

  const handleStoppingMaxChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        StoppingCondition: {
          ...data.Arguments?.StoppingCondition,
          MaxRuntimeInSeconds: Number(e.target.value),
        },
      },
    });

  
  const handleEditTrainingInputClick = (index: number) => () => {
    setEditTrainingInputIndex(index);
    openTrainDatasetsInputModal();
  };
  const handleDeleteTrainingInputClick = (index: number) => () => {
    handleDeleteTrainingInput(index);
  };
  const handleAddTrainingInputClick = () => {
    setEditTrainingInputIndex(null);
    openTrainDatasetsInputModal();
  };

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
                    onClick={handleEditTrainingInputClick(idx)}
                  >
                    &#9998;
                  </button>
                  <button onClick={handleDeleteTrainingInputClick(idx)}>X</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={handleAddTrainingInputClick}>
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
          onChange={handleS3OutputPathChange}
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
          onChange={handleTrainingImageChange}
        />
        {showError('tm.TrainingImage') && (
          <small style={{ color: 'crimson' }}>{showError('tm.TrainingImage')}</small>
        )}
      </LabeledField>
      <LabeledField label="Input Mode*">
        <input
          {...register('tm.TrainingInputMode', { required: 'Required' })}
          value={data.Arguments?.AlgorithmSpecification?.TrainingInputMode ?? ''}
          onChange={handleTrainingInputModeChange}
        />
        {showError('tm.TrainingInputMode') && (
          <small style={{ color: 'crimson' }}>{showError('tm.TrainingInputMode')}</small>
        )}
      </LabeledField>
      <div className="right-pane-header">Execution Role</div>
      <LabeledField label="IAM Role">
        <input
          value={data.Arguments?.RoleArn ?? ''}
          onChange={handleRoleArnChange}
        />
      </LabeledField>
      <div className="right-pane-header">Instance</div>
      <LabeledField label="Type*">
        <input
          {...register('tm.InstanceType', { required: 'Required' })}
          value={data.Arguments?.ResourceConfig?.InstanceType ?? ''}
          onChange={handleRcInstanceTypeChange}
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
          onChange={handleRcInstanceCountChange}
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
          onChange={handleRcVolumeSizeChange}
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
          onChange={handleStoppingMaxChange}
        />
        {showError('tm.MaxRuntimeInSeconds') && (
          <small style={{ color: 'crimson' }}>{showError('tm.MaxRuntimeInSeconds')}</small>
        )}
      </LabeledField>
    </>
  );
}
