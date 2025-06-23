import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BanknotesIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  EyeIcon,
  DocumentTextIcon,
  PlusIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import StatusPill from '../ui/StatusPill';
import { escrowService } from '../../services/firestore/escrowService';
import EscrowCard from './EscrowCard';
import CreateEscrowModal from './CreateEscrowModal';
import ReleaseRequestModal from './ReleaseRequestModal';
import { EscrowAccount as ServiceEscrowAccount } from '../../services/firestore/escrowService';

interface EscrowAccount extends ServiceEscrowAccount {
  pendingReleaseRequests?: number;
}

interface EscrowDashboardProps {
  userRole: 'landlord' | 'contractor';
}

const EscrowDashboard: React.FC<EscrowDashboardProps> = ({ userRole }) => {
  const { currentUser } = useAuth();
  const [escrowAccounts, setEscrowAccounts] = useState<EscrowAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'pending_release' | 'disputed' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowAccount | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadEscrowAccounts();
  }, [currentUser, userRole]);

  const loadEscrowAccounts = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const accounts = await escrowService.getEscrowAccountsForUser(currentUser.uid, userRole);
      setEscrowAccounts(accounts);
    } catch (error) {
      console.error('Error loading escrow accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEscrow = () => {
    setShowCreateModal(true);
  };

  const handleRequestRelease = (escrow: EscrowAccount) => {
    setSelectedEscrow(escrow);
    setShowReleaseModal(true);
  };

  const handleViewDetails = (escrow: EscrowAccount) => {
    setSelectedEscrow(escrow);
    setShowDetailsModal(true);
  };

  const handleApproveRelease = async (escrow: EscrowAccount) => {
    // Implementation for landlord approving release
    console.log('Approving release for:', escrow.id);
  };

  const onEscrowCreated = () => {
    loadEscrowAccounts();
    setShowCreateModal(false);
  };

  const onReleaseRequestCreated = () => {
    loadEscrowAccounts();
    setShowReleaseModal(false);
  };

  // Filter and sort escrow accounts
  const filteredAndSortedAccounts = escrowAccounts
    .filter(account => {
      switch (filter) {
        case 'active':
          return ['funded', 'created'].includes(account.status);
        case 'pending_release':
          return account.status === 'funded' && account.pendingReleaseRequests! > 0;
        case 'disputed':
          return account.status === 'disputed';
        case 'completed':
          return account.status === 'released';
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.amount - a.amount;
        case 'status':
          return a.status.localeCompare(b.status);
        case 'date':
        default:
          return b.holdStartDate.getTime() - a.holdStartDate.getTime();
      }
    });

  // Calculate summary statistics
  const stats = {
    totalEscrow: escrowAccounts.reduce((sum, account) => 
      ['funded', 'created'].includes(account.status) ? sum + account.amount : sum, 0
    ),
    activeAccounts: escrowAccounts.filter(a => ['funded', 'created'].includes(a.status)).length,
    pendingReleases: escrowAccounts.filter(a => a.pendingReleaseRequests! > 0).length,
    disputedAccounts: escrowAccounts.filter(a => a.status === 'disputed').length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {userRole === 'landlord' ? 'Escrow Management' : 'My Escrow Accounts'}
          </h2>
          <p className="text-gray-600">
            {userRole === 'landlord' 
              ? 'Manage escrow accounts for your property jobs'
              : 'Track your earnings and payment releases'
            }
          </p>
        </div>
        
        {userRole === 'landlord' && (
          <Button variant="primary" onClick={handleCreateEscrow}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Escrow
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BanknotesIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total in Escrow</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalEscrow.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeAccounts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Releases</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingReleases}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Disputed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.disputedAccounts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'active', label: 'Active' },
                { key: 'pending_release', label: 'Pending Release' },
                { key: 'disputed', label: 'Disputed' },
                { key: 'completed', label: 'Completed' }
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key as any)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterOption.key
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date">Date Created</option>
                <option value="amount">Amount</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Escrow Accounts List */}
      <div className="space-y-4">
        {filteredAndSortedAccounts.length === 0 ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
            <BanknotesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No escrow accounts' : `No ${filter.replace('_', ' ')} accounts`}
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? userRole === 'landlord' 
                  ? 'Create your first escrow account to get started'
                  : 'You don\'t have any escrow accounts yet'
                : `No accounts match the current filter: ${filter.replace('_', ' ')}`
              }
            </p>
            {userRole === 'landlord' && filter === 'all' && (
              <Button variant="primary" onClick={handleCreateEscrow}>
                Create Escrow Account
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAndSortedAccounts.map((escrow) => (
              <EscrowCard
                key={escrow.id}
                escrow={escrow}
                userRole={userRole}
                onViewDetails={handleViewDetails}
                onRequestRelease={handleRequestRelease}
                onApproveRelease={handleApproveRelease}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && userRole === 'landlord' && (
        <CreateEscrowModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onEscrowCreated={onEscrowCreated}
        />
      )}

      {showReleaseModal && selectedEscrow && (
        <ReleaseRequestModal
          isOpen={showReleaseModal}
          onClose={() => setShowReleaseModal(false)}
          escrowAccount={selectedEscrow}
          onRequestCreated={onReleaseRequestCreated}
        />
      )}

      {/* Details Modal would go here */}
      {showDetailsModal && selectedEscrow && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDetailsModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Escrow Account Details</h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Account Information</h4>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Job Title:</dt>
                          <dd className="text-gray-900">{selectedEscrow.jobTitle}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Amount:</dt>
                          <dd className="text-gray-900 font-semibold">${selectedEscrow.amount.toLocaleString()}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Status:</dt>
                          <dd>
                            <StatusPill
                              status={selectedEscrow.status}
                              className={selectedEscrow.status === 'funded' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}
                            />
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Property:</dt>
                          <dd className="text-gray-900">{selectedEscrow.propertyAddress}</dd>
                        </div>
                      </dl>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Parties</h4>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Landlord:</dt>
                          <dd className="text-gray-900">{selectedEscrow.landlordName}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Contractor:</dt>
                          <dd className="text-gray-900">{selectedEscrow.contractorName}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {selectedEscrow.milestones && selectedEscrow.milestones.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Milestones</h4>
                      <div className="space-y-3">
                        {selectedEscrow.milestones.map((milestone) => (
                          <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <h5 className="font-medium text-gray-900">{milestone.title}</h5>
                              <p className="text-sm text-gray-600">{milestone.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">${milestone.amount.toLocaleString()}</div>
                              <StatusPill
                                status={milestone.status}
                                className={milestone.status === 'completed' ? 'bg-green-100 text-green-800' : milestone.status === 'released' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EscrowDashboard; 