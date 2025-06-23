import React, { useState } from 'react';
import { doc, setDoc, getDoc, updateDoc, collection, runTransaction, arrayUnion, increment } from 'firebase/firestore';
import { db, auth, callFunction } from '../../firebase/config';
import PropTypes from 'prop-types';

/**
 * Component for tenants to provide feedback on completed maintenance jobs
 * Includes star rating, comments, and category selection
 */
const FeedbackForm = ({ ticketId, contractorId, contractorName, onClose }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Constants for validation
  const MAX_FEEDBACK_LENGTH = 500;

  const validateForm = () => {
    const errors = {};
    
    if (rating === 0) {
      errors.rating = 'Please select a rating';
    }
    
    if (feedback.length > MAX_FEEDBACK_LENGTH) {
      errors.feedback = `Feedback must be less than ${MAX_FEEDBACK_LENGTH} characters`;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Sanitize text input
  const sanitizeText = (text) => {
    // Remove potential XSS characters and scripts
    return text
      .replace(/<(|\/|[^>\/bi]|\/[^>bi]|[^\/>][^>]+|\/[^>][^>]+)>/g, '')
      .trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('You must be logged in to submit feedback');
      }
      
      // Sanitize feedback text
      const sanitizedFeedback = sanitizeText(feedback);
      
      // Get reference to the ticket
      const ticketRef = doc(db, 'tickets', ticketId);
      const ticketSnap = await getDoc(ticketRef);
      
      if (!ticketSnap.exists()) {
        throw new Error('Ticket not found');
      }
      
      // Ensure ticket is completed
      const ticketData = ticketSnap.data();
      if (ticketData.status !== 'completed') {
        throw new Error('Can only provide feedback for completed tickets');
      }
      
      // Ensure contractor exists
      if (!contractorId) {
        throw new Error('No contractor assigned to this ticket');
      }
      
      // Create feedback subcollection in ticket
      const feedbackRef = doc(db, `tickets/${ticketId}/feedback`, currentUser.uid);
      
      // Create feedback data
      const feedbackData = {
        tenantId: currentUser.uid,
        tenantName: currentUser.displayName || 'Anonymous',
        contractorId,
        contractorName: contractorName || 'Unknown Contractor',
        rating,
        comment: sanitizedFeedback,
        createdAt: new Date().toISOString()
      };
      
      // Use a transaction to ensure all updates happen atomically
      await runTransaction(db, async (transaction) => {
        // Add feedback to ticket subcollection
        transaction.set(feedbackRef, feedbackData);
        
        // Update ticket with feedback flag
        transaction.update(ticketRef, {
          hasFeedback: true,
          feedbackRating: rating,
          feedbackDate: new Date().toISOString()
        });
        
        // Update contractor profile with new rating
        const contractorProfileRef = doc(db, 'contractorProfiles', contractorId);
        const contractorSnap = await transaction.get(contractorProfileRef);
        
        if (contractorSnap.exists()) {
          // Get existing ratings data or initialize if not present
          const contractorData = contractorSnap.data();
          const totalRatings = contractorData.totalRatings || 0;
          const totalRatingSum = contractorData.totalRatingSum || 0;
          
          // Update contractor profile with new rating
          transaction.update(contractorProfileRef, {
            totalRatings: increment(1),
            totalRatingSum: increment(rating),
            averageRating: (totalRatingSum + rating) / (totalRatings + 1),
            feedback: arrayUnion({
              ticketId,
              rating,
              comment: sanitizedFeedback.substring(0, 100), // Store truncated version
              createdAt: new Date().toISOString()
            })
          });
        } else {
          // Create new contractor profile if it doesn't exist
          transaction.set(contractorProfileRef, {
            uid: contractorId,
            totalRatings: 1,
            totalRatingSum: rating,
            averageRating: rating,
            feedback: [{
              ticketId,
              rating,
              comment: sanitizedFeedback.substring(0, 100),
              createdAt: new Date().toISOString()
            }]
          });
        }
      });
      
      // Also send notification to contractor and landlord about new feedback
      await callFunction('sendNotification', {
        userId: contractorId,
        title: 'New Feedback Received',
        message: `You received a ${rating}-star rating for ticket #${ticketId.substring(0, 6)}`,
        type: 'feedback'
      });
      
      // Reset form and show success message
      setSuccess(true);
      
      // Close form after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Rate Work by {contractorName || 'Contractor'}
        </h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {success ? (
        <div className="text-center p-4 bg-green-50 rounded-md">
          <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <p className="mt-2 text-sm text-green-800">Thank you for your feedback!</p>
          <p className="text-xs text-green-700 mt-1">
            Your rating helps improve contractor performance.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rate the quality of work: <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    setRating(star);
                    if (validationErrors.rating) {
                      const newErrors = {...validationErrors};
                      delete newErrors.rating;
                      setValidationErrors(newErrors);
                    }
                  }}
                  className="focus:outline-none"
                >
                  <svg 
                    className={`h-8 w-8 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            {validationErrors.rating && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.rating}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
              Additional comments (optional):
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value);
                if (validationErrors.feedback && e.target.value.length <= MAX_FEEDBACK_LENGTH) {
                  const newErrors = {...validationErrors};
                  delete newErrors.feedback;
                  setValidationErrors(newErrors);
                }
              }}
              rows={3}
              maxLength={MAX_FEEDBACK_LENGTH}
              className={`block w-full rounded-md shadow-sm sm:text-sm ${
                validationErrors.feedback 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="Please share your experience..."
            ></textarea>
            <div className="mt-1 flex justify-between">
              <p className={`text-xs ${feedback.length > MAX_FEEDBACK_LENGTH * 0.8 ? 'text-orange-500' : 'text-gray-500'}`}>
                {feedback.length}/{MAX_FEEDBACK_LENGTH} characters
              </p>
              {validationErrors.feedback && (
                <p className="text-sm text-red-600">{validationErrors.feedback}</p>
              )}
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

FeedbackForm.propTypes = {
  ticketId: PropTypes.string.isRequired,
  contractorId: PropTypes.string.isRequired,
  contractorName: PropTypes.string,
  onClose: PropTypes.func.isRequired
};

export default FeedbackForm; 