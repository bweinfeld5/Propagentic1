import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Button from '../ui/Button';
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';

interface Property {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    unit?: string;
  };
  type: string;
  landlordName: string;
}

interface PropertySelectorProps {
  onPropertySelected: (property: Property) => void;
  className?: string;
}

const PropertySelector: React.FC<PropertySelectorProps> = ({
  onPropertySelected,
  className = ''
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        // Get all demo properties for easy onboarding
        const propertiesRef = collection(db, 'properties');
        const q = query(propertiesRef, where('isDemo', '==', true));
        const snapshot = await getDocs(q);
        
        const propertiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Property[];
        
        setProperties(propertiesData);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
  };

  const handleConfirm = () => {
    if (selectedProperty) {
      onPropertySelected(selectedProperty);
    }
  };

  if (loading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading properties...</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="text-center">
          <BuildingOffice2Icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select Your Property</h3>
          <p className="text-sm text-gray-600">Choose the property you'll be living in</p>
        </div>

        <div className="space-y-3">
          {properties.map((property) => (
            <div
              key={property.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedProperty?.id === property.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handlePropertySelect(property)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{property.name}</h4>
                  <p className="text-sm text-gray-600">
                    {property.address.street}, {property.address.city}, {property.address.state}
                    {property.address.unit && ` - Unit ${property.address.unit}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {property.type} • Managed by {property.landlordName}
                  </p>
                </div>
                <div className="ml-4">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      selectedProperty?.id === property.id
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedProperty && (
          <div className="mt-6">
            <Button
              variant="primary"
              onClick={handleConfirm}
              className="w-full"
            >
              Join {selectedProperty.name}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertySelector; 