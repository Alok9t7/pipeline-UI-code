import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { LabeledField } from '../LabeledField/LabeledField';
import '../VisualPipeline.scss';

type FormValues = {
  channelName: string;
  dataSource: string;
  s3DataType: string;
  s3Uri: string;
  s3DataDistributionType?: string;
};

export const TrainDatasetsInputModal = ({
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
      channelName: string;
      s3DataType: string;
      s3Uri: string;
      s3DataDistributionType?: string;
    },
    editIndex: number | null
  ) => void;
  initialValues?: Partial<FormValues>;
  editIndex?: number | null;
}) => {
  const { register, handleSubmit, formState, reset } = useForm<FormValues>({
    defaultValues: {
      channelName: '',
      dataSource: 's3',
      s3DataType: 'S3Prefix',
      s3Uri: '',
      s3DataDistributionType: 'FullyReplicated',
    },
    mode: 'onBlur',
  });
  useEffect(() => {
    if (isOpen) {
      reset({
        channelName: '',
        dataSource: 's3',
        s3DataType: 'S3Prefix',
        s3Uri: '',
        s3DataDistributionType: 'FullyReplicated',
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
          <h2>Add data</h2>
          <button onClick={onClose}>X</button>
        </div>
        <form
          className="modal-content"
          onSubmit={handleSubmit((vals) => {
            onSave(
              {
                channelName: vals.channelName,
                s3DataType: vals.s3DataType,
                s3Uri: vals.s3Uri,
                s3DataDistributionType: vals.s3DataDistributionType,
              },
              editIndex
            );
            reset();
            onClose();
          })}
        >
          <LabeledField label="Channel name*">
            <input
              type="text"
              placeholder="train"
              {...register('channelName', { required: 'Required' })}
            />
            {errors.channelName && (
              <small style={{ color: 'crimson' }}>{errors.channelName.message}</small>
            )}
          </LabeledField>
          <LabeledField label="Data source*">
            <input
              type="text"
              placeholder="s3"
              {...register('dataSource', { required: 'Required' })}
            />
          </LabeledField>
          <LabeledField label="S3 data type*">
            <input
              type="text"
              placeholder="S3Prefix"
              {...register('s3DataType', { required: 'Required' })}
            />
            {errors.s3DataType && (
              <small style={{ color: 'crimson' }}>{errors.s3DataType.message}</small>
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
          <LabeledField label="S3 data distribution type">
            <input
              type="text"
              placeholder="FullyReplicated"
              {...register('s3DataDistributionType')}
            />
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
