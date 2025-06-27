import React, { useRef, useState } from 'react';
import { workOrderDocumentService } from '../../services/firestore/documentService';

interface DocumentUploaderProps {
  jobId: string;
  category: string;
  userId: string;
  onUploadSuccess?: () => void;
}

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ jobId, category, userId, onUploadSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only images (JPG, PNG, GIF) and PDFs are allowed.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 10MB.';
    }
    return null;
  };

  const handleFiles = async (files: FileList | File[]) => {
    setError(null);
    setUploading(true);
    setProgress(0);
    let anyError = false;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError + ` (File: ${file.name})`);
        anyError = true;
        continue;
      }
      try {
        await workOrderDocumentService.uploadWorkOrderDocument({
          jobId,
          category,
          file,
          uploadedBy: userId,
        });
        setProgress(Math.round(((i + 1) / files.length) * 100));
        if (onUploadSuccess) onUploadSuccess();
      } catch (err: any) {
        setError((err.message || 'Upload failed') + ` (File: ${file.name})`);
        anyError = true;
      }
    }
    setUploading(false);
    if (!anyError) setError(null);
    setProgress(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div>
      <h3>Upload Documents for Job: {jobId} (Category: {category})</h3>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: dragActive ? '2px solid #007bff' : '2px dashed #ccc',
          padding: 16,
          borderRadius: 8,
          background: dragActive ? '#f0f8ff' : '#fafafa',
          marginBottom: 8,
          cursor: uploading ? 'not-allowed' : 'pointer',
        }}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={uploading}
          multiple
          accept={ALLOWED_TYPES.join(',')}
          style={{ display: 'none' }}
        />
        <div style={{ color: '#888' }}>
          {uploading ? 'Uploading...' : 'Drag and drop files here, or click to select (images/PDFs, max 10MB each)'}
        </div>
      </div>
      {uploading && <div>Uploading... {progress}%</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};

export default DocumentUploader; 