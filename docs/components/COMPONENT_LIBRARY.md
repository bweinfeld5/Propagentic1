# Propagentic Component Library Documentation

## Table of Contents
- [Design System Overview](#design-system-overview)
- [Core UI Components](#core-ui-components)
- [Form Components](#form-components)
- [Status & Display Components](#status--display-components)
- [Layout Components](#layout-components)
- [Business Components](#business-components)
- [Component Guidelines](#component-guidelines)
- [Development Patterns](#development-patterns)

## Design System Overview

The Propagentic component library is built on a consistent design system with standardized tokens, patterns, and accessibility features. All components follow the same architectural principles and visual language.

### Design Tokens
```css
/* Color System */
--color-propagentic-teal: #0F766E;
--color-propagentic-blue: #1E40AF;
--color-propagentic-yellow: #F59E0B;
--color-propagentic-error: #EF4444;
--color-propagentic-success: #10B981;

/* Spacing Scale */
--spacing-xs: 0.5rem;    /* 8px */
--spacing-sm: 0.75rem;   /* 12px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */

/* Typography Scale */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
```

### Accessibility Standards
- WCAG 2.1 AA compliance for color contrast
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Semantic HTML structure

## Core UI Components

### Button Component
**File**: `src/components/ui/Button.jsx`  
**Purpose**: Primary interactive element for user actions

```jsx
import Button from '../ui/Button';

// Basic Usage
<Button onClick={handleClick}>
  Click Me
</Button>

// Variants
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="outline">Outline Style</Button>
<Button variant="danger">Destructive Action</Button>
<Button variant="success">Success Action</Button>
<Button variant="ghost">Subtle Action</Button>

// Sizes
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium (Default)</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>

// States
<Button disabled>Disabled Button</Button>
<Button loading>Loading...</Button>
<Button active>Active State</Button>

// With Icons
<Button icon={<PlusIcon />}>Add Item</Button>
<Button icon={<ArrowRightIcon />} iconPosition="right">
  Next Step
</Button>
<Button iconOnly icon={<TrashIcon />} aria-label="Delete" />

// Full Width
<Button fullWidth>Full Width Button</Button>

// Custom Styling
<Button className="custom-class">Custom Button</Button>
```

**Props**:
- `variant`: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost'
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- `disabled`: boolean
- `loading`: boolean
- `active`: boolean
- `icon`: ReactNode
- `iconPosition`: 'left' | 'right'
- `iconOnly`: boolean
- `fullWidth`: boolean
- `onClick`: (event) => void
- `type`: 'button' | 'submit' | 'reset'

### Modal Components
**File**: `src/components/ui/AccessibleModal.jsx`  
**Purpose**: Overlay dialogs for focused interactions

```jsx
import AccessibleModal from '../ui/AccessibleModal';

// Basic Modal
<AccessibleModal
  isOpen={isModalOpen}
  onClose={handleClose}
  title="Modal Title"
  description="Optional description for screen readers"
>
  <p>Modal content goes here</p>
  <div className="modal-actions">
    <Button onClick={handleSave} variant="primary">Save</Button>
    <Button onClick={handleClose} variant="secondary">Cancel</Button>
  </div>
</AccessibleModal>

// Confirmation Modal
<AccessibleModal
  isOpen={isConfirmOpen}
  onClose={handleClose}
  title="Confirm Action"
  size="sm"
  preventCloseOnOverlay
>
  <p>Are you sure you want to delete this item?</p>
  <div className="modal-actions">
    <Button onClick={handleConfirm} variant="danger">Delete</Button>
    <Button onClick={handleClose} variant="outline">Cancel</Button>
  </div>
</AccessibleModal>

// Large Modal with Sections
<AccessibleModal
  isOpen={isFormOpen}
  onClose={handleClose}
  title="Create Property"
  size="lg"
  showCloseButton
>
  <div className="modal-sections">
    <section>
      <h3>Basic Information</h3>
      <PropertyForm onSubmit={handleSubmit} />
    </section>
  </div>
</AccessibleModal>
```

**Props**:
- `isOpen`: boolean (required)
- `onClose`: () => void (required)
- `title`: string (required)
- `description`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `preventCloseOnOverlay`: boolean
- `showCloseButton`: boolean
- `children`: ReactNode

### Card Component
**File**: `src/components/ui/Card.jsx`  
**Purpose**: Container for grouped content

```jsx
import Card from '../ui/Card';

// Basic Card
<Card>
  <h3>Card Title</h3>
  <p>Card content</p>
</Card>

// Card with Header and Footer
<Card
  header={
    <div className="card-header">
      <h3>Property Details</h3>
      <Button size="sm" variant="outline">Edit</Button>
    </div>
  }
  footer={
    <div className="card-footer">
      <Button>View More</Button>
    </div>
  }
>
  <PropertyDetails property={property} />
</Card>

// Clickable Card
<Card
  clickable
  onClick={() => navigate(`/property/${property.id}`)}
  className="hover:shadow-lg transition-shadow"
>
  <PropertySummary property={property} />
</Card>

// Card Variants
<Card variant="elevated">Elevated shadow</Card>
<Card variant="outlined">Border only</Card>
<Card variant="flat">No shadow or border</Card>
```

**Props**:
- `children`: ReactNode
- `header`: ReactNode
- `footer`: ReactNode
- `clickable`: boolean
- `onClick`: () => void
- `variant`: 'default' | 'elevated' | 'outlined' | 'flat'
- `className`: string

## Form Components

### Input Component
**File**: `src/components/ui/AccessibleInput.jsx`  
**Purpose**: Enhanced input field with accessibility features

```jsx
import AccessibleInput from '../ui/AccessibleInput';

// Text Input
<AccessibleInput
  label="Property Name"
  placeholder="Enter property name"
  value={propertyName}
  onChange={setPropertyName}
  required
/>

// Email Input
<AccessibleInput
  type="email"
  label="Email Address"
  value={email}
  onChange={setEmail}
  error={emailError}
  helpText="We'll never share your email"
/>

// Password Input
<AccessibleInput
  type="password"
  label="Password"
  value={password}
  onChange={setPassword}
  showPasswordToggle
  strengthIndicator
/>

// Number Input
<AccessibleInput
  type="number"
  label="Rent Amount"
  value={rent}
  onChange={setRent}
  min={0}
  step={0.01}
  prefix="$"
  suffix="/month"
/>

// Input with Icon
<AccessibleInput
  label="Search Properties"
  value={searchTerm}
  onChange={setSearchTerm}
  icon={<SearchIcon />}
  clearable
/>

// Disabled Input
<AccessibleInput
  label="Property ID"
  value={propertyId}
  disabled
  helpText="This field is auto-generated"
/>
```

**Props**:
- `type`: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
- `label`: string (required)
- `value`: string | number
- `onChange`: (value) => void
- `placeholder`: string
- `required`: boolean
- `disabled`: boolean
- `error`: string
- `helpText`: string
- `icon`: ReactNode
- `prefix`: string
- `suffix`: string
- `clearable`: boolean
- `showPasswordToggle`: boolean (password type only)
- `strengthIndicator`: boolean (password type only)

### TextArea Component
**File**: `src/components/ui/TextArea.jsx`  
**Purpose**: Multi-line text input

```jsx
import TextArea from '../ui/TextArea';

// Basic TextArea
<TextArea
  label="Description"
  placeholder="Enter description..."
  value={description}
  onChange={setDescription}
  rows={4}
/>

// TextArea with Character Count
<TextArea
  label="Maintenance Request Details"
  value={details}
  onChange={setDetails}
  maxLength={500}
  showCharacterCount
  required
/>

// Auto-resizing TextArea
<TextArea
  label="Notes"
  value={notes}
  onChange={setNotes}
  autoResize
  minRows={2}
  maxRows={10}
/>
```

### Select Component
**File**: `src/components/ui/Select.jsx`  
**Purpose**: Dropdown selection input

```jsx
import Select from '../ui/Select';

// Basic Select
<Select
  label="Property Type"
  value={propertyType}
  onChange={setPropertyType}
  options={[
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'condo', label: 'Condominium' }
  ]}
/>

// Multi-select
<Select
  label="Amenities"
  value={selectedAmenities}
  onChange={setSelectedAmenities}
  options={amenityOptions}
  multiple
  searchable
/>

// Select with Custom Option Rendering
<Select
  label="Assigned Contractor"
  value={contractorId}
  onChange={setContractorId}
  options={contractors}
  renderOption={(contractor) => (
    <div className="flex items-center">
      <img src={contractor.avatar} className="w-6 h-6 rounded-full mr-2" />
      <span>{contractor.name}</span>
      <span className="ml-auto text-sm text-gray-500">
        {contractor.rating}⭐
      </span>
    </div>
  )}
/>
```

### FileUpload Component
**File**: `src/components/ui/AnimatedDropzone.jsx`  
**Purpose**: File upload with drag-and-drop

```jsx
import AnimatedDropzone from '../ui/AnimatedDropzone';

// Basic File Upload
<AnimatedDropzone
  onFilesSelected={handleFiles}
  acceptedTypes={['.jpg', '.png', '.pdf']}
  maxFiles={5}
  maxSizeBytes={10 * 1024 * 1024} // 10MB
/>

// Image Upload with Preview
<AnimatedDropzone
  onFilesSelected={handleImages}
  acceptedTypes={['.jpg', '.png', '.gif']}
  maxFiles={1}
  showPreview
  previewSize="large"
/>

// Document Upload
<AnimatedDropzone
  onFilesSelected={handleDocuments}
  acceptedTypes={['.pdf', '.doc', '.docx']}
  multiple
  showProgress
/>
```

## Status & Display Components

### StatusPill Component
**File**: `src/components/ui/StatusPill.jsx`  
**Purpose**: Visual status indicators

```jsx
import StatusPill from '../ui/StatusPill';

// Basic Status
<StatusPill status="active" />
<StatusPill status="pending" />
<StatusPill status="completed" />
<StatusPill status="cancelled" />

// Custom Status
<StatusPill 
  status="custom"
  color="purple"
  label="Under Review"
/>

// With Icon
<StatusPill 
  status="verified"
  icon={<CheckCircleIcon />}
/>

// Different Sizes
<StatusPill status="active" size="sm" />
<StatusPill status="active" size="md" />
<StatusPill status="active" size="lg" />
```

**Specialized Status Pills**:
```jsx
// Verification Status
<VerificationStatusPill verified={true} />
<VerificationStatusPill verified={false} />

// Priority Status
<PriorityStatusPill priority="high" />
<PriorityStatusPill priority="medium" />
<PriorityStatusPill priority="low" />

// Milestone Status
<MilestoneStatusPill 
  status="completed"
  milestone="Phase 1"
/>

// Escrow Status
<EscrowStatusPill 
  status="held"
  amount={1500}
/>

// Dispute Status
<DisputeStatusPill 
  status="resolved"
  disputeType="payment"
/>
```

### EmptyState Component
**File**: `src/components/ui/EmptyState.jsx`  
**Purpose**: Placeholder for empty content areas

```jsx
import EmptyState from '../ui/EmptyState';

// Basic Empty State
<EmptyState
  title="No Properties Found"
  description="You haven't added any properties yet."
  action={
    <Button onClick={handleAddProperty}>
      Add Your First Property
    </Button>
  }
/>

// Empty State with Image
<EmptyState
  image="/images/empty-maintenance.svg"
  title="No Maintenance Requests"
  description="All caught up! No pending maintenance requests."
/>

// Error State
<EmptyState
  type="error"
  title="Unable to Load Data"
  description="There was a problem loading your properties."
  action={
    <Button onClick={handleRetry} variant="outline">
      Try Again
    </Button>
  }
/>

// Loading State
<EmptyState
  type="loading"
  title="Loading Properties..."
  description="Please wait while we fetch your data."
/>
```

### LoadingSpinner Component
**File**: `src/components/ui/LoadingSpinner.jsx`  
**Purpose**: Loading indicators

```jsx
import LoadingSpinner from '../ui/LoadingSpinner';

// Basic Spinner
<LoadingSpinner />

// Different Sizes
<LoadingSpinner size="sm" />
<LoadingSpinner size="md" />
<LoadingSpinner size="lg" />

// With Text
<LoadingSpinner size="lg" text="Loading properties..." />

// Custom Color
<LoadingSpinner color="propagentic-teal" />

// Overlay Spinner
<LoadingSpinner overlay />
```

### Skeleton Component
**File**: `src/components/ui/Skeleton.jsx`  
**Purpose**: Content placeholders during loading

```jsx
import Skeleton from '../ui/Skeleton';

// Basic Skeletons
<Skeleton width="100%" height="20px" />
<Skeleton width="200px" height="40px" />

// Skeleton Shapes
<Skeleton circle width="40px" height="40px" />
<Skeleton rounded width="100px" height="30px" />

// Skeleton Card
<div className="skeleton-card">
  <Skeleton width="100%" height="200px" />
  <div className="p-4">
    <Skeleton width="70%" height="24px" className="mb-2" />
    <Skeleton width="100%" height="16px" className="mb-1" />
    <Skeleton width="90%" height="16px" />
  </div>
</div>

// Skeleton Table
<SkeletonTable rows={5} columns={4} />

// Skeleton List
<SkeletonList items={3} />
```

## Layout Components

### Tabs Component
**File**: `src/components/ui/Tabs.jsx`  
**Purpose**: Tabbed content navigation

```jsx
import Tabs from '../ui/Tabs';

// Basic Tabs
<Tabs
  tabs={[
    { id: 'overview', label: 'Overview', content: <PropertyOverview /> },
    { id: 'tenants', label: 'Tenants', content: <TenantList /> },
    { id: 'maintenance', label: 'Maintenance', content: <MaintenanceList /> }
  ]}
  defaultTab="overview"
  onChange={handleTabChange}
/>

// Vertical Tabs
<Tabs
  tabs={tabData}
  orientation="vertical"
  className="min-h-96"
/>

// Tabs with Icons
<Tabs
  tabs={[
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: <DashboardIcon />,
      content: <Dashboard />
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: <SettingsIcon />,
      content: <Settings />
    }
  ]}
/>

// Controlled Tabs
<Tabs
  tabs={tabData}
  activeTab={activeTab}
  onChange={setActiveTab}
/>
```

### ConfirmationDialog Component
**File**: `src/components/ui/ConfirmationDialog.jsx`  
**Purpose**: User confirmation prompts

```jsx
import ConfirmationDialog from '../ui/ConfirmationDialog';

// Basic Confirmation
<ConfirmationDialog
  isOpen={showDeleteConfirm}
  title="Delete Property"
  message="Are you sure you want to delete this property? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  onConfirm={handleDelete}
  onCancel={() => setShowDeleteConfirm(false)}
  variant="danger"
/>

// Custom Confirmation
<ConfirmationDialog
  isOpen={showArchiveConfirm}
  title="Archive Tenant"
  message="This will archive the tenant and end their lease. Are you sure?"
  confirmText="Archive Tenant"
  cancelText="Keep Active"
  onConfirm={handleArchive}
  onCancel={handleCancel}
  variant="warning"
  icon={<ArchiveIcon />}
/>
```

## Business Components

### Property Components
```jsx
// Property Card
import PropertyCard from '../property/PropertyCard';

<PropertyCard
  property={propertyData}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onViewDetails={handleViewDetails}
  showActions={true}
/>

// Property List
import PropertyList from '../PropertyList';

<PropertyList
  properties={properties}
  loading={isLoading}
  onPropertySelect={handleSelect}
  onAddProperty={handleAdd}
  emptyState={<CustomEmptyState />}
/>

// Property Search
import AdvancedPropertySearch from '../search/AdvancedPropertySearch';

<AdvancedPropertySearch
  onSearch={handleSearch}
  filters={availableFilters}
  savedSearches={userSearches}
  onSaveSearch={handleSaveSearch}
/>
```

### Maintenance Components
```jsx
// Maintenance Request Card
import MaintenanceRequestCard from '../maintenance/MaintenanceRequestCard';

<MaintenanceRequestCard
  request={requestData}
  onStatusChange={handleStatusChange}
  onAssignContractor={handleAssign}
  onAddNote={handleNote}
  showContractorActions={userType === 'contractor'}
/>

// Maintenance Status Tracker
import MaintenanceStatusTracker from '../maintenance/StatusTracker';

<MaintenanceStatusTracker
  request={request}
  timeline={statusTimeline}
  currentUser={currentUser}
/>
```

### User Management Components
```jsx
// Tenant Card
import TenantCard from '../tenant/TenantCard';

<TenantCard
  tenant={tenantData}
  property={propertyData}
  onSendMessage={handleMessage}
  onViewProfile={handleProfile}
  onEndLease={handleEndLease}
/>

// Contractor Card
import ContractorCard from '../contractor/ContractorCard';

<ContractorCard
  contractor={contractorData}
  rating={contractorRating}
  onHire={handleHire}
  onViewProfile={handleProfile}
  onRemoveFromRolodex={handleRemove}
/>
```

## Component Guidelines

### Component Architecture
```javascript
// Standard component structure
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * ComponentName - Brief description
 * 
 * @param {Object} props - Component props
 * @param {string} props.requiredProp - Description of required prop
 * @param {boolean} [props.optionalProp=false] - Description of optional prop
 */
const ComponentName = ({ 
  requiredProp, 
  optionalProp = false,
  className,
  children,
  ...rest 
}) => {
  const [localState, setLocalState] = useState(null);

  useEffect(() => {
    // Side effects
  }, []);

  const handleAction = () => {
    // Event handlers
  };

  const componentClasses = classNames(
    'base-classes',
    {
      'conditional-class': optionalProp,
    },
    className
  );

  return (
    <div className={componentClasses} {...rest}>
      {children}
    </div>
  );
};

ComponentName.propTypes = {
  requiredProp: PropTypes.string.isRequired,
  optionalProp: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node
};

export default ComponentName;
```

### Styling Conventions
```css
/* Use CSS modules or utility classes */
.component-name {
  /* Base styles */
  @apply flex items-center gap-2;
  
  /* Responsive design */
  @screen md {
    @apply flex-row;
  }
  
  /* Dark mode support */
  @apply dark:bg-gray-800 dark:text-white;
}

/* State variants */
.component-name--loading {
  @apply opacity-50 pointer-events-none;
}

.component-name--error {
  @apply border-red-500 bg-red-50;
}
```

### Accessibility Patterns
```jsx
// Proper ARIA attributes
<button
  aria-label="Close modal"
  aria-expanded={isOpen}
  aria-controls="modal-content"
  onClick={handleClose}
>
  <CloseIcon aria-hidden="true" />
</button>

// Focus management
useEffect(() => {
  if (isOpen) {
    focusRef.current?.focus();
  }
}, [isOpen]);

// Keyboard navigation
const handleKeyDown = (event) => {
  switch (event.key) {
    case 'Escape':
      onClose();
      break;
    case 'Tab':
      // Handle tab navigation
      break;
  }
};
```

## Development Patterns

### Custom Hooks for Components
```javascript
// useComponentState.js
export const useModalState = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  
  return { isOpen, open, close, toggle };
};

// useFormValidation.js
export const useFormValidation = (schema) => {
  const [errors, setErrors] = useState({});
  
  const validate = useCallback((values) => {
    const result = schema.validate(values);
    setErrors(result.errors || {});
    return result.isValid;
  }, [schema]);
  
  return { errors, validate, clearErrors: () => setErrors({}) };
};
```

### Component Composition Patterns
```jsx
// Compound Components
const Modal = ({ children, ...props }) => {
  return <ModalProvider {...props}>{children}</ModalProvider>;
};

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

// Usage
<Modal isOpen={isOpen} onClose={onClose}>
  <Modal.Header>
    <h2>Modal Title</h2>
  </Modal.Header>
  <Modal.Body>
    <p>Modal content</p>
  </Modal.Body>
  <Modal.Footer>
    <Button onClick={onClose}>Close</Button>
  </Modal.Footer>
</Modal>

// Render Props Pattern
const DataFetcher = ({ url, children }) => {
  const [data, loading, error] = useFetch(url);
  
  return children({ data, loading, error });
};

// Usage
<DataFetcher url="/api/properties">
  {({ data, loading, error }) => (
    loading ? <LoadingSpinner /> :
    error ? <ErrorDisplay error={error} /> :
    <PropertyList properties={data} />
  )}
</DataFetcher>
```

### Testing Components
```javascript
// Component.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Component from './Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component prop="value" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    
    render(<Component onClick={handleClick} />);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('supports accessibility', () => {
    render(<Component />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAccessibleName('Expected Label');
    expect(button).toBeEnabled();
  });
});
```

---

**Component Library Documentation Version**: 2.0  
**Last Updated**: January 2025  
**Maintainer**: Development Team

**Related Documentation**:
- [Design System Guide](DESIGN_SYSTEM.md)
- [Component Props Reference](COMPONENT_PROPS.md)
- [Styling Guide](STYLING_GUIDE.md)
