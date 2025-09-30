import type { Node } from '@xyflow/react';
import { memo, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import '../VisualPipeline.scss';
import { AddDataSetsModal } from '../modals/AddDataSetsModal';
import { OutputDataModal } from '../modals/OutputDataModal';
import { TrainDatasetsInputModal } from '../modals/TrainDatasetsInputModal';
import type { AppNodeData } from '../types';
import { s3OrHttpsRegex } from '../validation';
import { BatchInferenceSection } from './sections/BatchInferenceSection';
import { CreateModelSection } from './sections/CreateModelSection';
import { DataProcessSection } from './sections/DataProcessSection';
import { DeployEndpointSection } from './sections/DeployEndpointSection';
import { DetailsSection } from './sections/DetailsSection';
import { TrainModelSection } from './sections/TrainModelSection';

type Props = {
  selectedNode: Node<AppNodeData> | null;
  onChangeNode: (id: string, updater: (data: AppNodeData) => AppNodeData) => void;
  onClose: () => void;
};

export const PropertiesPanel = memo(function PropertiesPanel({
  selectedNode,
  onChangeNode,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState<'settings' | 'details'>('settings');
  const [addDatasetModalOpen, setAddDatasetModalOpen] = useState(false);
  const [outputModalOpen, setOutputModalOpen] = useState(false);
  const [addTrainDatasetsInputModal, setAddTrainDatasetsInputModal] = useState(false);
  const [editProcessingInputIndex, setEditProcessingInputIndex] = useState<number | null>(null);
  const [editProcessingOutputIndex, setEditProcessingOutputIndex] = useState<number | null>(null);
  const [editTrainingInputIndex, setEditTrainingInputIndex] = useState<number | null>(null);
  const openTrainDatasetsInputModal = () => setAddTrainDatasetsInputModal(true);
  const closeTrainDatasetsInputModal = () => setAddTrainDatasetsInputModal(false);

  const openOutputModal = () => setOutputModalOpen(true);
  const closeOutputModal = () => {
    setOutputModalOpen(false);
    setEditProcessingOutputIndex(null);
  };

  const openDatasetsModal = () => setAddDatasetModalOpen(true);
  const closeDatasetsModal = () => {
    setAddDatasetModalOpen(false);
    setEditProcessingInputIndex(null);
  };
  // react-hook-form setup for live field validation
  const { register, formState, getFieldState, trigger } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
  });
  const showError = (name: string): string | undefined =>
    getFieldState(name, formState).error?.message as string | undefined;
  useEffect(() => {
    // trigger validation when selected node changes or its data updates
    void trigger();
  }, [selectedNode?.id, selectedNode?.data, trigger]);

  // reset edit indices when switching nodes
  useEffect(() => {
    setEditProcessingInputIndex(null);
    setEditProcessingOutputIndex(null);
    setEditTrainingInputIndex(null);
  }, [selectedNode?.id]);
  if (!selectedNode) {
    return (
      <aside className="right-pane">
        <div className="right-pane-header-top">Properties</div>
        <div className="right-pane-content">Select a node to edit its properties.</div>
      </aside>
    );
  }

  const { id, data } = selectedNode;
  const update = <K extends AppNodeData['kind']>(
    partial: Partial<Extract<AppNodeData, { kind: K }>>
  ) => {
    onChangeNode(id, (d) => ({ ...d, ...partial }) as AppNodeData);
  };

  // --- for Environment Variables ---
  const environment =
    data.kind === 'createModel' ? (data.Arguments?.PrimaryContainer?.Environment ?? {}) : {};

  const handleEnvChange = (key: string, value: string) => {
    if (data.kind !== 'createModel') return;
    update({
      Arguments: {
        ...data.Arguments,
        PrimaryContainer: {
          ...data.Arguments?.PrimaryContainer,
          Environment: {
            ...environment,
            [key]: value,
          },
        },
      },
    });
  };

  const handleAddEnv = () => {
    const newKey = `VAR_${Object.keys(environment).length + 1}`;
    handleEnvChange(newKey, '');
  };

  const handleDeleteEnv = (key: string) => {
    if (data.kind !== 'createModel') return;
    const { [key]: _, ...rest } = environment;
    update({
      Arguments: {
        ...data.Arguments,
        PrimaryContainer: {
          ...data.Arguments?.PrimaryContainer,
          Environment: rest,
        },
      },
    });
  };

  // --- for HyperParameters ---
  const hyperParameters = data.kind === 'trainModel' ? (data.Arguments?.HyperParameters ?? {}) : {};

  const handleHyperParamChange = (key: string, value: string) => {
    if (data.kind !== 'trainModel') return;
    update({
      Arguments: {
        ...data.Arguments,
        HyperParameters: {
          ...hyperParameters,
          [key]: value,
        },
      },
    });
  };
  const handleAddHyperParam = () => {
    const newKey = `PARAM_${Object.keys(hyperParameters).length + 1}`;
    handleHyperParamChange(newKey, '');
  };

  const handleDeleteHyperParam = (key: string) => {
    if (data.kind !== 'trainModel') return;
    const { [key]: _, ...rest } = hyperParameters;
    update({
      Arguments: {
        ...data.Arguments,
        HyperParameters: rest,
      },
    });
  };

  const handleHyperParamKeyChangeFactory = (prevKey: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (data.kind !== 'trainModel') return;
    const newKey = e.target.value;
    const { [prevKey]: oldVal, ...rest } = hyperParameters;
    update({
      Arguments: {
        ...data.Arguments,
        HyperParameters: {
          ...rest,
          [newKey]: oldVal,
        },
      },
    });
  };

  const handleHyperParamValueChangeFactory = (key: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => handleHyperParamChange(key, e.target.value);

  const addEntrypoints = () => {
    if (data.kind !== 'dataProcess') return;
    const current = data.Arguments?.AppSpecification?.ContainerEntrypoint ?? [];
    update({
      Arguments: {
        ...data.Arguments,
        AppSpecification: {
          ...data.Arguments?.AppSpecification,
          ContainerEntrypoint: [...current, ''],
        },
      },
    });
  };
  const addContainerArguments = () => {
    if (data.kind !== 'dataProcess') return;
    const current = data.Arguments?.AppSpecification?.ContainerArguments ?? [];
    update({
      Arguments: {
        ...data.Arguments,
        AppSpecification: {
          ...data.Arguments?.AppSpecification,
          ContainerArguments: [...current, ''],
        },
      },
    });
  };

  // --- derived lists for datasets ---
  const processingInputs =
    data.kind === 'dataProcess' ? (data.Arguments?.ProcessingInputs ?? []) : [];
  const processingOutputs =
    data.kind === 'dataProcess' ? (data.Arguments?.ProcessingOutputConfig?.Outputs ?? []) : [];
  const trainingInputs = data.kind === 'trainModel' ? (data.Arguments?.InputDataConfig ?? []) : [];

  // --- add/save handlers for modals ---
  const handleSaveProcessingInput = (
    payload: {
      inputName: string;
      s3Uri: string;
      localPath: string;
    },
    editIndex: number | null
  ) => {
    if (data.kind !== 'dataProcess') return;
    const newItem = {
      InputName: payload.inputName,
      S3Input: {
        S3Uri: payload.s3Uri,
        LocalPath: payload.localPath,
        S3DataType: 'S3Prefix',
        S3InputMode: 'File',
        S3CompressionType: 'None',
      },
    };
    const next = Array.isArray(processingInputs) ? [...processingInputs] : [];
    if (editIndex != null) next[editIndex] = newItem;
    else next.push(newItem);
    update({
      Arguments: {
        ...data.Arguments,
        ProcessingInputs: next,
      },
    });
    closeDatasetsModal();
  };
  const handleDeleteProcessingInput = (index: number) => {
    if (data.kind !== 'dataProcess') return;
    const next = processingInputs.filter((_, i) => i !== index);
    update({
      Arguments: {
        ...data.Arguments,
        ProcessingInputs: next,
      },
    });
  };
  const handleEditProcessingInput = (index: number) => {
    if (data.kind !== 'dataProcess') return;
    setEditProcessingInputIndex(index);
    openDatasetsModal();
  };

  const handleSaveProcessingOutput = (
    payload: {
      outputName: string;
      localPath: string;
      s3Uri: string;
      s3UploadMode: 'Continuous' | 'EndOfJob';
    },
    editIndex: number | null
  ) => {
    if (data.kind !== 'dataProcess') return;
    const newItem = {
      OutputName: payload.outputName,
      S3Output: {
        S3Uri: payload.s3Uri,
        LocalPath: payload.localPath,
        S3UploadMode: payload.s3UploadMode,
      },
    };
    const next = Array.isArray(processingOutputs) ? [...processingOutputs] : [];
    if (editIndex != null) next[editIndex] = newItem;
    else next.push(newItem);
    update({
      Arguments: {
        ...data.Arguments,
        ProcessingOutputConfig: {
          ...data.Arguments?.ProcessingOutputConfig,
          Outputs: next,
        },
      },
    });
    closeOutputModal();
  };

  const handleDeleteProcessingOutput = (index: number) => {
    if (data.kind !== 'dataProcess') return;
    const next = processingOutputs.filter((_, i) => i !== index);
    update({
      Arguments: {
        ...data.Arguments,
        ProcessingOutputConfig: {
          ...data.Arguments?.ProcessingOutputConfig,
          Outputs: next,
        },
      },
    });
  };

  const handleEditProcessingOutput = (index: number) => {
    if (data.kind !== 'dataProcess') return;
    setEditProcessingOutputIndex(index);
    openOutputModal();
  };

  const handleSaveTrainingInput = (
    payload: {
      channelName: string;
      s3DataType: string;
      s3Uri: string;
      s3DataDistributionType?: string;
    },
    editIndex: number | null
  ) => {
    if (data.kind !== 'trainModel') return;
    const newItem = {
      ChannelName: payload.channelName,
      DataSource: {
        S3DataSource: {
          S3DataType: payload.s3DataType,
          S3Uri: payload.s3Uri,
          S3DataDistributionType: payload.s3DataDistributionType ?? 'FullyReplicated',
        },
      },
    };
    const next = Array.isArray(trainingInputs) ? [...trainingInputs] : [];
    if (editIndex != null) next[editIndex] = newItem;
    else next.push(newItem);
    update({
      Arguments: {
        ...data.Arguments,
        InputDataConfig: next,
      },
    });
    closeTrainDatasetsInputModal();
  };

  const handleDeleteTrainingInput = (index: number) => {
    if (data.kind !== 'trainModel') return;
    const next = trainingInputs.filter((_, i) => i !== index);
    update({
      Arguments: {
        ...data.Arguments,
        InputDataConfig: next,
      },
    });
  };

  const handleClose = () => onClose();
  const handleTabSettings = () => setActiveTab('settings');
  const handleTabDetails = () => setActiveTab('details');

  return (
    <aside className="right-pane">
      <div className="right-pane-header-top">
        {data.label}
        <button className="close-btn" onClick={handleClose}>
          ✕
        </button>
      </div>
      <div className="right-pane-tabs">
        <button
          className={`tab ${activeTab === 'settings' ? 'is-active' : ''}`}
          onClick={handleTabSettings}
        >
          Settings
        </button>
        <button
          className={`tab ${activeTab === 'details' ? 'is-active' : ''}`}
          onClick={handleTabDetails}
        >
          Details
        </button>
      </div>
      <div className="right-pane-content">
        {activeTab === 'details' && (
          <DetailsSection data={data} register={register} showError={showError} update={update} />
        )}

        {activeTab === 'settings' && (
          <>
            {data.kind === 'dataProcess' && (
              <DataProcessSection
                data={data}
                register={register}
                showError={showError}
                update={update}
                processingInputs={processingInputs}
                processingOutputs={processingOutputs}
                addDatasetModalOpen={addDatasetModalOpen}
                openDatasetsModal={openDatasetsModal}
                closeDatasetsModal={closeDatasetsModal}
                editProcessingInputIndex={editProcessingInputIndex}
                setEditProcessingInputIndex={setEditProcessingInputIndex}
                handleSaveProcessingInput={handleSaveProcessingInput}
                handleDeleteProcessingInput={handleDeleteProcessingInput}
                handleEditProcessingInput={handleEditProcessingInput}
                outputModalOpen={outputModalOpen}
                openOutputModal={openOutputModal}
                closeOutputModal={closeOutputModal}
                editProcessingOutputIndex={editProcessingOutputIndex}
                setEditProcessingOutputIndex={setEditProcessingOutputIndex}
                handleSaveProcessingOutput={handleSaveProcessingOutput}
                handleDeleteProcessingOutput={handleDeleteProcessingOutput}
                handleEditProcessingOutput={handleEditProcessingOutput}
                addEntrypoints={addEntrypoints}
                addContainerArguments={addContainerArguments}
                AddDataSetsModal={AddDataSetsModal}
                OutputDataModal={OutputDataModal}
              />
            )}

            {data.kind === 'trainModel' && (
              <>
                <TrainModelSection
                  data={data}
                  register={register}
                  showError={showError}
                  update={update}
                  trainingInputs={trainingInputs}
                  addTrainDatasetsInputModal={addTrainDatasetsInputModal}
                  openTrainDatasetsInputModal={openTrainDatasetsInputModal}
                  closeTrainDatasetsInputModal={closeTrainDatasetsInputModal}
                  editTrainingInputIndex={editTrainingInputIndex}
                  setEditTrainingInputIndex={setEditTrainingInputIndex}
                  handleSaveTrainingInput={handleSaveTrainingInput}
                  handleDeleteTrainingInput={handleDeleteTrainingInput}
                  TrainDatasetsInputModal={TrainDatasetsInputModal}
                  s3OrHttpsRegex={s3OrHttpsRegex}
                />
                <div className="right-pane-header">Hyperparameters</div>
                <div>
                  {Object.entries(hyperParameters).map(([key, value]) => (
                    <div key={key} className="env-row">
                      <input
                        className="env-key-input"
                        type="text"
                        value={key}
                        onChange={handleHyperParamKeyChangeFactory(key)}
                      />
                      <input
                        className="env-value-input"
                        type="text"
                        value={value}
                        onChange={handleHyperParamValueChangeFactory(key)}
                      />
                      <button className="delete-env" onClick={() => handleDeleteHyperParam(key)}>
                        ❌
                      </button>
                    </div>
                  ))}
                </div>
                <button className="env-add-button" onClick={handleAddHyperParam}>
                  Add
                </button>
              </>
            )}

            {data.kind === 'createModel' && (
              <CreateModelSection
                data={data}
                register={register}
                showError={showError}
                update={update}
                environment={environment}
                handleEnvChange={handleEnvChange}
                handleDeleteEnv={handleDeleteEnv}
                handleAddEnv={handleAddEnv}
              />
            )}
            {data.kind === 'deployModelEndpoint' && (
              <DeployEndpointSection
                data={data}
                register={register}
                showError={showError}
                update={update}
              />
            )}
            {data.kind === 'deployModelBatchInference' && (
              <BatchInferenceSection
                data={data}
                register={register}
                showError={showError}
                update={update}
                s3OrHttpsRegex={s3OrHttpsRegex}
              />
            )}
          </>
        )}
      </div>
    </aside>
  );
});
