import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { 
  ClipboardDocumentListIcon as ClipboardListIcon,
  MapPinIcon as LocationMarkerIcon, 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon as MailIcon, 
  PhotoIcon as PhotographIcon,
  ChatBubbleLeftRightIcon as ChatAlt2Icon,
  CheckCircleIcon,
  ExclamationCircleIcon as ExclamationIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

// Job status options
const STATUS_OPTIONS = [
  { id: 'accepted', name: 'Accepted', icon: CheckCircleIcon, color: 'bg-yellow-100 text-yellow-800' },
  { id: 'in_progress', name: 'In Progress', icon: ClockIcon, color: 'bg-blue-100 text-blue-800' },
  { id: 'blocked_parts', name: 'Blocked - Needs Parts', icon: ExclamationIcon, color: 'bg-red-100 text-red-800' },
  { id: 'blocked_access', name: 'Blocked - Access Issue', icon: ExclamationIcon, color: 'bg-red-100 text-red-800' },
  { id: 'scheduled', name: 'Scheduled Visit', icon: ClockIcon, color: 'bg-indigo-100 text-indigo-800' },
  { id: 'completed', name: 'Completed', icon: CheckCircleIcon, color: 'bg-green-100 text-green-800' },
];

const JobDetailView = ({ job, isReadOnly = false }) => {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize selectedStatus from job if available
  React.useEffect(() => {
    if (job?.status) {
      setSelectedStatus(job.status);
    }
  }, [job]);

  // Handle file selection for photos
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    
    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(newPreviewUrls);
  };

  // Handle status change
  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  // Handle note submission
  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const jobRef = doc(db, 'tickets', job.id);
      await updateDoc(jobRef, {
        contractorNotes: arrayUnion({
          text: note,
          timestamp: serverTimestamp(),
          contractorId: job.assignedContractorId
        })
      });
      
      setNote('');
      setSuccess('Note added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error adding note:', error);
      setError('Failed to add note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setLoading(true);
    setError('');
    
    try {
      const uploadedUrls = [];
      
      // Upload each file to Firebase Storage
      for (const file of selectedFiles) {
        const storageRef = ref(storage, `jobs/${job.id}/photos/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        uploadedUrls.push(downloadUrl);
      }
      
      // Update the job document with the new photo URLs
      const jobRef = doc(db, 'tickets', job.id);
      await updateDoc(jobRef, {
        contractorPhotos: arrayUnion(...uploadedUrls)
      });
      
      setSelectedFiles([]);
      setPreviewUrls([]);
      setSuccess('Photos uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error uploading photos:', error);
      setError('Failed to upload photos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!selectedStatus || selectedStatus === job.status) return;
    
    setLoading(true);
    setError('');
    
    try {
      const jobRef = doc(db, 'tickets', job.id);
      const updateData = {
        status: selectedStatus,
        [`${selectedStatus}At`]: serverTimestamp(), // e.g., completedAt, acceptedAt
        statusHistory: arrayUnion({
          status: selectedStatus,
          timestamp: serverTimestamp(),
          updatedBy: job.assignedContractorId
        })
      };
      
      await updateDoc(jobRef, updateData);
      
      setSuccess('Status updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!job) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <ClipboardListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Job Not Found</h3>
          <p className="mt-1 text-gray-500">This job may have been removed or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  // Find the current status object
  const currentStatus = STATUS_OPTIONS.find(s => s.id === job.status) || STATUS_OPTIONS[0];

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Job Header */}
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {job.title || job.issueTitle || 'Maintenance Request'}
          </h2>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentStatus.color}`}>
            <currentStatus.icon className="mr-1.5 h-4 w-4" />
            {currentStatus.name}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">Job ID: {job.id}</p>
      </div>
      
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Job Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
            <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
              {job.description || 'No description provided.'}
            </div>
          </div>
          
          {/* Property Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
              <LocationMarkerIcon className="h-5 w-5 mr-2 text-gray-500" />
              Property Details
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 font-medium">{job.property?.name || job.propertyName || 'Property'}</p>
              <p className="text-gray-700">{job.property?.address || job.propertyAddress || 'Address not available'}</p>
              <p className="text-gray-700">Unit {job.unit || job.unitNumber || 'N/A'}</p>
              
              {job.accessInstructions && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700">Access Instructions:</p>
                  <p className="text-sm text-gray-600">{job.accessInstructions}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Tenant Contact Info (if available) */}
          {job.tenantName && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-gray-500" />
                Tenant Information
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 font-medium">{job.tenantName}</p>
                {job.tenantPhone && (
                  <p className="text-gray-700 flex items-center mt-1">
                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-500" />
                    <a href={`tel:${job.tenantPhone}`} className="text-teal-600 hover:text-teal-800">
                      {job.tenantPhone}
                    </a>
                  </p>
                )}
                {job.tenantEmail && (
                  <p className="text-gray-700 flex items-center mt-1">
                    <MailIcon className="h-4 w-4 mr-2 text-gray-500" />
                    <a href={`mailto:${job.tenantEmail}`} className="text-teal-600 hover:text-teal-800">
                      {job.tenantEmail}
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Landlord Contact Info */}
          {job.landlordName && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-gray-500" />
                Landlord Information
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 font-medium">{job.landlordName}</p>
                {job.landlordPhone && (
                  <p className="text-gray-700 flex items-center mt-1">
                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-500" />
                    <a href={`tel:${job.landlordPhone}`} className="text-teal-600 hover:text-teal-800">
                      {job.landlordPhone}
                    </a>
                  </p>
                )}
                {job.landlordEmail && (
                  <p className="text-gray-700 flex items-center mt-1">
                    <MailIcon className="h-4 w-4 mr-2 text-gray-500" />
                    <a href={`mailto:${job.landlordEmail}`} className="text-teal-600 hover:text-teal-800">
                      {job.landlordEmail}
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Tenant Photos (if any) */}
          {job.photos && job.photos.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                <PhotographIcon className="h-5 w-5 mr-2 text-gray-500" />
                Tenant Photos
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {job.photos.map((photoUrl, index) => (
                  <div key={index} className="relative h-40 bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={photoUrl} 
                      alt={`Tenant photo ${index + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Your Uploaded Photos (if any) */}
          {job.contractorPhotos && job.contractorPhotos.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                <PhotographIcon className="h-5 w-5 mr-2 text-gray-500" />
                Your Uploaded Photos
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {job.contractorPhotos.map((photoUrl, index) => (
                  <div key={index} className="relative h-40 bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={photoUrl} 
                      alt={`Contractor photo ${index + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Notes History */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
              <ChatAlt2Icon className="h-5 w-5 mr-2 text-gray-500" />
              Notes History
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {job.contractorNotes && job.contractorNotes.length > 0 ? (
                <ul className="space-y-4">
                  {job.contractorNotes.map((note, index) => (
                    <li key={index} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                      <p className="text-gray-700">{note.text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {note.timestamp?.toDate 
                          ? note.timestamp.toDate().toLocaleString() 
                          : new Date(note.timestamp).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No notes have been added yet.</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Column: Actions */}
        {!isReadOnly && (
          <div className="lg:col-span-1 space-y-6">
            {/* Status Update */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-medium text-gray-900 mb-3">Update Job Status</h3>
              <select 
                value={selectedStatus}
                onChange={handleStatusChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="" disabled>Select a status</option>
                {STATUS_OPTIONS.map(option => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={loading || !selectedStatus || selectedStatus === job.status}
                className="mt-3 w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Status'}
              </button>
            </div>
            
            {/* Add Note */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-medium text-gray-900 mb-3">Add Note</h3>
              <form onSubmit={handleNoteSubmit}>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Enter notes about the job..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !note.trim()}
                  className="mt-3 w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add Note'}
                </button>
              </form>
            </div>
            
            {/* Upload Photos */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-medium text-gray-900 mb-3">Upload Photos</h3>
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                accept="image/*"
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
              />
              
              {/* Preview Section */}
              {previewUrls.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="h-20 bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  ))}
                </div>
              )}
              
              <button
                onClick={handlePhotoUpload}
                disabled={loading || selectedFiles.length === 0}
                className="mt-3 w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Uploading...' : 'Upload Photos'}
              </button>
            </div>
            
            {/* Mark Complete (only if not already completed) */}
            {job.status !== 'completed' && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
                  Complete Job
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Mark this job as completed when all work has been finished. This will notify the landlord.
                </p>
                <button
                  onClick={() => {
                    setSelectedStatus('completed');
                    handleStatusUpdate();
                  }}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Mark as Completed'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Success/Error Messages */}
      {(success || error) && (
        <div className={`border-t ${success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'} p-4`}>
          <p className={`text-sm ${success ? 'text-green-700' : 'text-red-700'}`}>
            {success || error}
          </p>
        </div>
      )}
    </div>
  );
};

export default JobDetailView; 