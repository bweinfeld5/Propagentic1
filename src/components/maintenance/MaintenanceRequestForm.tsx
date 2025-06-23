import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doc, setDoc, serverTimestamp, getDoc, addDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../../firebase/config';
import { formatFirebaseError } from '../../utils/ErrorHandling';
import { toast } from 'react-hot-toast';
import { XCircleIcon, PhotoIcon } from '@heroicons/react/24/outline';

// Category options for maintenance requests
const CATEGORIES = [
  { id: 'plumbing', label: 'Plumbing', examples: 'Leaks, clogs, water pressure' },
  { id: 'electrical', label: 'Electrical', examples: 'Outlets, switches, lighting' },
  { id: 'hvac', label: 'HVAC/Heating/Cooling', examples: 'AC, heating, ventilation' },
  { id: 'appliance', label: 'Appliance Issue', examples: 'Refrigerator, dishwasher, washer/dryer' },
  { id: 'structural', label: 'Structural/Building', examples: 'Walls, floors, ceilings, doors' },
  { id: 'pest', label: 'Pest Control', examples: 'Insects, rodents' },
  { id: 'other', label: 'Other', examples: 'General maintenance issues' },
];

// Time slot options
const TIME_SLOTS = [
  { id: 'morning', label: 'Morning (8AM - 12PM)' },
  { id: 'afternoon', label: 'Afternoon (12PM - 5PM)' },
  { id: 'evening', label: 'Evening (5PM - 8PM)' },
  { id: 'weekend', label: 'Weekends' },
  { id: 'anytime', label: 'Anytime' },
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
  allowEntry: boolean;
  phoneNumber?: string;
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
    unitNumber: '',
    allowEntry: false,
    phoneNumber: userProfile?.phone || ''
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTimeSlotChange = (slotId: string) => {
    setFormData(prev => ({
      ...prev,
      availableTimes: prev.availableTimes.includes(slotId)
        ? prev.availableTimes.filter((id: string) => id !== slotId)
        : [...prev.availableTimes, slotId]
    }));
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const validFiles: File[] = [];
      const newPreviews: string[] = [];
      
      // Check total photos limit (5 max)
      if (formData.photos.length + files.length > 5) {
        setError('Maximum 5 photos allowed');
        return;
      }
      
      files.forEach(file => {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          setError(`Photo ${file.name} is too large. Maximum size is 5MB`);
          return;
        }
        validFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      });
      
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...validFiles]
      }));
      setPhotoPreviews(prev => [...prev, ...newPreviews]);
      setError('');
    }
  };

  const removePhoto = (index: number) => {
    // Clean up object URL
    URL.revokeObjectURL(photoPreviews[index]);
    
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("You must be logged in to submit a maintenance request");
      return;
    }
    
    // Validate phone number if phone or text contact preference
    if ((formData.contactPreference === 'phone' || formData.contactPreference === 'text') && !formData.phoneNumber) {
      setError("Please provide a phone number for your selected contact preference");
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
        contactPhone: formData.phoneNumber,
        availableTimes: formData.availableTimes,
        unitNumber: formData.unitNumber,
        allowEntry: formData.allowEntry,
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
            
            <div className="form-group">
                <label htmlFor="issueType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Type *</label>
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
                        <option key={category.id} value={category.id}>{category.label} - {category.examples}</option>
                    ))}
                </select>
            </div>
            
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                <textarea name="description" id="description" required rows={4} value={formData.description} onChange={handleChange} placeholder="Please describe the issue in detail..." className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-slate-800 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"></textarea>
            </div>
            
            <div>
                <label htmlFor="unitNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit Number *</label>
                <input type="text" name="unitNumber" id="unitNumber" required value={formData.unitNumber} onChange={handleChange} className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-slate-800 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm" />
            </div>
            
            <div>
                <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Urgency Level *</label>
                <select name="urgency" id="urgency" value={formData.urgency} onChange={handleChange} className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-slate-800 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm">
                    <option value="low">Low - Can wait a few days</option>
                    <option value="medium">Medium - Should be addressed soon</option>
                    <option value="high">High - Needs attention within 24 hours</option>
                    <option value="emergency">Emergency - Immediate attention required</option>
                </select>
            </div>
        
            {/* Multiple Photo Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Photos (Optional, Max 5 photos, 5MB each)
                </label>
                <div className="mt-2 space-y-2">
                    {photoPreviews.length < 5 && (
                        <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg bg-white dark:bg-slate-800">
                            <div className="space-y-1 text-center">
                                <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                    <label htmlFor="photo-upload" className="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-teal-600 dark:text-teal-500 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500">
                                        <span>Upload photos</span>
                                        <input 
                                            id="photo-upload" 
                                            name="photos" 
                                            type="file" 
                                            className="sr-only" 
                                            accept="image/*" 
                                            multiple 
                                            onChange={handlePhotoChange} 
                                        />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    PNG, JPG, GIF up to 5MB ({5 - photoPreviews.length} remaining)
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {/* Photo previews */}
                    {photoPreviews.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {photoPreviews.map((preview, index) => (
                                <div key={index} className="relative group">
                                    <img 
                                        src={preview} 
                                        alt={`Preview ${index + 1}`} 
                                        className="h-32 w-full object-cover rounded-lg border border-gray-300 dark:border-gray-600" 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => removePhoto(index)} 
                                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <XCircleIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Availability Times */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    When are you available? (Select all that apply)
                </label>
                <div className="space-y-2">
                    {TIME_SLOTS.map(slot => (
                        <label key={slot.id} className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.availableTimes.includes(slot.id)}
                                onChange={() => handleTimeSlotChange(slot.id)}
                                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{slot.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Contact Preferences */}
            <div>
                <label htmlFor="contactPreference" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preferred Contact Method *
                </label>
                <select 
                    name="contactPreference" 
                    id="contactPreference" 
                    value={formData.contactPreference} 
                    onChange={handleChange} 
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-slate-800 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                >
                    <option value="email">Email</option>
                    <option value="phone">Phone Call</option>
                    <option value="text">Text Message</option>
                </select>
            </div>

            {/* Phone number field (shown when phone or text is selected) */}
            {(formData.contactPreference === 'phone' || formData.contactPreference === 'text') && (
                <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone Number *
                    </label>
                    <input 
                        type="tel" 
                        name="phoneNumber" 
                        id="phoneNumber" 
                        value={formData.phoneNumber} 
                        onChange={handleChange} 
                        placeholder="(555) 123-4567"
                        className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-slate-800 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm" 
                    />
                </div>
            )}

            {/* Entry Permission */}
            <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                <label className="flex items-start">
                    <input
                        type="checkbox"
                        name="allowEntry"
                        checked={formData.allowEntry}
                        onChange={handleChange}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded mt-1"
                    />
                    <div className="ml-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Allow entry when I'm not home
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            I authorize maintenance personnel to enter my unit if I'm not available during the scheduled time
                        </p>
                    </div>
                </label>
            </div>
        
            <div>
                <button type="submit" disabled={loading} className="w-full py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-propagentic-teal hover:bg-teal-700 focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition-colors">
                    {loading ? 'Submitting...' : 'Submit Maintenance Request'}
                </button>
            </div>
        </form>
    </div>
  );
};

export default MaintenanceRequestForm;