import React, { useState } from 'react';

import { createPipeline, startTraining } from '../../../utils/api';

type PipelineStep = {
  name: string;
  definition: object;
};

interface TrainingPipelineControlsProps {
  getToken: () => string | null;
  pipelines: PipelineStep[];
  selectedPipeline: PipelineStep;
  setSelectedPipeline: (v: PipelineStep) => void;
  onPipelineCreated?: (arn?: string) => void;
}

export const TrainingPipelineControls: React.FC<TrainingPipelineControlsProps> = ({
  getToken,
  pipelines,
  selectedPipeline,
  setSelectedPipeline,
  onPipelineCreated,
}) => {
  const [trainingJsonFile, setTrainingJsonFile] = useState<File | null>(null);
  const [trainingCreating, setTrainingCreating] = useState(false);
  const [trainingStarting, setTrainingStarting] = useState(false);

  const handleTrainingJsonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setTrainingJsonFile(file);
  };

  const handleCreateTrainingPipeline = async () => {
    if (!trainingJsonFile) {
      alert('⚠️ Please select a JSON file first.');
      return;
    }
    const token = getToken();
    if (!token) return;

    try {
      setTrainingCreating(true);
      const text = await trainingJsonFile.text();
      const jsonPayload = JSON.parse(text);

      const apiUrl = process.env.REACT_APP_CREATE_PIPELINE_API_URL;
      if (!apiUrl) {
        alert('Training pipeline API URL not configured.');
        setTrainingCreating(false);
        return;
      }

      const data = await createPipeline(apiUrl, token, jsonPayload);
      onPipelineCreated?.(data.pipelineArn);
      alert(
        `✅ Training pipeline created successfully! Pipeline ARN: ${data.pipelineArn || 'N/A'}`
      );
    } catch (error: any) {
      console.error(error);
      alert(`❌ Error creating training pipeline: ${error.message}`);
    } finally {
      setTrainingCreating(false);
      setTrainingJsonFile(null);
    }
  };

  const handleStartTrainingPipeline = async () => {
    const token = getToken();
    if (!token) return;

    try {
      setTrainingStarting(true);
      const apiUrl = process.env.REACT_APP_START_TRAINING_API_URL;
      if (!apiUrl) {
        alert('Training trigger API URL not configured.');
        setTrainingStarting(false);
        return;
      }

      const data = await startTraining(apiUrl, token, selectedPipeline.name);
      alert(`✅ Training started successfully!\nExecution ARN: ${data.executionArn || 'N/A'}`);
    } catch (error: any) {
      console.error(error);
      alert(`❌ Error starting training: ${error.message}`);
    } finally {
      setTrainingStarting(false);
    }
  };

  return (
    <div>
      {/* Local layout styles just for this block */}
      <style>
        {`
          .tp-grid { display: grid; gap: 18px; }
          .tp-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
          .tp-sep { margin: 30px 0; }
          .tp-select { min-width: 260px; }
          .tp-label { font-weight: 600; margin-right: 6px; }
        `}
      </style>

      <hr className="tp-sep" />

      <div className="tp-grid">
        {/* Row 1: Create pipeline from JSON */}
        <div>
          <h3 style={{ marginTop: 0 }}>Create Training Pipeline from JSON</h3>
          <div className="tp-row">
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleTrainingJsonChange}
              disabled={trainingCreating}
              aria-label="Training pipeline JSON file"
            />
            <button
              onClick={handleCreateTrainingPipeline}
              disabled={!trainingJsonFile || trainingCreating}
              className="start-labeling-btn"
            >
              {trainingCreating ? 'Creating...' : 'Create Training Pipeline'}
            </button>
          </div>
        </div>

        {/* Row 2: Select pipeline + Start Training (side by side) */}
        <div className="tp-row">
          <label className="tp-label" htmlFor="pipeline-select">
            Select Pipeline:
          </label>
          <select
            id="pipeline-select"
            className="tp-select"
            value={selectedPipeline.name}
            onChange={(e) => setSelectedPipeline({ name: e.target.value, definition: {} })}
          >
            {pipelines.map((p, idx) => (
              <option key={p.name || idx} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleStartTrainingPipeline}
            disabled={trainingStarting || !selectedPipeline}
            className="start-labeling-btn"
            title={!selectedPipeline ? 'Choose a pipeline first' : 'Start training'}
          >
            {trainingStarting ? 'Starting...' : 'Start Training Pipeline'}
          </button>
        </div>
      </div>
    </div>
  );
};
