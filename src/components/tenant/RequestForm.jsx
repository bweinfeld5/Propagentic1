import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import Button from '../ui/Button';
import { Wrench, AlertCircle } from 'lucide-react';
import dataService from '../../services/dataService';

const RequestForm = ({ onSuccess, currentUser, userProfile }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    urgency: 'medium',
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'hvac', label: 'HVAC' },
    { value: 'appliance', label: 'Appliance' },
    { value: 'structural', label: 'Structural' }
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low - Can wait a few days', color: 'text-green-600' },
    { value: 'medium', label: 'Medium - Within 48 hours', color: 'text-yellow-600' },
    { value: 'high', label: 'High - Within 24 hours', color: 'text-orange-600' },
    { value: 'emergency', label: 'Emergency - Immediate', color: 'text-red-600' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the ticket data
      const ticketData = {
        issueTitle: formData.title,
        description: formData.description,
        category: formData.category,
        urgency: formData.urgency,
        location: formData.location,
        status: 'open',
        submittedBy: currentUser.uid,
        propertyId: userProfile?.propertyId || 'demo-property',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Submit the ticket
      await dataService.createTicket(ticketData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'general',
        urgency: 'medium',
        location: ''
      });
      
      // Call success handler
      if (onSuccess) {
        onSuccess();
      }
      
      toast.success('Maintenance request submitted successfully!');
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      toast.error('Failed to submit maintenance request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-teal-50 rounded-lg">
          <Wrench className="h-5 w-5 text-teal-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">New Maintenance Request</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Issue Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Brief description of the issue"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Urgency */}
        <div>
          <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">
            Urgency Level
          </label>
          <select
            id="urgency"
            name="urgency"
            value={formData.urgency}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            {urgencyLevels.map(level => (
              <option key={level.value} value={level.value} className={level.color}>
                {level.label}
              </option>
            ))}
          </select>
          {formData.urgency === 'emergency' && (
            <div className="mt-2 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
              <p className="text-sm text-red-600">
                For true emergencies, please also call emergency services or your property manager directly.
              </p>
            </div>
          )}
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location in Unit
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., Kitchen, Master Bathroom"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Detailed Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="Please describe the issue in detail..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            required
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="w-full"
        >
          Submit Request
        </Button>
      </form>
    </div>
  );
};

export default RequestForm;