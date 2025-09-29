import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { LabeledField } from '../LabeledField/LabeledField';
import '../VisualPipeline.scss';

type FormValues = {
  inputName: string;
  s3Uri: string;
  localPath: string;
};

export const AddDataSetsModal = ({
  isOpen,
  onClose,
  onSave,
  initialValues,
  editIndex = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    payload: { inputName: string; s3Uri: string; localPath: string },
    editIndex: number | null
  ) => void;
  initialValues?: Partial<FormValues>;
  editIndex?: number | null;
}) => {
  const { register, handleSubmit, formState, reset } = useForm<FormValues>({
    defaultValues: { inputName: '', s3Uri: '', localPath: '' },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  useEffect(() => {
    if (isOpen) {
      reset({ inputName: '', s3Uri: '', localPath: '', ...initialValues });
    }
  }, [isOpen, initialValues, reset]);
  const { errors } = formState;
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2>Add data (Input)</h2>
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
          <LabeledField label="Processing input name*">
            <input
              type="text"
              placeholder="input-1"
              {...register('inputName', { required: 'Required' })}
            />
            {errors.inputName && (
              <small style={{ color: 'crimson' }}>{errors.inputName.message}</small>
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
          <LabeledField label="Local path*">
            <input
              type="text"
              placeholder="/opt/ml/processing/input/input-1"
              {...register('localPath', { required: 'Required' })}
            />
            {errors.localPath && (
              <small style={{ color: 'crimson' }}>{errors.localPath.message}</small>
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
