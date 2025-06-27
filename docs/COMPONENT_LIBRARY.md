# Component Library Documentation

## PropAgentic Design System

### Core Components

#### Button
```jsx
<Button variant='primary' size='lg' onClick={handleClick}>
  Click Me
</Button>
```

#### Modal
```jsx
<Modal isOpen={true} onClose={handleClose} title='Modal Title'>
  Modal content here
</Modal>
```

#### StatusPill
```jsx
<StatusPill status='active' />
<StatusPill status='pending' />
<StatusPill status='completed' />
```

### Property Components

#### PropertyCard
```jsx
<PropertyCard 
  property={propertyData}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

#### AdvancedPropertySearch
```jsx
<AdvancedPropertySearch 
  onSearch={handleSearch}
  filters={filterOptions}
/>
```

### Maintenance Components

#### MaintenanceRequestCard
```jsx
<MaintenanceRequestCard 
  request={requestData}
  onStatusChange={handleStatusChange}
/>
```

---
*Component Library v1.0*
