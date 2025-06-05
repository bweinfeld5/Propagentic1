import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doc, setDoc, serverTimestamp, getDoc, addDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../../firebase/config';
import { formatFirebaseError } from '../../utils/ErrorHandling';
import { toast } from 'react-hot-toast';

// Category options for maintenance requests
const CATEGORIES = [
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'hvac', label: 'HVAC/Heating/Cooling' },
  { id: 'structural', label: 'Structural/Building' },
  { id: 'appliance', label: 'Appliance Issue' },
  { id: 'other', label: 'Other' },
];

// Interface for form data
interface MaintenanceFormData {
  issueTitle: string;
  description: string;
  issueType: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  photos: File[];
  contactPreference: 'email' | 'phone' | 'text';
  availableTimes: string[];
  unitNumber: string;
}

const MaintenanceRequestForm: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<MaintenanceFormData>({
    issueTitle: '',
    description: '',
    issueType: '',
    urgency: 'medium',
    photos: [],
    contactPreference: 'email',
    availableTimes: [],
    unitNumber: ''
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Photo size must be less than 5MB');
        return;
      }
      setPhoto(file);
      // Add to photos array
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, file]
      }));
      setPhotoPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const removePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhoto(null);
    setFormData(prev => ({
      ...prev,
      photos: []
    }));
    setPhotoPreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("You must be logged in to submit a maintenance request");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Get the user's property information
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      const tenantProfileDoc = await getDoc(doc(db, "tenantProfiles", currentUser.uid));
      
      if (!tenantProfileDoc.exists()) {
        setError("Tenant profile not found. Please complete your profile first.");
        setLoading(false);
        return;
      }
      
      const tenantData = tenantProfileDoc.data();
      const propertyId = tenantData.propertyId;
      
      if (!propertyId) {
        setError("No property associated with your account. Please contact your landlord.");
        setLoading(false);
        return;
      }
      
      // Get the landlord ID for this property
      const propertyDoc = await getDoc(doc(db, "properties", propertyId));
      if (!propertyDoc.exists()) {
        setError("Property information not found. Please contact your landlord.");
        setLoading(false);
        return;
      }
      
      const propertyData = propertyDoc.data();
      const landlordId = propertyData.landlordId;
      
      // Upload photos if any
      const photoUrls: string[] = [];
      
      if (formData.photos && formData.photos.length > 0) {
        for (const photo of formData.photos) {
          const fileRef = ref(storage, `maintenance/${currentUser.uid}/${Date.now()}_${photo.name}`);
          await uploadBytes(fileRef, photo);
          const downloadUrl = await getDownloadURL(fileRef);
          photoUrls.push(downloadUrl);
        }
      }
      
      // Create maintenance ticket
      const ticketData = {
        tenantId: currentUser.uid,
        propertyId,
        landlordId,
        issueTitle: formData.issueTitle,
        description: formData.description,
        issueType: formData.issueType,
        urgency: formData.urgency,
        status: 'new',
        photos: photoUrls,
        contactPreference: formData.contactPreference,
        availableTimes: formData.availableTimes,
        unitNumber: formData.unitNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        timeline: [{
          status: 'new',
          timestamp: serverTimestamp(),
          userId: currentUser.uid,
          notes: 'Maintenance request created'
        }]
      };
      
      const ticketRef = await addDoc(collection(db, "maintenanceTickets"), ticketData);
      
      // Create notification for landlord
      await addDoc(collection(db, "notifications"), {
        userId: landlordId,
        type: "new_maintenance_request",
        message: `New maintenance request: ${formData.issueTitle}`,
        ticketId: ticketRef.id,
        read: false,
        createdAt: serverTimestamp()
      });
     
      // Success message and redirect
      toast.success("Maintenance request submitted successfully");
      navigate("/maintenance/my-requests");
    } catch (error) {
      console.error("Error submitting maintenance request:", error);
      setError(formatFirebaseError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-6">Submit New Maintenance Request</h2>
        
        {error && <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-6 text-sm rounded-r" role="alert">{error}</div>}
        {success && <div className="bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-300 p-4 mb-6 text-sm rounded-r" role="alert">{success}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="issueTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Title *</label>
                <input type="text" name="issueTitle" id="issueTitle" required value={formData.issueTitle} onChange={handleChange} className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-slate-800 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                <textarea name="description" id="description" required rows={4} value={formData.description} onChange={handleChange} className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-slate-800 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"></textarea>
            </div>
            <div>
                <label htmlFor="unitNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit Number *</label>
                <input type="text" name="unitNumber" id="unitNumber" required value={formData.unitNumber} onChange={handleChange} className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-slate-800 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Urgency</label>
                <select name="urgency" id="urgency" value={formData.urgency} onChange={handleChange} className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-slate-800 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
            </div>
        
            {/* Photo Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Photo (Optional, Max 5MB)</label>
                {!photoPreview ? (
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg bg-white dark:bg-slate-800">
                    <div className="space-y-1 text-center">
                        {/* SVG Icon */}
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                            <label htmlFor="photo-upload" className="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-teal-600 dark:text-teal-500 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500">
                                <span>Upload a file</span>
                                <input id="photo-upload" name="photo" type="file" className="sr-only" accept="image/*" onChange={handlePhotoChange} />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 5MB</p>
                    </div>
                </div>
                ) : (
                    <div className="mt-2 relative">
                        <img src={photoPreview} alt="Preview" className="max-h-60 w-auto rounded-lg border border-gray-300 dark:border-gray-600" />
                        <button type="button" onClick={removePhoto} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs leading-none hover:bg-red-700 focus:outline-none">
                            &times;
                        </button>
                    </div>
                )}
            </div>
        
            <div className="form-group">
                <label htmlFor="issueType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Type</label>
                <select
                    id="issueType"
                    name="issueType"
                    value={formData.issueType}
                    onChange={handleChange}
                    required
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-slate-800 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                >
                    <option value="">Select an issue type</option>
                    {CATEGORIES.map(category => (
                        <option key={category.id} value={category.id}>{category.label}</option>
                    ))}
                </select>
            </div>
        
            <div>
                <button type="submit" disabled={loading} className="w-full py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-propagentic-teal hover:bg-teal-700 focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50">
                    {loading ? 'Submitting...' : 'Submit Request'}
                </button>
            </div>
        </form>
    </div>
  );
};

export default MaintenanceRequestForm;