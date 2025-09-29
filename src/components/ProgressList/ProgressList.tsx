import React from 'react';

import './ProgressList.scss';

interface Props {
  uploadProgress: { [key: string]: number };
}

const ProgressList: React.FC<Props> = ({ uploadProgress }) => {
  return (
    <div className="upload-status">
      <h4>Uploading...</h4>
      {Object.entries(uploadProgress).map(([file, percent]) => (
        <div key={file} className="upload-progress-bar">
          <span>{file}</span>
          <progress value={percent} max="100" />
          <span>{percent}%</span>
        </div>
      ))}
    </div>
  );
};

export default ProgressList;
