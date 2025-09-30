import { LabeledField } from '../../LabeledField/LabeledField';
import type { AppNodeData, FormRegister, ShowErrorFunction, NodeUpdateFunction, ProcessingInput, ProcessingOutput, AddDataSetsModalComponent, OutputDataModalComponent } from '../../types';

type Props = {
  data: AppNodeData & { kind: 'dataProcess' };
  register: FormRegister;
  showError: ShowErrorFunction;
  update: NodeUpdateFunction;
  processingInputs: ProcessingInput[];
  processingOutputs: ProcessingOutput[];
  addDatasetModalOpen: boolean;
  openDatasetsModal: () => void;
  closeDatasetsModal: () => void;
  editProcessingInputIndex: number | null;
  setEditProcessingInputIndex: (i: number | null) => void;
  handleSaveProcessingInput: (
    payload: { inputName: string; s3Uri: string; localPath: string },
    editIndex: number | null
  ) => void;
  handleDeleteProcessingInput: (index: number) => void;
  handleEditProcessingInput: (index: number) => void;
  outputModalOpen: boolean;
  openOutputModal: () => void;
  closeOutputModal: () => void;
  editProcessingOutputIndex: number | null;
  setEditProcessingOutputIndex: (i: number | null) => void;
  handleSaveProcessingOutput: (
    payload: {
      outputName: string;
      localPath: string;
      s3Uri: string;
      s3UploadMode: 'Continuous' | 'EndOfJob';
    },
    editIndex: number | null
  ) => void;
  handleDeleteProcessingOutput: (index: number) => void;
  handleEditProcessingOutput: (index: number) => void;
  addEntrypoints: () => void;
  addContainerArguments: () => void;
  AddDataSetsModal: AddDataSetsModalComponent;
  OutputDataModal: OutputDataModalComponent;
};

export function DataProcessSection(props: Props) {
  const {
    data,
    register,
    showError,
    update,
    processingInputs,
    processingOutputs,
    addDatasetModalOpen,
    openDatasetsModal,
    closeDatasetsModal,
    editProcessingInputIndex,
    setEditProcessingInputIndex,
    handleSaveProcessingInput,
    handleDeleteProcessingInput,
    handleEditProcessingInput,
    outputModalOpen,
    openOutputModal,
    closeOutputModal,
    editProcessingOutputIndex,
    setEditProcessingOutputIndex,
    handleSaveProcessingOutput,
    handleDeleteProcessingOutput,
    handleEditProcessingOutput,
    addEntrypoints,
    addContainerArguments,
    AddDataSetsModal,
    OutputDataModal,
  } = props;

  const handleInstanceTypeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        ProcessingResources: {
          ...data.Arguments?.ProcessingResources,
          ClusterConfig: {
            ...data.Arguments?.ProcessingResources?.ClusterConfig,
            InstanceType: e.target.value,
          },
        },
      },
    });

  const handleInstanceCountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        ProcessingResources: {
          ...data.Arguments?.ProcessingResources,
          ClusterConfig: {
            ...data.Arguments?.ProcessingResources?.ClusterConfig,
            InstanceCount: Number(e.target.value),
          },
        },
      },
    });

  const handleVolumeSizeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        ProcessingResources: {
          ...data.Arguments?.ProcessingResources,
          ClusterConfig: {
            ...data.Arguments?.ProcessingResources?.ClusterConfig,
            VolumeSizeInGB: Number(e.target.value),
          },
        },
      },
    });

  const handleImageUriChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({
      Arguments: {
        ...data.Arguments,
        AppSpecification: {
          ...data.Arguments?.AppSpecification,
          ImageUri: e.target.value,
        },
      },
    });

  const handleEntrypointChange = (idx: number, value: string) => {
    const updatedEntrypoints = [
      ...(data.Arguments?.AppSpecification?.ContainerEntrypoint ?? []),
    ];
    updatedEntrypoints[idx] = value;
    update({
      Arguments: {
        ...data.Arguments,
        AppSpecification: {
          ...data.Arguments?.AppSpecification,
          ContainerEntrypoint: updatedEntrypoints,
        },
      },
    });
  };

  const handleEntrypointDelete = (idx: number) => {
    const updatedEntrypoints = (
      data.Arguments?.AppSpecification?.ContainerEntrypoint ?? []
    ).filter((_, i) => i !== idx);
    update({
      Arguments: {
        ...data.Arguments,
        AppSpecification: {
          ...data.Arguments?.AppSpecification,
          ContainerEntrypoint: updatedEntrypoints,
        },
      },
    });
  };

  const handleContainerArgChange = (idx: number, value: string) => {
    const updatedArgs = [
      ...(data.Arguments?.AppSpecification?.ContainerArguments ?? []),
    ];
    updatedArgs[idx] = value;
    update({
      Arguments: {
        ...data.Arguments,
        AppSpecification: {
          ...data.Arguments?.AppSpecification,
          ContainerArguments: updatedArgs,
        },
      },
    });
  };

  const handleContainerArgDelete = (idx: number) => {
    const updatedArgs = (
      data.Arguments?.AppSpecification?.ContainerArguments ?? []
    ).filter((_, i) => i !== idx);
    update({
      Arguments: {
        ...data.Arguments,
        AppSpecification: {
          ...data.Arguments?.AppSpecification,
          ContainerArguments: updatedArgs,
        },
      },
    });
  };

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

  
  const onEditProcessingInputClick = (index: number) => () => handleEditProcessingInput(index);
  const onDeleteProcessingInputClick = (index: number) => () => handleDeleteProcessingInput(index);
  const onAddProcessingInputClick = () => {
    setEditProcessingInputIndex(null);
    openDatasetsModal();
  };

  const onEditProcessingOutputClick = (index: number) => () => handleEditProcessingOutput(index);
  const onDeleteProcessingOutputClick = (index: number) => () =>
    handleDeleteProcessingOutput(index);
  const onAddProcessingOutputClick = () => {
    setEditProcessingOutputIndex(null);
    openOutputModal();
  };

  
  const onEntrypointChange = (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) =>
    handleEntrypointChange(idx, e.target.value);
  const onEntrypointDeleteClick = (idx: number) => () => handleEntrypointDelete(idx);
  const onContainerArgChange = (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) =>
    handleContainerArgChange(idx, e.target.value);
  const onContainerArgDeleteClick = (idx: number) => () => handleContainerArgDelete(idx);

  return (
    <>
      <div className="right-pane-header">Instance</div>
      <LabeledField label="Type*">
        <input
          {...register('dp.InstanceType', { required: 'Required' })}
          value={data.Arguments?.ProcessingResources?.ClusterConfig?.InstanceType ?? ''}
          onChange={handleInstanceTypeChange}
        />
        {showError('dp.InstanceType') && (
          <small style={{ color: 'crimson' }}>{showError('dp.InstanceType')}</small>
        )}
      </LabeledField>
      <LabeledField label="Count*">
        <input
          type="number"
          {...register('dp.InstanceCount', {
            required: 'Required',
            min: { value: 1, message: 'Must be at least 1' },
            valueAsNumber: true,
          })}
          value={data.Arguments?.ProcessingResources?.ClusterConfig?.InstanceCount ?? 0}
          onChange={handleInstanceCountChange}
        />
        {showError('dp.InstanceCount') && (
          <small style={{ color: 'crimson' }}>{showError('dp.InstanceCount')}</small>
        )}
      </LabeledField>
      <LabeledField label="Additional storage per instance (GB)*">
        <input
          type="number"
          {...register('dp.VolumeSizeInGB', {
            required: 'Required',
            min: { value: 1, message: 'Must be at least 1' },
            valueAsNumber: true,
          })}
          value={data.Arguments?.ProcessingResources?.ClusterConfig?.VolumeSizeInGB ?? 0}
          onChange={handleVolumeSizeChange}
        />
        {showError('dp.VolumeSizeInGB') && (
          <small style={{ color: 'crimson' }}>{showError('dp.VolumeSizeInGB')}</small>
        )}
      </LabeledField>

      <div className="right-pane-header">Dataset (Input)</div>
      <div className="dataset-input-container">
        {processingInputs.length === 0 ? (
          <div>
            <h4 className="input-heading">No datasets.</h4>
            <p className="input-desc">No datasets have been added to this step yet.</p>
          </div>
        ) : (
          <div className="dataset-list">
            {processingInputs.map((inp, idx) => (
              <div key={idx} className="dataset-item">
                <p className="dataset-name">{inp.InputName}</p>
                <div className="dataset-item-actions">
                  <button onClick={onEditProcessingInputClick(idx)}>&#9998;</button>
                  <button onClick={onDeleteProcessingInputClick(idx)}>X</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={onAddProcessingInputClick}>
          Add
        </button>
      </div>
      <AddDataSetsModal
        isOpen={addDatasetModalOpen}
        onClose={closeDatasetsModal}
        onSave={handleSaveProcessingInput}
        editIndex={editProcessingInputIndex}
        initialValues={
          editProcessingInputIndex != null
            ? {
                inputName: processingInputs[editProcessingInputIndex]?.InputName,
                s3Uri: processingInputs[editProcessingInputIndex]?.S3Input?.S3Uri,
                localPath: processingInputs[editProcessingInputIndex]?.S3Input?.LocalPath,
              }
            : undefined
        }
      />

      <div className="right-pane-header">Output data location</div>
      <div className="dataset-output-container">
        {processingOutputs.length === 0 ? (
          <div>
            <h4 className="output-heading">No datasets.</h4>
            <p className="output-desc">No datasets have been added to this step yet.</p>
          </div>
        ) : (
          <div className="dataset-list">
            {processingOutputs.map((out, idx) => (
              <div key={idx} className="dataset-item">
                <p className="dataset-name">{out.OutputName}</p>
                <div className="dataset-item-actions">
                  <button onClick={onEditProcessingOutputClick(idx)}>&#9998;</button>
                  <button onClick={onDeleteProcessingOutputClick(idx)}>X</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={onAddProcessingOutputClick}>
          Add
        </button>
      </div>
      <OutputDataModal
        isOpen={outputModalOpen}
        onClose={closeOutputModal}
        onSave={handleSaveProcessingOutput}
        editIndex={editProcessingOutputIndex}
        initialValues={
          editProcessingOutputIndex != null
            ? {
                outputName: processingOutputs[editProcessingOutputIndex]?.OutputName,
                localPath: processingOutputs[editProcessingOutputIndex]?.S3Output?.LocalPath,
                s3Uri: processingOutputs[editProcessingOutputIndex]?.S3Output?.S3Uri,
                s3UploadMode:
                  (processingOutputs[editProcessingOutputIndex]?.S3Output?.S3UploadMode as
                    | 'Continuous'
                    | 'EndOfJob') ?? 'EndOfJob',
              }
            : undefined
        }
      />

      <div className="right-pane-header">App specification</div>
      <LabeledField label="Image URI*">
        <input
          {...register('dp.ImageUri', { required: 'Required' })}
          value={data.Arguments?.AppSpecification?.ImageUri ?? ''}
          onChange={handleImageUriChange}
        />
        {showError('dp.ImageUri') && (
          <small style={{ color: 'crimson' }}>{showError('dp.ImageUri')}</small>
        )}
      </LabeledField>
      <LabeledField label="Container entrypoints">
        <div>
          {data.Arguments?.AppSpecification?.ContainerEntrypoint?.map((entry, idx) => (
            <div key={idx} className="entrypoint-row">
              <input
                className="entrypoint-input"
                type="text"
                value={entry}
                onChange={onEntrypointChange(idx)}
              />
              <button
                className="delete-entrypoint"
                onClick={onEntrypointDeleteClick(idx)}
              >
                ❌
              </button>
            </div>
          ))}
        </div>
        <div>
          <button onClick={addEntrypoints}>Add</button>
        </div>
      </LabeledField>
      <LabeledField label="Container arguments">
        <div>
          {data.Arguments?.AppSpecification?.ContainerArguments?.map((arg, idx) => (
            <div key={idx} className="entrypoint-row">
              <input
                className="entrypoint-input"
                type="text"
                value={arg}
                onChange={onContainerArgChange(idx)}
              />
              <button
                className="delete-entrypoint"
                onClick={onContainerArgDeleteClick(idx)}
              >
                ❌
              </button>
            </div>
          ))}
        </div>
        <div>
          <button onClick={addContainerArguments}>Add</button>
        </div>
      </LabeledField>
      <div className="right-pane-header">Stopping Condition</div>
      <LabeledField label="Max Runtime (seconds)">
        <input
          type="number"
          {...register('dp.MaxRuntimeInSeconds', {
            min: { value: 1, message: 'Must be at least 1' },
            valueAsNumber: true,
          })}
          value={data.Arguments?.StoppingCondition?.MaxRuntimeInSeconds ?? 0}
          onChange={handleStoppingMaxChange}
        />
        {showError('dp.MaxRuntimeInSeconds') && (
          <small style={{ color: 'crimson' }}>{showError('dp.MaxRuntimeInSeconds')}</small>
        )}
      </LabeledField>
    </>
  );
}
