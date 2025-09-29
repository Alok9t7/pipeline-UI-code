import React from 'react';

import ProgressList from '../../ProgressList/ProgressList';
import { UploadProgressMap } from './FileUploadControls';

export const ProgressSection: React.FC<{
  uploading: boolean;
  uploadProgress: UploadProgressMap;
}> = ({ uploading, uploadProgress }) => {
  if (!uploading) return null;
  return <ProgressList uploadProgress={uploadProgress} />;
};
