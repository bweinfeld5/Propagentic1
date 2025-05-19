import React from 'react';
import { Building, Wrench } from 'lucide-react';
import Button from './ui/Button';

interface Property {
  id: string;
  name: string;
  address: string;
  photoUrl?: string;
  unit?: string;
}

interface PropertyListProps {
  properties: Property[];
  onRequestMaintenance: (propertyId: string) => void;
}

const PropertyList: React.FC<PropertyListProps> = ({ 
  properties, 
  onRequestMaintenance 
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold font-display text-gray-900">My Properties</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <div 
            key={property.id} 
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="h-40 bg-gray-200 relative">
              {property.photoUrl ? (
                <img 
                  src={property.photoUrl} 
                  alt={property.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-pa-blue-600/10">
                  <Building className="h-12 w-12 text-pa-blue-600/60" />
                </div>
              )}
            </div>
            
            <div className="p-5">
              <h3 className="font-semibold text-lg font-display text-gray-900">{property.name}</h3>
              
              <p className="text-gray-600 mt-1 text-sm">{property.address}</p>
              
              {property.unit && (
                <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pa-blue-50 text-pa-blue-600">
                  Unit {property.unit}
                </div>
              )}
              
              <div className="mt-5">
                <Button 
                  onClick={() => onRequestMaintenance(property.id)}
                  className="w-full bg-pa-orange-500 hover:bg-pa-orange-600 focus:ring-2 focus:ring-pa-orange-500 focus:ring-offset-2"
                >
                  <Wrench className="mr-2 h-4 w-4" />
                  Request Maintenance
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyList; 