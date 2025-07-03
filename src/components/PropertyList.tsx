import React, { useState } from 'react';
import { Building, Wrench, LogOut } from 'lucide-react';
import Button from './ui/Button';
import LeavePropertyModal from './tenant/LeavePropertyModal';

interface Property {
  id: string;
  name: string;
  address: string;
  photoUrl?: string;
  unit?: string;
  landlordName?: string;
}

interface PropertyListProps {
  properties: Property[];
  onRequestMaintenance: (propertyId: string) => void;
  onLeaveProperty?: () => void;
}

const PropertyList: React.FC<PropertyListProps> = ({ 
  properties, 
  onRequestMaintenance,
  onLeaveProperty
}) => {
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Debug log to verify component is loading with leave property functionality
  console.log('🏠 PropertyList component loaded with Leave Property functionality', {
    propertiesCount: properties.length,
    hasLeaveCallback: !!onLeaveProperty
  });

  const handleLeavePropertyClick = (property: Property) => {
    console.log('🚪 Leave Property clicked for:', property.name);
    setSelectedProperty(property);
    setLeaveModalOpen(true);
  };

  const handleLeaveSuccess = () => {
    console.log('✅ Leave Property successful');
    setLeaveModalOpen(false);
    setSelectedProperty(null);
    if (onLeaveProperty) {
      onLeaveProperty();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold font-display text-gray-900 dark:text-white">My Properties</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <div 
            key={property.id} 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="h-40 bg-gray-200 dark:bg-gray-700 relative">
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
              <h3 className="font-semibold text-lg font-display text-gray-900 dark:text-white">{property.name}</h3>
              
              <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">{property.address}</p>
              
              {property.unit && (
                <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pa-blue-50 dark:bg-pa-blue-900/30 text-pa-blue-600 dark:text-pa-blue-400">
                  Unit {property.unit}
                </div>
              )}

              {property.landlordName && (
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-xs">
                  Landlord: {property.landlordName}
                </p>
              )}
              
              <div className="mt-5 space-y-2">
                <Button 
                  onClick={() => onRequestMaintenance(property.id)}
                  className="w-full bg-pa-orange-500 hover:bg-pa-orange-600 focus:ring-2 focus:ring-pa-orange-500 focus:ring-offset-2"
                >
                  <Wrench className="mr-2 h-4 w-4" />
                  Request Maintenance
                </Button>
                
                <Button 
                  onClick={() => handleLeavePropertyClick(property)}
                  variant="outline"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 
                           dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:border-red-500
                           focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave Property
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Leave Property Modal */}
      <LeavePropertyModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        property={selectedProperty}
        onSuccess={handleLeaveSuccess}
      />
    </div>
  );
};

export default PropertyList; 