/**
 * Privacy Dashboard Component for PropAgentic
 * Comprehensive privacy management interface for users
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  AdjustmentsHorizontalIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import privacyManager from '../../services/privacy';
import Button from '../ui/Button';

const PrivacyDashboard = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [privacyData, setPrivacyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // Load privacy dashboard data
  useEffect(() => {
    if (currentUser) {
      loadPrivacyData();
    }
  }, [currentUser]);

  const loadPrivacyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [dashboard, compliance] = await Promise.all([
        privacyManager.services.controls.getPrivacyDashboard(currentUser.uid),
        privacyManager.checkUserPrivacyCompliance(currentUser.uid)
      ]);
      
      setPrivacyData({ dashboard, compliance });
    } catch (error) {
      console.error('Error loading privacy data:', error);
      setError('Failed to load privacy data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyPreferenceUpdate = async (category, setting) => {
    try {
      setActionLoading({ ...actionLoading, [`privacy_${category}`]: true });
      
      await privacyManager.updatePrivacyPreferences(currentUser.uid, {
        privacy: { [category]: setting }
      });
      
      // Reload data to reflect changes
      await loadPrivacyData();
    } catch (error) {
      console.error('Error updating privacy preference:', error);
      setError('Failed to update privacy preference. Please try again.');
    } finally {
      setActionLoading({ ...actionLoading, [`privacy_${category}`]: false });
    }
  };

  const handleConsentUpdate = async (consentType, granted) => {
    try {
      setActionLoading({ ...actionLoading, [`consent_${consentType}`]: true });
      
      await privacyManager.updatePrivacyPreferences(currentUser.uid, {
        gdpr: { [consentType]: granted }
      });
      
      await loadPrivacyData();
    } catch (error) {
      console.error('Error updating consent:', error);
      setError('Failed to update consent. Please try again.');
    } finally {
      setActionLoading({ ...actionLoading, [`consent_${consentType}`]: false });
    }
  };

  const handleDataExport = async (format = 'json') => {
    try {
      setActionLoading({ ...actionLoading, export: true });
      
      const exportResult = await privacyManager.exportUserData(currentUser.uid, format);
      
      // Create and download file
      const blob = new Blob([exportResult.data], {
        type: format === 'json' ? 'application/json' : 'text/csv'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportResult.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show success message
      alert('Your data has been exported successfully.');
      
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Failed to export data. Please try again.');
    } finally {
      setActionLoading({ ...actionLoading, export: false });
    }
  };

  const handleDataDeletion = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete all your data? This action cannot be undone.'
    );
    
    if (!confirmed) return;
    
    try {
      setActionLoading({ ...actionLoading, delete: true });
      
      await privacyManager.deleteUserData(currentUser.uid, {
        reason: 'user_request',
        preserveFinancial: true // Keep financial records for legal compliance
      });
      
      alert('Your data deletion request has been processed.');
      
    } catch (error) {
      console.error('Error deleting data:', error);
      setError('Failed to process data deletion. Please try again.');
    } finally {
      setActionLoading({ ...actionLoading, delete: false });
    }
  };

  const tabs = [
    { id: 'overview', label: 'Privacy Overview', icon: ShieldCheckIcon },
    { id: 'controls', label: 'Privacy Controls', icon: AdjustmentsHorizontalIcon },
    { id: 'data', label: 'Your Data', icon: DocumentArrowDownIcon },
    { id: 'consents', label: 'Consents', icon: CheckCircleIcon }
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <Button onClick={loadPrivacyData} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacy Dashboard</h1>
        <p className="text-gray-600">
          Manage your privacy settings and control how your data is used
        </p>
      </div>

      {/* Privacy Score Card */}
      {privacyData?.compliance && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                privacyData.compliance.overall === 'compliant' 
                  ? 'bg-green-100 text-green-600'
                  : privacyData.compliance.overall === 'needs-attention'
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-red-100 text-red-600'
              }`}>
                {privacyData.compliance.overall === 'compliant' ? (
                  <CheckCircleIcon className="w-6 h-6" />
                ) : (
                  <ExclamationTriangleIcon className="w-6 h-6" />
                )}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Privacy Score</h3>
                <p className="text-sm text-gray-600">
                  Overall privacy compliance: {privacyData.compliance.overall}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {privacyData.compliance.score}/100
              </div>
              <div className="text-sm text-gray-500">
                Last checked: {new Date(privacyData.compliance.timestamp).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <PrivacyOverview 
          data={privacyData} 
          onRefresh={loadPrivacyData}
        />
      )}

      {activeTab === 'controls' && (
        <PrivacyControls 
          data={privacyData?.dashboard}
          onUpdate={handlePrivacyPreferenceUpdate}
          loading={actionLoading}
        />
      )}

      {activeTab === 'data' && (
        <DataManagement 
          onExport={handleDataExport}
          onDelete={handleDataDeletion}
          loading={actionLoading}
        />
      )}

      {activeTab === 'consents' && (
        <ConsentManagement 
          data={privacyData?.dashboard}
          onUpdate={handleConsentUpdate}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

// Privacy Overview Component
const PrivacyOverview = ({ data, onRefresh }) => {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Recommendations */}
      {data.compliance.recommendations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            Privacy Recommendations
          </h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            {data.compliance.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-block w-1 h-1 bg-yellow-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                <span>{rec.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Privacy Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">GDPR Compliance</h3>
              <p className="text-sm text-gray-600">
                {data.compliance.details.gdpr?.status || 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <EyeIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Data Visibility</h3>
              <p className="text-sm text-gray-600">
                Score: {data.compliance.details.privacy?.score || 0}/100
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Cog6ToothIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Privacy Controls</h3>
              <p className="text-sm text-gray-600">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {data.dashboard.recentActivities && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Privacy Activity</h3>
          {data.dashboard.recentActivities.length > 0 ? (
            <div className="space-y-3">
              {data.dashboard.recentActivities.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.eventType}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No recent privacy activity</p>
          )}
        </div>
      )}
    </div>
  );
};

// Privacy Controls Component
const PrivacyControls = ({ data, onUpdate, loading }) => {
  if (!data) return null;

  const categories = privacyManager.services.controls.privacyCategories;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <InformationCircleIcon className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Privacy Controls</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                These settings control how your personal information is shared and used within PropAgentic.
                You can adjust these settings at any time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {Object.entries(categories).map(([categoryId, category]) => (
        <div key={categoryId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
            <p className="text-sm text-gray-600">{category.description}</p>
          </div>
          
          <div className="space-y-3">
            {Object.entries(category.settings).map(([settingId, description]) => {
              const isSelected = data.controls?.preferences[categoryId] === settingId;
              const isLoading = loading[`privacy_${categoryId}`];
              
              return (
                <label key={settingId} className="flex items-start cursor-pointer">
                  <input
                    type="radio"
                    name={categoryId}
                    value={settingId}
                    checked={isSelected}
                    onChange={() => onUpdate(categoryId, settingId)}
                    disabled={isLoading}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{settingId.replace('_', ' ')}</div>
                    <div className="text-sm text-gray-600">{description}</div>
                  </div>
                </label>
              );
            })}
          </div>
          
          {loading[`privacy_${categoryId}`] && (
            <div className="mt-4 text-sm text-gray-500">Updating...</div>
          )}
        </div>
      ))}
    </div>
  );
};

// Data Management Component
const DataManagement = ({ onExport, onDelete, loading }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Export Your Data</h3>
        <p className="text-sm text-gray-600 mb-4">
          Download a copy of all your data stored in PropAgentic. This includes your profile information,
          communication history, and other personal data.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => onExport('json')}
            disabled={loading.export}
            className="flex items-center"
          >
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            {loading.export ? 'Exporting...' : 'Export as JSON'}
          </Button>
          
          <Button
            onClick={() => onExport('csv')}
            disabled={loading.export}
            variant="outline"
            className="flex items-center"
          >
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            {loading.export ? 'Exporting...' : 'Export as CSV'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 text-red-600">Delete Your Data</h3>
        <p className="text-sm text-gray-600 mb-4">
          Permanently delete all your personal data from PropAgentic. This action cannot be undone.
          Note: Some data may be retained for legal and compliance purposes.
        </p>
        
        <Button
          onClick={onDelete}
          disabled={loading.delete}
          variant="danger"
          className="flex items-center"
        >
          <TrashIcon className="w-4 h-4 mr-2" />
          {loading.delete ? 'Deleting...' : 'Delete All My Data'}
        </Button>
      </div>
    </div>
  );
};

// Consent Management Component
const ConsentManagement = ({ data, onUpdate, loading }) => {
  const consents = privacyManager.services.gdpr.consentTypes;

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <CheckCircleIcon className="h-5 w-5 text-green-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Consent Management</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>
                Manage your consents for different types of data processing. You can withdraw consent at any time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {Object.entries(consents).map(([consentId, consent]) => {
        const currentConsent = data?.consentStatus?.consents[consentId];
        const isGranted = currentConsent?.granted || false;
        const isLoading = loading[`consent_${consentId}`];
        
        return (
          <div key={consentId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{consent.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{consent.description}</p>
                
                {!consent.withdrawable && (
                  <p className="text-xs text-orange-600 mt-2">
                    This consent is required for basic platform functionality and cannot be withdrawn.
                  </p>
                )}
              </div>
              
              <div className="ml-4 flex items-center">
                {consent.withdrawable ? (
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGranted}
                      onChange={(e) => onUpdate(consentId, e.target.checked)}
                      disabled={isLoading}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {isGranted ? 'Granted' : 'Withdrawn'}
                    </span>
                  </label>
                ) : (
                  <span className="text-sm text-gray-500">Required</span>
                )}
              </div>
            </div>
            
            {currentConsent?.timestamp && (
              <div className="mt-4 text-xs text-gray-500">
                Last updated: {new Date(currentConsent.timestamp).toLocaleString()}
              </div>
            )}
            
            {isLoading && (
              <div className="mt-4 text-sm text-gray-500">Updating...</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PrivacyDashboard; 