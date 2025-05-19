import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { InviteSchema } from '../../schemas/inviteZodSchema';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import { auth } from '../../firebase/config';

interface Property {
  id: string;
  name: string;
}

interface InviteTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: string;
  propertyName?: string;
  properties?: Property[];
}

const InviteTenantModal: React.FC<InviteTenantModalProps> = ({
  isOpen,
  onClose,
  propertyId,
  propertyName,
  properties = [],
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState(propertyId || '');
  const [error, setError] = useState('');

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setSelectedPropertyId(propertyId || '');
      setError('');
    }
  }, [isOpen, propertyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate property selection
    if (!selectedPropertyId && (!propertyId && properties.length > 0)) {
      setError('Please select a property');
      return;
    }
    // Validate email
    try {
      InviteSchema.shape.tenantEmail.parse(email);
    } catch {
      setError('Please enter a valid email address');
      return;
    }

    if (!auth.currentUser?.uid) {
      setError('You must be logged in as a landlord to send invites.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const selectedProperty =
        properties.find((p) => p.id === selectedPropertyId) ||
        (propertyId ? { id: propertyId, name: propertyName } : undefined);

      if (!selectedProperty?.id) {
        setError('Property ID is required');
        setLoading(false);
        return;
      }

      await api.create(
        'invites',
        {
          tenantEmail: email,
          propertyId: selectedProperty.id,
          propertyName: selectedProperty.name,
          landlordId: auth.currentUser.uid,
          status: 'pending',
          emailSentStatus: 'pending',
          createdAt: new Date().toISOString(),
        },
        InviteSchema
      );

      toast.success('Invitation sent successfully');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  // Determine if property selection should be shown
  const showPropertySelect =
    (!propertyId && properties.length > 0) || (properties.length > 1);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-background dark:bg-background-dark p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-content dark:text-content-dark flex items-center"
                  >
                    <EnvelopeIcon className="w-5 h-5 mr-2 text-primary dark:text-primary-light" />
                    Invite Tenant
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                    onClick={onClose}
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  {showPropertySelect && (
                    <div>
                      <label htmlFor="property" className="block text-sm font-medium text-content dark:text-content-dark mb-1">
                        Select Property
                      </label>
                      <select
                        id="property"
                        value={selectedPropertyId}
                        onChange={(e) => setSelectedPropertyId(e.target.value)}
                        className="w-full rounded-lg border border-border dark:border-border-dark bg-background dark:bg-background-dark text-content dark:text-content-dark px-3 py-2"
                        required
                      >
                        <option value="">Select a property</option>
                        {properties.map((property) => (
                          <option key={property.id} value={property.id}>
                            {property.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-content dark:text-content-dark mb-1">
                      Tenant Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-border dark:border-border-dark bg-background dark:bg-background-dark text-content dark:text-content-dark px-3 py-2"
                      placeholder="Enter tenant's email"
                      required
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-red-600">{error}</div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onClose}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading || !email.trim()}
                    >
                      {loading ? 'Sending...' : 'Send Invitation'}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default InviteTenantModal;