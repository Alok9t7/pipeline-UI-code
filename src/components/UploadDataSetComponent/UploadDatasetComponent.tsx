import React, { useCallback, useState } from 'react';

import right_icon from '../../assets/right_icon.svg';
import config from '../../config';
import { useAuthToken } from '../../hooks/useAuthToken';
import Toast from '../Toast/Toast';
import { UploadProgressMap } from '../UploadForm/parts/FileUploadControls';
import { ProgressSection } from '../UploadForm/parts/ProgressSection';
import './UploadDatasetComponent.scss';

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;

export interface UploadDatasetPageProps {
  setLoggedInUser: (v: string | null) => void;
}

const UploadDatasetComponent = ({ setLoggedInUser }: UploadDatasetPageProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<boolean[]>(
    new Array(files.length).fill(false)
  );
  const [allSelected, setAllSelected] = useState(false);
  const [error, setError] = useState<string>('');
  const { get: getToken } = useAuthToken(() => setLoggedInUser(null));
  const [uploadProgress, setUploadProgress] = useState<UploadProgressMap>({});
  const [uploading, setUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | DataTransfer) => {
    let uploadedFiles: File[] = [];

    if ('files' in e) {
      uploadedFiles = Array.from(e.files); // drag-drop
    } else if (e.target.files) {
      uploadedFiles = Array.from(e.target.files); // input select
    }

    if (uploadedFiles.length > 0) {
      const file = uploadedFiles[0];
      console.log('Uploading file:', uploadedFiles, 'filename', file.name, file.size);
      if (!file.name.toLowerCase().endsWith('.zip')) {
        setError('Only .zip files are allowed');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('File size exceeds 2GB');
        return;
      }

      setError('');
      const newFiles = uploadedFiles.map((file) => file.name);
      setFiles([file]);
      setSelectedFiles((prev) => [...prev, ...new Array(newFiles.length).fill(false)]);
    }
  };

  const handleSelectAll = () => {
    const newSelected = !allSelected;
    setAllSelected(newSelected);
    setSelectedFiles(new Array(files.length).fill(newSelected));
  };

  const toggleFile = (index: number) => {
    const updated = [...selectedFiles];
    updated[index] = !updated[index];
    setSelectedFiles(updated);
    setAllSelected(updated.every((sel) => sel));
  };

  // Upload presign (unchanged)
  const onRequestPresign = async (filename: string, contentType: string) => {
    const token = getToken();
    if (!token) {
      setLoggedInUser(null);
      throw new Error('Session expired');
    }
    const lambdaUrl = process.env.REACT_APP_UPLOAD_API_URL!;
    const res = await fetch(lambdaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({ filename, contentType, pathPrefix: config.paths.datasetImages }),
    });
    if (!res.ok) throw new Error(`Presigned URL error for ${filename}`);
    const { uploadUrl } = await res.json();
    return uploadUrl as string;
  };

  const handleSingleFileUpload = async () => {
    setUploading(true);
    setUploadProgress({});
    try {
      const relativePath = files[0].name;
      const contentType = 'application/zip';
      const uploadUrl = await onRequestPresign(relativePath, contentType);
      await uploadFileWithProgress(files[0], uploadUrl, relativePath, contentType);
    } finally {
      handleUploadFinish();
      setFiles([]);
    }
  };

  const handleUploadFinish = () => {
    setUploading(false);
    setToastMessage('All files uploaded successfully!');
  };

  const uploadFileWithProgress = (
    file: File,
    uploadUrl: string,
    relativePath: string,
    contentType: string
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', contentType);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress((prev) => ({ ...prev, [relativePath]: percent }));
        }
      };

      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject());
      xhr.onerror = () => reject(new Error(`Upload error for ${relativePath}`));
      xhr.send(file);
    });
  };

  return (
    <div className="upload-dataset">
      <div className="header">
        <h2 className="title">Upload Dataset</h2>
      </div>

      <div className="content">
        <div className="left">
          <div
            className="upload-box"
            onDragOver={(e) => e.preventDefault()} // required to allow drop
            onDrop={(e) => {
              e.preventDefault();
              handleFileUpload(e.dataTransfer); // pass dropped files
            }}
          >
            <p className="drag-drop-text">
              Drag and drop .zip files here <br />
              or{' '}
              <label htmlFor="file-upload" className="upload-link">
                Click here
              </label>{' '}
              to browse files
            </p>
            <input
              id="file-upload"
              type="file"
              accept=".zip"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />

            {error && <p className="error-message">{error}</p>}
          </div>

          <div className="files">
            <div className="files-header">
              <span className="files-label">Files ({files.length})</span>
            </div>

            <div className="files-list">
              {files.map((f, i) => (
                <label key={i} className="file-item">
                  {f.name}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ProgressSection uploading={uploading} uploadProgress={uploadProgress} />

      {/* Footer Actions */}
      <div className="actions">
        <button
          className="btn-outline"
          disabled={files.length === 0}
          onClick={() => handleSingleFileUpload()}
        >
          Save Files <img src={right_icon} alt="right_icon" className="h-6" />
        </button>
        <button className="btn-primary">Start Annotate →</button>
      </div>

      {toastMessage && (
        <Toast open={true} message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};

export default UploadDatasetComponent;
