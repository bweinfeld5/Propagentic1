import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  UserGroupIcon, 
  EyeIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { getAllSurveySubmissions, updateSurveyStatus } from '../../services/surveyService';

const SurveyAdminPage = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    loadSurveys();
  }, [filter]);

  const loadSurveys = async () => {
    try {
      setLoading(true);
      const options = filter !== 'all' ? { status: filter } : {};
      const data = await getAllSurveySubmissions(options);
      setSurveys(data);
    } catch (error) {
      console.error('Error loading surveys:', error);
      toast.error('Failed to load survey submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (surveyId, newStatus, notes = '') => {
    try {
      setUpdating(surveyId);
      await updateSurveyStatus(surveyId, newStatus, notes);
      
      // Update local state
      setSurveys(prev => prev.map(survey => 
        survey.id === surveyId 
          ? { ...survey, reviewStatus: newStatus, reviewNotes: notes }
          : survey
      ));
      
      toast.success(`Survey ${newStatus} successfully`);
    } catch (error) {
      console.error('Error updating survey status:', error);
      toast.error('Failed to update survey status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <ClockIcon className="w-4 h-4" />;
      case 'reviewed': return <EyeIcon className="w-4 h-4" />;
      case 'accepted': return <CheckCircleIcon className="w-4 h-4" />;
      case 'rejected': return <XCircleIcon className="w-4 h-4" />;
      default: return <DocumentTextIcon className="w-4 h-4" />;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const filteredSurveys = surveys.filter(survey => {
    if (filter === 'all') return true;
    return survey.reviewStatus === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading survey submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UserGroupIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Intern Survey Admin</h1>
                <p className="text-gray-600">Manage internship applications and survey responses</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Total Submissions: <span className="font-semibold">{surveys.length}</span>
              </div>
              <button
                onClick={loadSurveys}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Status</h3>
              <div className="space-y-2">
                {[
                  { key: 'all', label: 'All Submissions', count: surveys.length },
                  { key: 'pending', label: 'Pending Review', count: surveys.filter(s => s.reviewStatus === 'pending').length },
                  { key: 'reviewed', label: 'Reviewed', count: surveys.filter(s => s.reviewStatus === 'reviewed').length },
                  { key: 'accepted', label: 'Accepted', count: surveys.filter(s => s.reviewStatus === 'accepted').length },
                  { key: 'rejected', label: 'Rejected', count: surveys.filter(s => s.reviewStatus === 'rejected').length }
                ].map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      filter === key 
                        ? 'bg-blue-100 text-blue-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{label}</span>
                      <span className="text-sm bg-gray-200 px-2 py-1 rounded-full">{count}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {filteredSurveys.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
                <p className="text-gray-600">
                  {filter === 'all' 
                    ? 'No survey submissions have been received yet.' 
                    : `No submissions with status "${filter}" found.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredSurveys.map((survey) => (
                  <div key={survey.id} className="bg-white rounded-lg shadow-sm border">
                    {/* Survey Header */}
                    <div className="p-6 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{survey.fullName}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span>{survey.email}</span>
                              <span>•</span>
                              <span>{survey.university}</span>
                              <span>•</span>
                              <span>{survey.major}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(survey.reviewStatus)}`}>
                            {getStatusIcon(survey.reviewStatus)}
                            <span className="capitalize">{survey.reviewStatus}</span>
                          </span>
                          
                          <button
                            onClick={() => setSelectedSurvey(selectedSurvey?.id === survey.id ? null : survey)}
                            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            {selectedSurvey?.id === survey.id ? 'Hide Details' : 'View Details'}
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                        <span>Submitted: {formatDate(survey.submittedAt)}</span>
                        <span>Graduation: {survey.graduationYear}</span>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedSurvey?.id === survey.id && (
                      <div className="p-6 bg-gray-50">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Personal Information */}
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                              <AcademicCapIcon className="w-5 h-5" />
                              <span>Personal Information</span>
                            </div>
                            
                            <div className="space-y-3 text-sm">
                              <div><strong>Phone:</strong> {survey.phone || 'Not provided'}</div>
                              <div><strong>University:</strong> {survey.university}</div>
                              <div><strong>Major:</strong> {survey.major}</div>
                              <div><strong>Graduation Year:</strong> {survey.graduationYear}</div>
                            </div>
                          </div>

                          {/* Experience & Skills */}
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                              <BriefcaseIcon className="w-5 h-5" />
                              <span>Experience & Skills</span>
                            </div>
                            
                            <div className="space-y-3 text-sm">
                              {survey.technicalSkills && survey.technicalSkills.length > 0 && (
                                <div>
                                  <strong>Technical Skills:</strong>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {survey.technicalSkills.map((skill, index) => (
                                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {survey.interestAreas && survey.interestAreas.length > 0 && (
                                <div>
                                  <strong>Interest Areas:</strong>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {survey.interestAreas.map((area, index) => (
                                      <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                        {area}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Availability */}
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                              <ClockIcon className="w-5 h-5" />
                              <span>Availability</span>
                            </div>
                            
                            <div className="space-y-3 text-sm">
                              <div><strong>Start Date:</strong> {survey.startDate || 'Flexible'}</div>
                              <div><strong>Duration:</strong> {survey.duration || 'Not specified'}</div>
                              <div><strong>Hours/Week:</strong> {survey.hoursPerWeek || 'Not specified'}</div>
                              <div><strong>Work Preference:</strong> {survey.workPreference || 'Not specified'}</div>
                            </div>
                          </div>

                          {/* Links */}
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                              <LinkIcon className="w-5 h-5" />
                              <span>Links & Portfolio</span>
                            </div>
                            
                            <div className="space-y-3 text-sm">
                              {survey.portfolio && (
                                <div>
                                  <strong>Portfolio:</strong> 
                                  <a href={survey.portfolio} target="_blank" rel="noopener noreferrer" 
                                     className="ml-2 text-blue-600 hover:underline">
                                    {survey.portfolio}
                                  </a>
                                </div>
                              )}
                              {survey.github && (
                                <div>
                                  <strong>GitHub:</strong> 
                                  <a href={survey.github} target="_blank" rel="noopener noreferrer" 
                                     className="ml-2 text-blue-600 hover:underline">
                                    {survey.github}
                                  </a>
                                </div>
                              )}
                              {survey.linkedin && (
                                <div>
                                  <strong>LinkedIn:</strong> 
                                  <a href={survey.linkedin} target="_blank" rel="noopener noreferrer" 
                                     className="ml-2 text-blue-600 hover:underline">
                                    {survey.linkedin}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Long Text Fields */}
                        <div className="mt-8 space-y-6">
                          {survey.previousInternships && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Previous Experience</h4>
                              <p className="text-sm text-gray-700 bg-white p-4 rounded-lg border">
                                {survey.previousInternships}
                              </p>
                            </div>
                          )}
                          
                          {survey.relevantExperience && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Relevant Experience</h4>
                              <p className="text-sm text-gray-700 bg-white p-4 rounded-lg border">
                                {survey.relevantExperience}
                              </p>
                            </div>
                          )}
                          
                          {survey.careerGoals && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Career Goals</h4>
                              <p className="text-sm text-gray-700 bg-white p-4 rounded-lg border">
                                {survey.careerGoals}
                              </p>
                            </div>
                          )}
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Why PropAgentic?</h4>
                            <p className="text-sm text-gray-700 bg-white p-4 rounded-lg border">
                              {survey.whyPropAgentic}
                            </p>
                          </div>
                          
                          {survey.additionalComments && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Additional Comments</h4>
                              <p className="text-sm text-gray-700 bg-white p-4 rounded-lg border">
                                {survey.additionalComments}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex items-center justify-between pt-6 border-t">
                          <div className="flex space-x-3">
                            {survey.reviewStatus !== 'accepted' && (
                              <button
                                onClick={() => handleStatusUpdate(survey.id, 'accepted')}
                                disabled={updating === survey.id}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                              >
                                {updating === survey.id ? 'Updating...' : 'Accept'}
                              </button>
                            )}
                            
                            {survey.reviewStatus !== 'rejected' && (
                              <button
                                onClick={() => handleStatusUpdate(survey.id, 'rejected')}
                                disabled={updating === survey.id}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                {updating === survey.id ? 'Updating...' : 'Reject'}
                              </button>
                            )}
                            
                            {survey.reviewStatus !== 'reviewed' && (
                              <button
                                onClick={() => handleStatusUpdate(survey.id, 'reviewed')}
                                disabled={updating === survey.id}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                              >
                                {updating === survey.id ? 'Updating...' : 'Mark as Reviewed'}
                              </button>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-500">
                            ID: {survey.id}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyAdminPage; 