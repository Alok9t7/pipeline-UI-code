import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { LabeledField } from '../LabeledField/LabeledField';
import '../VisualPipeline.scss';

type FormValues = {
  outputName: string;
  localPath: string;
  s3Uri: string;
  s3UploadMode: 'Continuous' | 'EndOfJob';
};

export const OutputDataModal = ({
  isOpen,
  onClose,
  onSave,
  initialValues,
  editIndex = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    payload: {
      outputName: string;
      localPath: string;
      s3Uri: string;
      s3UploadMode: 'Continuous' | 'EndOfJob';
    },
    editIndex: number | null
  ) => void;
  initialValues?: Partial<FormValues>;
  editIndex?: number | null;
}) => {
  const { register, handleSubmit, formState, reset } = useForm<FormValues>({
    defaultValues: { outputName: '', localPath: '', s3Uri: '', s3UploadMode: 'EndOfJob' },
    mode: 'onBlur',
  });
  useEffect(() => {
    if (isOpen) {
      reset({
        outputName: '',
        localPath: '',
        s3Uri: '',
        s3UploadMode: 'EndOfJob',
        ...initialValues,
      });
    }
  }, [isOpen, initialValues, reset]);
  const { errors } = formState;
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2>Add data (Output)</h2>
          <button onClick={onClose}>X</button>
        </div>
        <form
          className="modal-content"
          onSubmit={handleSubmit((vals) => {
            onSave(vals, editIndex);
            reset();
            onClose();
          })}
        >
          <LabeledField label="Processing output name*">
            <input
              type="text"
              placeholder="output-1"
              {...register('outputName', { required: 'Required' })}
            />
            {errors.outputName && (
              <small style={{ color: 'crimson' }}>{errors.outputName.message}</small>
            )}
          </LabeledField>
          <LabeledField label="Local path*">
            <input
              type="text"
              placeholder="/opt/ml/processing/output/output-1"
              {...register('localPath', { required: 'Required' })}
            />
            {errors.localPath && (
              <small style={{ color: 'crimson' }}>{errors.localPath.message}</small>
            )}
          </LabeledField>
          <LabeledField label="Location(S3 URI)*">
            <input
              type="text"
              placeholder="s3://bucket/object/key"
              {...register('s3Uri', {
                required: 'Required',
                pattern: {
                  value: /^(https|s3):\/\/([^/]+)\/?(.*)$/,
                  message: 'Must be https:// or s3:// URI',
                },
              })}
            />
            {errors.s3Uri && <small style={{ color: 'crimson' }}>{errors.s3Uri.message}</small>}
          </LabeledField>
          <LabeledField label="S3 upload mode*">
            <select {...register('s3UploadMode', { required: 'Required' })}>
              <option value="Continuous">Continuous</option>
              <option value="EndOfJob">EndOfJob</option>
            </select>
            {errors.s3UploadMode && (
              <small style={{ color: 'crimson' }}>{errors.s3UploadMode.message}</small>
            )}
          </LabeledField>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="modal-actions-cancel-btn">
              Cancel
            </button>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};
