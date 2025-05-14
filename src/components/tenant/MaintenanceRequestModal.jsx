import React, { useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Button from '../ui/Button';
import { XMarkIcon, PhotoIcon, TicketIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

const MaintenanceRequestModal = ({ isOpen, onClose, onSubmit }) => {
  const [description, setDescription] = useState('');
  const [issueType, setIssueType] = useState('Plumbing'); // Default issue type
  const [urgency, setUrgency] = useState('Normal'); // Default urgency
  const [photos, setPhotos] = useState([]); // Store file objects
  const [photoPreviews, setPhotoPreviews] = useState([]); // Store preview URLs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const MAX_PHOTOS = 3;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

  const handlePhotoChange = (event) => {
    const files = Array.from(event.target.files);
    let currentPhotos = [...photos];
    let currentPreviews = [...photoPreviews];
    let fileError = '';

    if (currentPhotos.length + files.length > MAX_PHOTOS) {
      fileError = `You can upload a maximum of ${MAX_PHOTOS} photos.`;
      files.splice(MAX_PHOTOS - currentPhotos.length); // Keep only allowed number
    }

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        fileError = fileError || `File "${file.name}" is too large (max 5MB).`;
        return; // Skip this file
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        fileError = fileError || `File "${file.name}" has an unsupported type.`;
        return; // Skip this file
      }
      currentPhotos.push(file);
      currentPreviews.push(URL.createObjectURL(file));
    });

    setPhotos(currentPhotos);
    setPhotoPreviews(currentPreviews);
    if (fileError) {
        setError(fileError); // Show the first error encountered
    } else {
        setError(''); // Clear error if all new files are valid
    }

    // Reset file input for subsequent uploads
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index) => {
    const newPhotos = [...photos];
    const newPreviews = [...photoPreviews];
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(newPreviews[index]);
    newPhotos.splice(index, 1);
    newPreviews.splice(index, 1);
    setPhotos(newPhotos);
    setPhotoPreviews(newPreviews);
  };

  const handleSubmit = async () => {
    setError('');
    if (!description.trim()) {
      setError('Please enter a description of the issue.');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        description,
        issueType,
        urgencyLevel: urgency,
        photos, // Pass file objects to the handler
      };
      console.log("Submitting maintenance request:", requestData);
      await onSubmit(requestData);
      resetFormAndClose();
    } catch (err) {
      console.error("Error submitting maintenance request:", err);
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const resetFormAndClose = () => {
      setDescription('');
      setIssueType('Plumbing');
      setUrgency('Normal');
      // Clean up preview URLs
      photoPreviews.forEach(url => URL.revokeObjectURL(url));
      setPhotos([]);
      setPhotoPreviews([]);
      setError('');
      setLoading(false);
      onClose();
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={resetFormAndClose}>
        {/* Backdrop */}
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-background dark:bg-background-dark p-6 text-left align-middle shadow-xl transition-all border border-border dark:border-border-dark">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-content dark:text-content-dark flex items-center">
                  <TicketIcon className="w-6 h-6 mr-2 text-primary dark:text-primary-light" />
                  Submit Maintenance Request
                </Dialog.Title>
                <Button variant="ghost" size="sm" onClick={resetFormAndClose} className="!absolute top-2 right-2 !p-1" icon={<XMarkIcon className="w-5 h-5"/>} aria-label="Close" />

                <div className="mt-4 space-y-4">
                  {error && (
                    <div className="rounded-md bg-danger-subtle dark:bg-danger-darkSubtle p-3">
                      <p className="text-sm text-danger dark:text-red-400">{error}</p>
                    </div>
                  )}
                  
                  {/* Issue Type */} 
                  <div>
                    <label htmlFor="issueType" className="block text-sm font-medium text-content-secondary dark:text-content-darkSecondary">Issue Type</label>
                    <select 
                      id="issueType" 
                      name="issueType" 
                      value={issueType} 
                      onChange={(e) => setIssueType(e.target.value)} 
                      className="mt-1 block w-full rounded-md border-border dark:border-border-dark shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-subtle dark:bg-background-dark text-content dark:text-content-dark"
                    >
                      <option>Plumbing</option>
                      <option>Electrical</option>
                      <option>HVAC</option>
                      <option>Appliance</option>
                      <option>Structural</option>
                      <option>Other</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-content-secondary dark:text-content-darkSecondary">Description of Issue</label>
                    <textarea
                      id="description"
                      name="description"
                      rows="4"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1 block w-full rounded-md border-border dark:border-border-dark shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-subtle dark:bg-background-dark text-content dark:text-content-dark"
                      placeholder="Please provide as much detail as possible..."
                      required
                    />
                  </div>
                  
                  {/* Urgency */}
                   <div>
                    <label htmlFor="urgency" className="block text-sm font-medium text-content-secondary dark:text-content-darkSecondary">Urgency (Optional)</label>
                    <select 
                      id="urgency" 
                      name="urgency" 
                      value={urgency} 
                      onChange={(e) => setUrgency(e.target.value)} 
                      className="mt-1 block w-full rounded-md border-border dark:border-border-dark shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-subtle dark:bg-background-dark text-content dark:text-content-dark"
                    >
                      <option>Normal</option>
                      <option>High</option>
                      <option>Low</option>
                    </select>
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-content-secondary dark:text-content-darkSecondary">Add Photos (Optional, Max {MAX_PHOTOS})</label>
                    <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-border dark:border-border-dark px-6 pt-5 pb-6 bg-background-subtle dark:bg-background-darkSubtle hover:border-primary dark:hover:border-primary-light transition-colors">
                      <div className="space-y-1 text-center">
                         <PhotoIcon className="mx-auto h-12 w-12 text-content-subtle dark:text-content-darkSubtle" />
                        <div className="flex text-sm text-content-secondary dark:text-content-darkSecondary">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md bg-background dark:bg-background-dark font-medium text-primary dark:text-primary-light focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 dark:focus-within:ring-offset-background-dark hover:text-primary-dark dark:hover:text-primary"
                          >
                            <span>Upload files</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept={ALLOWED_TYPES.join(',')} onChange={handlePhotoChange} ref={fileInputRef} />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-content-subtle dark:text-content-darkSubtle">PNG, JPG, GIF up to 5MB</p>
                      </div>
                    </div>
                    {/* Photo Previews */} 
                    {photoPreviews.length > 0 && (
                         <div className="mt-4 grid grid-cols-3 gap-2">
                            {photoPreviews.map((previewUrl, index) => (
                                <div key={index} className="relative group">
                                    <img src={previewUrl} alt={`Preview ${index + 1}`} className="h-24 w-full object-cover rounded-md border border-border dark:border-border-dark" />
                                    <Button
                                        variant="danger"
                                        size="xs"
                                        onClick={() => removePhoto(index)}
                                        className="absolute -top-2 -right-2 !p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        icon={<XMarkIcon className="h-3 w-3" />}
                                        aria-label="Remove photo"
                                    />
                                </div>
                            ))}
                         </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <Button variant="outline" onClick={resetFormAndClose} disabled={loading}>Cancel</Button>
                  <Button variant="primary" onClick={handleSubmit} isLoading={loading} disabled={loading}>Submit Request</Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default MaintenanceRequestModal; 