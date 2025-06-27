import React, { useEffect, useState } from 'react';
import { workOrderDocumentService } from '../../services/firestore/documentService';
import { WorkOrderDocument } from '../../models/Document';

interface DocumentGalleryProps {
  jobId: string;
  category: string;
  refreshTrigger?: any; // Used to trigger refresh after upload
  userId: string;
}

const isImage = (type: string) => type.startsWith('image/');
const isPDF = (type: string) => type === 'application/pdf';

const DocumentGallery: React.FC<DocumentGalleryProps> = ({ jobId, category, refreshTrigger, userId }) => {
  const [documents, setDocuments] = useState<WorkOrderDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editDocId, setEditDocId] = useState<string | null>(null);
  const [editTags, setEditTags] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await workOrderDocumentService.getJobDocuments(jobId);
      setDocuments(docs.filter(doc => doc.category === category));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch documents');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line
  }, [jobId, category, refreshTrigger]);

  const handleDelete = async (doc: WorkOrderDocument) => {
    if (!window.confirm(`Delete document ${doc.fileName}?`)) return;
    try {
      await workOrderDocumentService.deleteWorkOrderDocument(doc.id, doc.storagePath);
      await fetchDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
    }
  };

  const handleEdit = (doc: WorkOrderDocument) => {
    setEditDocId(doc.id);
    setEditTags(doc.tags.join(', '));
    setEditNotes(doc.notes || '');
  };

  const handleSaveEdit = async (doc: WorkOrderDocument) => {
    try {
      await workOrderDocumentService.updateDocumentMetadata(doc.id, {
        tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
        notes: editNotes,
      });
      setEditDocId(null);
      await fetchDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to update document');
    }
  };

  return (
    <div>
      <h3>Document Gallery for Job: {jobId} (Category: {category})</h3>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {documents.map(doc => (
          <li key={doc.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            {isImage(doc.fileType) ? (
              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                <img src={doc.url} alt={doc.fileName} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, marginRight: 12 }} />
              </a>
            ) : isPDF(doc.fileType) ? (
              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                <span style={{ fontSize: 32, marginRight: 12 }}>📄</span>
              </a>
            ) : (
              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                <span style={{ fontSize: 32, marginRight: 12 }}>📁</span>
              </a>
            )}
            <div style={{ flex: 1 }}>
              <div><strong>{doc.fileName}</strong></div>
              <div style={{ fontSize: 12, color: '#888' }}>{doc.fileType}, {(doc.fileSize / 1024).toFixed(1)} KB</div>
              {editDocId === doc.id ? (
                <div style={{ marginTop: 4 }}>
                  <input
                    type="text"
                    value={editTags}
                    onChange={e => setEditTags(e.target.value)}
                    placeholder="Tags (comma separated)"
                    style={{ marginRight: 8 }}
                  />
                  <input
                    type="text"
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    placeholder="Notes"
                    style={{ marginRight: 8 }}
                  />
                  <button onClick={() => handleSaveEdit(doc)}>Save</button>
                  <button onClick={() => setEditDocId(null)} style={{ marginLeft: 4 }}>Cancel</button>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
                  Tags: {doc.tags && doc.tags.length > 0 ? doc.tags.join(', ') : '—'}<br />
                  Notes: {doc.notes || '—'}
                </div>
              )}
            </div>
            {userId === doc.uploadedBy && (
              <>
                <button onClick={() => handleEdit(doc)} style={{ marginRight: 8 }}>Edit</button>
                <button onClick={() => handleDelete(doc)} style={{ color: 'red' }}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
      {documents.length === 0 && !loading && <div>No documents found.</div>}
    </div>
  );
};

export default DocumentGallery; 