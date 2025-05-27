import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { toast } from 'react-hot-toast';

// Service types for contractors
const SERVICE_TYPES = [
  { id: 'plumbing', name: 'Plumbing' },
  { id: 'electrical', name: 'Electrical' },
  { id: 'hvac', name: 'HVAC/Climate Control' },
  { id: 'carpentry', name: 'Carpentry/Woodwork' },
  { id: 'roofing', name: 'Roofing' },
  { id: 'landscaping', name: 'Landscaping/Grounds' },
  { id: 'painting', name: 'Painting' },
  { id: 'flooring', name: 'Flooring' },
  { id: 'appliance', name: 'Appliance Repair' },
  { id: 'general', name: 'General Handyman' }
];

// Add imports for document management components
import FileUpload from './documents/FileUpload';
import DocumentList from './documents/DocumentList';
import ExpirationTracker from './documents/ExpirationTracker';
import { documentService } from '../../services/documentService';

const ContractorProfileSettings = () => {
  const { currentUser, userProfile, fetchUserProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    phoneNumber: '',
    email: '',
    serviceTypes: [],
    serviceArea: '',
    availabilityNotes: '',
    bio: '',
    website: '',
    taxId: '',
    insuranceInfo: '',
    hourlyRate: '',
    yearsExperience: '0-2',
    preferredContactMethod: 'email',
  });

  const [documents, setDocuments] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [docError, setDocError] = useState('');

  // Load user data when component mounts
  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        companyName: userProfile.companyName || '',
        phoneNumber: userProfile.phoneNumber || '',
        email: userProfile.email || currentUser?.email || '',
        serviceTypes: userProfile.serviceTypes || [],
        serviceArea: userProfile.serviceArea || '',
        availabilityNotes: userProfile.availabilityNotes || '',
        bio: userProfile.bio || '',
        website: userProfile.website || '',
        taxId: userProfile.taxId || '',
        insuranceInfo: userProfile.insuranceInfo || '',
        hourlyRate: userProfile.hourlyRate || '',
        yearsExperience: userProfile.yearsExperience || '0-2',
        preferredContactMethod: userProfile.preferredContactMethod || 'email',
      });
      
      // Set profile image preview if it exists
      if (userProfile.profileImageUrl) {
        setImagePreview(userProfile.profileImageUrl);
      }
    }
    loadDocuments();
  }, [userProfile, currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleCheckboxChange = (serviceId) => {
    const newServiceTypes = [...formData.serviceTypes];
    
    if (newServiceTypes.includes(serviceId)) {
      // Remove if already selected
      const index = newServiceTypes.indexOf(serviceId);
      newServiceTypes.splice(index, 1);
    } else {
      // Add if not selected
      newServiceTypes.push(serviceId);
    }
    
    setFormData(prevState => ({
      ...prevState,
      serviceTypes: newServiceTypes
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfileImage = async () => {
    if (!profileImage) return null;
    
    const storageRef = ref(storage, `users/${currentUser.uid}/profile-image`);
    const snapshot = await uploadBytes(storageRef, profileImage);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    
    return downloadUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to update your profile.');
      return;
    }
    
    // Validate the form
    if (!formData.firstName || !formData.lastName || !formData.phoneNumber) {
      setError('Please fill out all required fields: First Name, Last Name, and Phone Number.');
      return;
    }
    
    if (formData.serviceTypes.length === 0) {
      setError('Please select at least one service type that you offer.');
      return;
    }
    
    if (!formData.serviceArea) {
      setError('Please specify your service area (e.g., city, zip code radius).');
      return;
    }
    
    // Validate website format if provided
    if (formData.website && !formData.website.startsWith('http')) {
      setError('Please enter a valid website URL starting with http:// or https://');
      return;
    }
    
    // Validate hourly rate format if provided
    if (formData.hourlyRate && !/^\d+(\.\d{1,2})?$/.test(formData.hourlyRate)) {
      setError('Please enter a valid hourly rate (e.g., 75 or 75.50).');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      let profileData = {
        ...formData,
        updatedAt: serverTimestamp(),
        // Convert hourly rate to a number if it's a valid string
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
      };
      
      // Upload profile image if selected
      if (profileImage) {
        const imageUrl = await uploadProfileImage();
        profileData.profileImageUrl = imageUrl;
      }
      
      // Update profile in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, profileData);
      
      // Refresh user profile data
      await fetchUserProfile(currentUser.uid);
      
      setSuccess('Profile updated successfully!');
      setProfileImage(null); // Reset file input
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(`Failed to update profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const docs = await documentService.getUserDocuments(currentUser.uid);
      setDocuments(docs);
    } catch (error) {
      setDocError('Failed to load documents');
      console.error('Error loading documents:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleUploadComplete = async (url, metadata) => {
    try {
      const docInput = {
        name: metadata.name,
        type: metadata.type,
        url,
        documentType: 'license', // You might want to make this dynamic
        metadata: {
          size: metadata.size,
          contentType: metadata.type,
          lastModified: metadata.lastModified
        }
      };
      
      await documentService.addDocument(currentUser.uid, docInput);
      await loadDocuments(); // Refresh the list
      toast.success('Document uploaded successfully');
    } catch (error) {
      toast.error('Failed to save document information');
      console.error('Error saving document:', error);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      const doc = documents.find(d => d.id === documentId);
      if (!doc) return;
      
      await documentService.deleteDocument(documentId, doc.url);
      setDocuments(docs => docs.filter(d => d.id !== documentId));
      toast.success('Document deleted successfully');
    } catch (error) {
      toast.error('Failed to delete document');
      console.error('Error deleting document:', error);
    }
  };

  const handleUpdateExpiration = async (documentId, newDate) => {
    try {
      await documentService.updateExpirationDate(documentId, newDate);
      await loadDocuments(); // Refresh the list
      toast.success('Expiration date updated successfully');
    } catch (error) {
      toast.error('Failed to update expiration date');
      console.error('Error updating expiration date:', error);
    }
  };

  // Add this section to your render method
  const renderDocumentSection = () => (
    <div className="bg-background dark:bg-background-darkSubtle rounded-lg border border-border dark:border-border-dark p-6 mt-8">
      <h2 className="text-2xl font-bold text-content dark:text-content-dark mb-6">
        Documents & Licenses
      </h2>

      <div className="space-y-8">
        {/* Document Upload */}
        <div>
          <h3 className="text-lg font-medium text-content dark:text-content-dark mb-4">
            Upload New Document
          </h3>
          <FileUpload
            onUploadComplete={handleUploadComplete}
            onUploadError={(error) => toast.error(error)}
            userId={currentUser.uid}
            documentType="license"
          />
        </div>

        {/* Expiration Tracker */}
        <div>
          <h3 className="text-lg font-medium text-content dark:text-content-dark mb-4">
            Document Status
          </h3>
          <ExpirationTracker
            documents={documents}
            onExpirationWarning={(docId) => {
              const doc = documents.find(d => d.id === docId);
              if (doc) {
                // You might want to show a modal here instead
                const newDate = prompt('Enter new expiration date (YYYY-MM-DD)');
                if (newDate) {
                  handleUpdateExpiration(docId, new Date(newDate));
                }
              }
            }}
          />
        </div>

        {/* Document List */}
        <div>
          <h3 className="text-lg font-medium text-content dark:text-content-dark mb-4">
            Your Documents
          </h3>
          {isLoadingDocs ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-primary-light mx-auto"></div>
              <p className="mt-2 text-content-secondary dark:text-content-darkSecondary">Loading documents...</p>
            </div>
          ) : docError ? (
            <div className="text-center py-8 text-error dark:text-error-light">
              {docError}
            </div>
          ) : (
            <DocumentList
              documents={documents}
              onDelete={handleDeleteDocument}
              onView={(doc) => window.open(doc.url, '_blank')}
              onUpdateExpiration={handleUpdateExpiration}
            />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Contractor Profile</h2>
          <p className="mt-1 text-sm text-gray-500">
            Update your information to help landlords find you for maintenance jobs.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* Profile Image */}
            <div className="sm:col-span-6">
              <div className="flex items-center">
                <div className="mr-4">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Profile preview" 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <span className="text-gray-400">No image</span>
                    )}
                  </div>
                </div>
                <div>
                  <label 
                    htmlFor="profileImage" 
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Profile Image
                  </label>
                  <input
                    type="file"
                    id="profileImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                  />
                </div>
              </div>
            </div>
            
            {/* Personal Information */}
            <div className="sm:col-span-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
            </div>
            
            {/* First Name */}
            <div className="sm:col-span-3">
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name * <span className="text-red-500">Required</span>
              </label>
              <input
                type="text"
                name="firstName"
                id="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
            </div>
            
            {/* Last Name */}
            <div className="sm:col-span-3">
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name * <span className="text-red-500">Required</span>
              </label>
              <input
                type="text"
                name="lastName"
                id="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
            </div>
            
            {/* Company Name */}
            <div className="sm:col-span-6">
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                id="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
            </div>
            
            {/* Contact Information Section */}
            <div className="sm:col-span-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
            </div>
            
            {/* Phone Number */}
            <div className="sm:col-span-3">
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number * <span className="text-red-500">Required</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                placeholder="e.g., (555) 123-4567"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Your phone number will be used by landlords to contact you about jobs.
              </p>
            </div>
            
            {/* Email */}
            <div className="sm:col-span-3">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                readOnly
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed.</p>
            </div>
            
            {/* Preferred Contact Method */}
            <div className="sm:col-span-3">
              <label htmlFor="preferredContactMethod" className="block text-sm font-medium text-gray-700">
                Preferred Contact Method
              </label>
              <select
                id="preferredContactMethod"
                name="preferredContactMethod"
                value={formData.preferredContactMethod}
                onChange={handleChange}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="text">Text Message</option>
              </select>
            </div>
            
            {/* Website */}
            <div className="sm:col-span-3">
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                Website
              </label>
              <input
                type="url"
                name="website"
                id="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://example.com"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
            </div>
            
            {/* Hourly Rate */}
            <div className="sm:col-span-3">
              <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
                Hourly Rate ($)
              </label>
              <input
                type="text"
                name="hourlyRate"
                id="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleChange}
                placeholder="e.g. 75"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
            </div>
            
            {/* Years of Experience */}
            <div className="sm:col-span-3">
              <label htmlFor="yearsExperience" className="block text-sm font-medium text-gray-700">
                Years of Experience
              </label>
              <select
                id="yearsExperience"
                name="yearsExperience"
                value={formData.yearsExperience}
                onChange={handleChange}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              >
                <option value="0-2">0-2 years</option>
                <option value="3-5">3-5 years</option>
                <option value="5-10">5-10 years</option>
                <option value="10-15">10-15 years</option>
                <option value="15+">15+ years</option>
              </select>
            </div>
            
            {/* Services Section */}
            <div className="sm:col-span-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Services</h3>
            </div>
            
            {/* Service Types */}
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Services Offered * <span className="text-red-500">Required</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                {SERVICE_TYPES.map(service => (
                  <div key={service.id} className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id={`service-${service.id}`}
                        name={`service-${service.id}`}
                        type="checkbox"
                        checked={formData.serviceTypes.includes(service.id)}
                        onChange={() => handleCheckboxChange(service.id)}
                        className="focus:ring-teal-500 h-4 w-4 text-teal-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor={`service-${service.id}`} className="font-medium text-gray-700">
                        {service.name}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              {formData.serviceTypes.length === 0 && (
                <p className="mt-2 text-sm text-red-600">Please select at least one service.</p>
              )}
              <p className="mt-2 text-xs text-gray-500">Select all services that you provide to landlords.</p>
            </div>
            
            {/* Service Area */}
            <div className="sm:col-span-6">
              <label htmlFor="serviceArea" className="block text-sm font-medium text-gray-700">
                Service Area * <span className="text-red-500">Required</span>
              </label>
              <input
                type="text"
                name="serviceArea"
                id="serviceArea"
                value={formData.serviceArea}
                onChange={handleChange}
                required
                placeholder="e.g. New York City, NY or 10-mile radius around ZIP 10001"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Specify the geographic area where you're available to work.</p>
            </div>
            
            {/* Availability Notes */}
            <div className="sm:col-span-6">
              <label htmlFor="availabilityNotes" className="block text-sm font-medium text-gray-700">
                Availability Notes
              </label>
              <textarea
                name="availabilityNotes"
                id="availabilityNotes"
                value={formData.availabilityNotes}
                onChange={handleChange}
                rows="3"
                placeholder="e.g. Available weekdays 8am-5pm, emergency services 24/7"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
            </div>
            
            {/* Bio */}
            <div className="sm:col-span-6">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Professional Bio
              </label>
              <textarea
                name="bio"
                id="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="4"
                placeholder="Tell landlords about your experience, qualifications, and specialties..."
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
            </div>
            
            {/* Business Information Section */}
            <div className="sm:col-span-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
            </div>
            
            {/* Tax ID */}
            <div className="sm:col-span-3">
              <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">
                Tax ID / EIN
              </label>
              <input
                type="text"
                name="taxId"
                id="taxId"
                value={formData.taxId}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
            </div>
            
            {/* Insurance Info */}
            <div className="sm:col-span-3">
              <label htmlFor="insuranceInfo" className="block text-sm font-medium text-gray-700">
                Insurance Information
              </label>
              <input
                type="text"
                name="insuranceInfo"
                id="insuranceInfo"
                value={formData.insuranceInfo}
                onChange={handleChange}
                placeholder="e.g. Liability Insurance #123456"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
            </div>
          </div>
          
          {/* Success/Error Messages */}
          {(success || error) && (
            <div className={`mt-6 p-4 rounded-md ${success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {success || error}
            </div>
          )}
          
          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading || formData.serviceTypes.length === 0}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      
      {renderDocumentSection()}
    </div>
  );
};

export default ContractorProfileSettings; 