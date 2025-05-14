import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../firebase/config';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import surveySchema from '../../schemas/surveySchema.json';

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
  uploading?: boolean;
  progress?: number;
  url?: string;
  caption?: string;
}

interface FormData {
  category: string;
  subcategory?: string;
  description: string;
  location: {
    room: string;
    details?: string;
  };
  urgency: string;
  availability: Array<{
    day: string;
    timeRanges: string[];
  }>;
  media: MediaFile[];
  tenant_notes?: string;
}

const MaintenanceSurvey: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    category: '',
    description: '',
    location: {
      room: '',
    },
    urgency: '',
    availability: [],
    media: []
  });

  // Handle file drops
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'video'
    }));

    setMediaFiles(prev => [...prev, ...newFiles].slice(0, 5)); // Limit to 5 files
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'video/*': ['.mp4', '.mov']
    },
    maxSize: 20 * 1024 * 1024, // 20MB max
    maxFiles: 5
  });

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof FormData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Upload media files to Firebase Storage
  const uploadMedia = async (file: File): Promise<string> => {
    const storageRef = ref(storage, `maintenance-media/${currentUser?.uid}/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      // Upload all media files first
      const mediaUrls = await Promise.all(
        mediaFiles.map(async (mediaFile) => {
          const url = await uploadMedia(mediaFile.file);
          return {
            type: mediaFile.type,
            url,
            caption: mediaFile.caption
          };
        })
      );

      // Create work order document
      const workOrderRef = doc(collection(db, 'workOrders'));
      await setDoc(workOrderRef, {
        ...formData,
        media: mediaUrls,
        tenantId: currentUser.uid,
        propertyId: userProfile?.propertyId,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Clear form and media
      setFormData({
        category: '',
        description: '',
        location: { room: '' },
        urgency: '',
        availability: [],
        media: []
      });
      setMediaFiles([]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Clean up previews on unmount
  React.useEffect(() => {
    return () => mediaFiles.forEach(file => URL.revokeObjectURL(file.preview));
  }, [mediaFiles]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Report Maintenance Issue</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Issue Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
            required
          >
            <option value="">Select a category</option>
            {surveySchema.properties.category.enum.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory Selection (if category selected) */}
        {formData.category && surveySchema.properties.subcategory.properties[formData.category] && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Specific Issue
            </label>
            <select
              name="subcategory"
              value={formData.subcategory}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
            >
              <option value="">Select specific issue</option>
              {surveySchema.properties.subcategory.properties[formData.category].enum.map((sub) => (
                <option key={sub} value={sub}>
                  {sub.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
            placeholder="Please describe the issue in detail..."
            required
            minLength={10}
            maxLength={1000}
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <select
            name="location.room"
            value={formData.location.room}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
            required
          >
            <option value="">Select room</option>
            {surveySchema.properties.location.properties.room.enum.map((room) => (
              <option key={room} value={room}>
                {room.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="location.details"
            value={formData.location.details}
            onChange={handleChange}
            placeholder="Additional location details (optional)"
            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
            maxLength={200}
          />
        </div>

        {/* Urgency */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Urgency Level
          </label>
          <select
            name="urgency"
            value={formData.urgency}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
            required
          >
            <option value="">Select urgency</option>
            {surveySchema.properties.urgency.enum.map((level) => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Media Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Photos/Videos (Optional)
          </label>
          <div
            {...getRootProps()}
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md
              ${isDragActive ? 'border-teal-500 bg-teal-50' : 'border-gray-300'}`}
          >
            <div className="space-y-1 text-center">
              <input {...getInputProps()} />
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <span>Drop files here or click to upload</span>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, MP4 up to 20MB (max 5 files)
              </p>
            </div>
          </div>

          {/* Preview uploaded files */}
          {mediaFiles.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {mediaFiles.map((file, index) => (
                <div key={index} className="relative">
                  {file.type === 'image' ? (
                    <img
                      src={file.preview}
                      alt={`Preview ${index + 1}`}
                      className="h-24 w-full object-cover rounded"
                    />
                  ) : (
                    <video
                      src={file.preview}
                      className="h-24 w-full object-cover rounded"
                      controls
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setMediaFiles(files => files.filter((_, i) => i !== index))}
                    className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1"
                  >
                    ×
                  </button>
                  <input
                    type="text"
                    placeholder="Add caption (optional)"
                    className="mt-1 block w-full text-sm"
                    value={file.caption || ''}
                    onChange={(e) => {
                      const newFiles = [...mediaFiles];
                      newFiles[index] = { ...file, caption: e.target.value };
                      setMediaFiles(newFiles);
                    }}
                    maxLength={200}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Additional Notes (Optional)
          </label>
          <textarea
            name="tenant_notes"
            value={formData.tenant_notes}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
            placeholder="Any additional information..."
            maxLength={500}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
              ${loading ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </>
            ) : (
              'Submit Maintenance Request'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MaintenanceSurvey; 