import React from 'react';

export type UploadProgressMap = { [key: string]: number };

export interface FileUploadControlsProps {
  onRequestPresign: (filename: string, contentType: string) => Promise<string>; // returns uploadUrl
  onUploadStart?: () => void;
  onUploadFinish?: () => void;
  setUploadProgress: React.Dispatch<React.SetStateAction<UploadProgressMap>>;
}

export const FileUploadControls: React.FC<FileUploadControlsProps> = ({
  onRequestPresign,
  onUploadStart,
  onUploadFinish,
  setUploadProgress,
}) => {
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

  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    onUploadStart?.();
    setUploadProgress({});

    try {
      for (const file of Array.from(files)) {
        const relativePath = (file as any).webkitRelativePath || file.name;
        const contentType =
          file.type ||
          (file.name.endsWith('.zip') ? 'application/zip' : 'application/octet-stream');
        const uploadUrl = await onRequestPresign(relativePath, contentType);
        await uploadFileWithProgress(file, uploadUrl, relativePath, contentType);
      }
    } finally {
      (event.target as HTMLInputElement).value = '';
      onUploadFinish?.();
    }
  };

  return (
    <div>
      <h3>Upload .zip File</h3>
      <input type="file" accept=".zip" onChange={handleFolderUpload} />

      <h3>Or Upload a Folder</h3>
      <input
        type="file"
        multiple
        onChange={handleFolderUpload}
        ref={(ref) => {
          if (ref) {
            (ref as any).webkitdirectory = true;
            (ref as any).directory = true;
          }
        }}
      />
    </div>
  );
};
