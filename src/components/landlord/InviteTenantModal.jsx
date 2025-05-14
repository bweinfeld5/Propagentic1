import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Button from '../ui/Button';
import { XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline';

const InviteTenantModal = ({ isOpen, onClose, onInvite, propertyId, propertyName, properties }) => {
  const [tenantEmail, setTenantEmail] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState(propertyId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
        setSelectedPropertyId(propertyId || '');
        setTenantEmail('');
        setError('');
        setLoading(false);
    }
  }, [isOpen, propertyId]);

  const handleInvite = async () => {
    setError('');
    if (!tenantEmail || !tenantEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!selectedPropertyId) {
        setError('Please select a property to invite the tenant to.');
        return;
    }

    setLoading(true);
    try {
      console.log(`Inviting tenant ${tenantEmail} to property ${selectedPropertyId}`);
      await onInvite(selectedPropertyId, tenantEmail);
      setTenantEmail('');
      setSelectedPropertyId(propertyId || '');
      onClose();
    } catch (err) {
      console.error("Error inviting tenant:", err);
      setError(err.message || 'Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
      setSelectedPropertyId(propertyId || '');
      setTenantEmail('');
      setError('');
      setLoading(false);
      onClose();
  }

  const modalTitle = propertyName 
    ? `Invite Tenant to ${propertyName}` 
    : 'Invite Tenant to a Property';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-background dark:bg-background-dark p-6 text-left align-middle shadow-xl transition-all border border-border dark:border-border-dark">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-content dark:text-content-dark flex items-center"
                >
                  <UserPlusIcon className="w-6 h-6 mr-2 text-primary dark:text-primary-light" />
                  {modalTitle}
                </Dialog.Title>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose} 
                  className="!absolute top-2 right-2 !p-1"
                  icon={<XMarkIcon className="w-5 h-5"/>}
                  aria-label="Close"
                />

                <div className="mt-4 space-y-4">
                  {error && (
                    <div className="rounded-md bg-danger-subtle dark:bg-danger-darkSubtle p-3">
                      <p className="text-sm text-danger dark:text-red-400">{error}</p>
                    </div>
                  )}
                  {!propertyId && properties && properties.length > 0 && (
                      <div className="mb-4">
                          <label htmlFor="propertySelect" className="block text-sm font-medium text-content-secondary dark:text-content-darkSecondary">Select Property</label>
                          <select
                              id="propertySelect"
                              name="propertySelect"
                              value={selectedPropertyId}
                              onChange={(e) => {
                                  setSelectedPropertyId(e.target.value);
                                  if (error) setError('');
                              }}
                              className="mt-1 block w-full rounded-md border-border dark:border-border-dark shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-subtle dark:bg-background-darkSubtle text-content dark:text-content-dark"
                              required
                          >
                              <option value="">-- Select a Property --</option>
                              {properties.map((prop) => (
                                  <option key={prop.id} value={prop.id}>{prop.name}</option>
                              ))}
                          </select>
                      </div>
                  )}
                  {propertyId && propertyName && (
                      <div className="mb-4">
                          <p className="text-sm text-content-secondary dark:text-content-darkSecondary">Inviting to property:</p>
                          <p className="text-sm font-medium text-content dark:text-content-dark">{propertyName}</p>
                      </div>
                  )}
                  <div>
                    <label htmlFor="tenantEmail" className="block text-sm font-medium text-content-secondary dark:text-content-darkSecondary">Tenant's Email Address</label>
                    <input
                      type="email"
                      name="tenantEmail"
                      id="tenantEmail"
                      value={tenantEmail}
                      onChange={(e) => {
                        setTenantEmail(e.target.value);
                        if (error) setError('');
                      }}
                      className="mt-1 block w-full rounded-md border-border dark:border-border-dark shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-subtle dark:bg-background-darkSubtle text-content dark:text-content-dark"
                      placeholder="tenant@example.com"
                      required
                    />
                  </div>
                  <p className="text-xs text-content-subtle dark:text-content-darkSubtle">
                      The tenant will receive an email invitation to join Propagentic and link to this property.
                  </p>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <Button variant="outline" onClick={handleClose} disabled={loading}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleInvite} isLoading={loading} disabled={loading}>
                    {loading ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default InviteTenantModal; 