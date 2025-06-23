import React, { useState, useEffect } from 'react';
import {
  WrenchScrewdriverIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  StarIcon,
  TrophyIcon,
  EyeIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';

const ContractorCommunication = ({ userRole = 'landlord', currentUser = {} }) => {
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [bidForm, setBidForm] = useState({
    amount: '',
    timeline: '',
    description: '',
    materials: []
  });
  const [updateForm, setUpdateForm] = useState({
    status: '',
    description: '',
    photos: [],
    nextSteps: ''
  });

  // Mock data for jobs and communications
  useEffect(() => {
    const mockJobs = [
      {
        id: 'job_001',
        title: 'Bathroom Renovation - Unit 3A',
        description: 'Complete bathroom renovation including plumbing, tiling, and fixture replacement',
        property: 'Sunset Apartments',
        address: '123 Main St, Unit 3A',
        landlord: { id: 'landlord1', name: 'John Smith', rating: 4.8 },
        category: 'Plumbing & Renovation',
        priority: 'medium',
        budget: { min: 5000, max: 8000 },
        timeline: '2 weeks',
        status: 'open',
        postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        requirements: [
          'Licensed contractor required',
          'Must provide materials list',
          'Insurance documentation needed',
          'Previous bathroom renovation experience'
        ],
        attachments: [
          { name: 'bathroom_photos.pdf', size: '2.3 MB', type: 'pdf' },
          { name: 'floor_plan.dwg', size: '1.1 MB', type: 'dwg' }
        ],
        bids: [
          {
            id: 'bid_001',
            contractor: { id: 'contractor1', name: 'Mike Wilson', company: 'Wilson Plumbing Co.', rating: 4.9 },
            amount: 6500,
            timeline: '10 days',
            description: 'Full bathroom renovation with premium fixtures and professional installation',
            submittedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            status: 'submitted'
          },
          {
            id: 'bid_002',
            contractor: { id: 'contractor2', name: 'Sarah Davis', company: 'Elite Renovations', rating: 4.7 },
            amount: 7200,
            timeline: '14 days',
            description: 'Complete renovation with eco-friendly materials and 2-year warranty',
            submittedDate: new Date(Date.now() - 8 * 60 * 60 * 1000),
            status: 'submitted'
          }
        ]
      },
      {
        id: 'job_002',
        title: 'HVAC System Maintenance',
        description: 'Annual HVAC system inspection and maintenance for entire building',
        property: 'Downtown Lofts',
        address: '456 Business Ave',
        landlord: { id: 'landlord1', name: 'John Smith', rating: 4.8 },
        category: 'HVAC',
        priority: 'high',
        budget: { min: 2000, max: 3500 },
        timeline: '3 days',
        status: 'in_progress',
        assignedContractor: { id: 'contractor3', name: 'Tom Rodriguez', company: 'Climate Control Pros' },
        postedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updates: [
          {
            id: 'update_001',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            status: 'started',
            description: 'Beginning HVAC inspection on all units. Found minor issues with Unit 2B filter.',
            photos: ['hvac_inspection_1.jpg'],
            nextSteps: 'Continue inspection and replace filters as needed'
          },
          {
            id: 'update_002',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            status: 'in_progress',
            description: 'Completed inspection of floors 1-3. Serviced all units and replaced 6 filters.',
            photos: ['hvac_inspection_2.jpg', 'hvac_inspection_3.jpg'],
            nextSteps: 'Final inspection of penthouse units tomorrow'
          }
        ]
      }
    ];

    setJobs(mockJobs);
  }, []);

  // File upload for bid attachments
  const { getRootProps: getBidRootProps, getInputProps: getBidInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      setBidForm(prev => ({
        ...prev,
        materials: [...prev.materials, ...acceptedFiles.map(file => ({
          name: file.name,
          size: file.size,
          url: URL.createObjectURL(file)
        }))]
      }));
    },
    multiple: true
  });

  // File upload for job updates
  const { getRootProps: getUpdateRootProps, getInputProps: getUpdateInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      setUpdateForm(prev => ({
        ...prev,
        photos: [...prev.photos, ...acceptedFiles.map(file => ({
          name: file.name,
          size: file.size,
          url: URL.createObjectURL(file)
        }))]
      }));
    },
    multiple: true,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    }
  });

  const submitBid = () => {
    // Mock bid submission
    console.log('Submitting bid:', bidForm);
    setShowBidModal(false);
    setBidForm({ amount: '', timeline: '', description: '', materials: [] });
  };

  const submitUpdate = () => {
    // Mock update submission
    console.log('Submitting update:', updateForm);
    setShowUpdateModal(false);
    setUpdateForm({ status: '', description: '', photos: [], nextSteps: '' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderJobsList = () => (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div
          key={job.id}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setSelectedJob(job)}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                  {job.status.replace('_', ' ')}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(job.priority)}`}>
                  {job.priority} priority
                </span>
              </div>
              
              <p className="text-gray-600 mb-3">{job.description}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  {job.property} - {job.address}
                </div>
                <div className="flex items-center gap-1">
                  <CurrencyDollarIcon className="w-4 h-4" />
                  ${job.budget.min.toLocaleString()} - ${job.budget.max.toLocaleString()}
                </div>
                <div className="flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" />
                  {job.timeline}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-2">
                Posted {format(job.postedDate, 'MMM d, yyyy')}
              </div>
              {job.bids && (
                <div className="text-sm font-medium text-blue-600">
                  {job.bids.length} bid{job.bids.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
          
          {userRole === 'contractor' && job.status === 'open' && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CalendarIcon className="w-4 h-4" />
                Deadline: {format(job.deadline, 'MMM d, yyyy')}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedJob(job);
                  setShowBidModal(true);
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
              >
                Submit Bid
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderJobDetails = () => {
    if (!selectedJob) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <WrenchScrewdriverIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Job</h3>
            <p className="text-gray-600">Choose a job from the list to view details</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        {/* Job Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-gray-900">{selectedJob.title}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedJob.status)}`}>
                {selectedJob.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-gray-600 mb-4">{selectedJob.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Property</label>
                <p className="text-gray-900">{selectedJob.property}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Address</label>
                <p className="text-gray-900">{selectedJob.address}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Budget Range</label>
                <p className="text-gray-900">
                  ${selectedJob.budget.min.toLocaleString()} - ${selectedJob.budget.max.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Timeline</label>
                <p className="text-gray-900">{selectedJob.timeline}</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setSelectedJob(null)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Requirements */}
        {selectedJob.requirements && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Requirements</h3>
            <ul className="space-y-2">
              {selectedJob.requirements.map((req, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-700">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Attachments */}
        {selectedJob.attachments && selectedJob.attachments.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Attachments</h3>
            <div className="space-y-2">
              {selectedJob.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{attachment.name}</p>
                    <p className="text-sm text-gray-500">{attachment.size}</p>
                  </div>
                  <button className="ml-auto p-1 text-orange-600 hover:text-orange-700">
                    <EyeIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bids Section (for landlords) */}
        {userRole === 'landlord' && selectedJob.bids && selectedJob.bids.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Submitted Bids ({selectedJob.bids.length})</h3>
            <div className="space-y-4">
              {selectedJob.bids.map((bid) => (
                <div key={bid.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{bid.contractor.name}</h4>
                      <p className="text-sm text-gray-600">{bid.contractor.company}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{bid.contractor.rating}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">${bid.amount.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">{bid.timeline}</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{bid.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Submitted {format(bid.submittedDate, 'MMM d, yyyy h:mm a')}
                    </span>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-green-600 hover:text-green-700 rounded-lg hover:bg-green-50">
                        <HandThumbUpIcon className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50">
                        <HandThumbDownIcon className="w-4 h-4" />
                      </button>
                      <button className="px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm">
                        Accept Bid
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Job Updates Section */}
        {selectedJob.updates && selectedJob.updates.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Progress Updates</h3>
              {userRole === 'contractor' && selectedJob.status === 'in_progress' && (
                <button
                  onClick={() => setShowUpdateModal(true)}
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  Add Update
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {selectedJob.updates.map((update) => (
                <div key={update.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(update.status)}`}>
                      {update.status.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-500">
                      {format(update.date, 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{update.description}</p>
                  
                  {update.photos && update.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {update.photos.map((photo, index) => (
                        <div key={index} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                          <PhotoIcon className="w-6 h-6 text-gray-400" />
                          <span className="text-xs text-gray-500 ml-1">{photo}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {update.nextSteps && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-1">Next Steps:</p>
                      <p className="text-sm text-blue-800">{update.nextSteps}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100">
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            Message
          </button>
          {userRole === 'contractor' && selectedJob.status === 'open' && (
            <button
              onClick={() => setShowBidModal(true)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Submit Bid
            </button>
          )}
        </div>
      </div>
    );
  };

  // Bid Modal
  const renderBidModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Submit Bid</h3>
            <button
              onClick={() => setShowBidModal(false)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bid Amount ($)
            </label>
            <input
              type="number"
              value={bidForm.amount}
              onChange={(e) => setBidForm({...bidForm, amount: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter your bid amount"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timeline
            </label>
            <input
              type="text"
              value={bidForm.timeline}
              onChange={(e) => setBidForm({...bidForm, timeline: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., 10 days, 2 weeks"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={bidForm.description}
              onChange={(e) => setBidForm({...bidForm, description: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Describe your approach, materials, and any additional services..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Materials & Documentation
            </label>
            <div
              {...getBidRootProps()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400"
            >
              <input {...getBidInputProps()} />
              <DocumentTextIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Drop files here or click to upload</p>
              <p className="text-xs text-gray-500">Materials list, certifications, portfolio images</p>
            </div>
            
            {bidForm.materials.length > 0 && (
              <div className="mt-3 space-y-2">
                {bidForm.materials.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      onClick={() => setBidForm({
                        ...bidForm,
                        materials: bidForm.materials.filter((_, i) => i !== index)
                      })}
                      className="ml-auto p-1 text-red-500 hover:text-red-700"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={() => setShowBidModal(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={submitBid}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Submit Bid
          </button>
        </div>
      </div>
    </div>
  );

  // Update Modal
  const renderUpdateModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Add Progress Update</h3>
            <button
              onClick={() => setShowUpdateModal(false)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={updateForm.status}
              onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Select status</option>
              <option value="started">Started</option>
              <option value="in_progress">In Progress</option>
              <option value="nearly_complete">Nearly Complete</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={updateForm.description}
              onChange={(e) => setUpdateForm({...updateForm, description: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Describe the work completed, any issues encountered, or milestones reached..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Progress Photos
            </label>
            <div
              {...getUpdateRootProps()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400"
            >
              <input {...getUpdateInputProps()} />
              <PhotoIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Drop photos here or click to upload</p>
              <p className="text-xs text-gray-500">Before/during/after photos of the work</p>
            </div>
            
            {updateForm.photos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {updateForm.photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setUpdateForm({
                        ...updateForm,
                        photos: updateForm.photos.filter((_, i) => i !== index)
                      })}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Next Steps
            </label>
            <textarea
              value={updateForm.nextSteps}
              onChange={(e) => setUpdateForm({...updateForm, nextSteps: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="What's planned for the next phase of work?"
            />
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={() => setShowUpdateModal(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={submitUpdate}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Submit Update
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WrenchScrewdriverIcon className="w-8 h-8 text-orange-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contractor Communications</h1>
              <p className="text-gray-600">Manage jobs, bids, and project updates</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {['jobs', 'messages'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab === 'jobs' ? 'Job Board' : 'Messages'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {activeTab === 'jobs' ? (
          <>
            <div className="w-1/2 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Available Jobs</h2>
                <span className="text-sm text-gray-500">{jobs.length} jobs</span>
              </div>
              {renderJobsList()}
            </div>
            {renderJobDetails()}
          </>
        ) : (
          <div className="flex-1 p-6">
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Contractor Messages</h3>
              <p className="text-gray-600">Direct messaging interface will be integrated here</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showBidModal && renderBidModal()}
      {showUpdateModal && renderUpdateModal()}
    </div>
  );
};

export default ContractorCommunication; 