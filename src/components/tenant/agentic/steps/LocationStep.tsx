import React, { useState, useRef, useEffect } from "react";
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Home, 
  ChevronRight, 
  Search, 
  Bed,
  Utensils,
  Bath,
  Sofa,
  Car,
  TreePine,
  Building,
  MoreHorizontal,
  CheckCircle2,
  Camera
} from 'lucide-react';
import { Suggestion } from '../../../ui/agentic/SmartSuggestions';

interface LocationStepProps {
  value: string;
  onChange: (location: string) => void;
  propertyId?: string;
  suggestions?: Suggestion[];
}

export const LocationStep: React.FC<LocationStepProps> = ({
  value,
  onChange,
  propertyId,
  suggestions = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customLocation, setCustomLocation] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Room categories with icons and common subcategories
  const roomCategories = [
    {
      id: 'bedroom',
      name: 'Bedroom',
      icon: Bed,
      color: 'blue',
      subcategories: ['Master Bedroom', 'Guest Bedroom', 'Kids Bedroom', 'Bedroom 2', 'Bedroom 3']
    },
    {
      id: 'kitchen',
      name: 'Kitchen',
      icon: Utensils,
      color: 'green',
      subcategories: ['Main Kitchen', 'Kitchenette', 'Pantry', 'Kitchen Island']
    },
    {
      id: 'bathroom',
      name: 'Bathroom',
      icon: Bath,
      color: 'purple',
      subcategories: ['Master Bathroom', 'Guest Bathroom', 'Half Bath', 'Powder Room']
    },
    {
      id: 'living',
      name: 'Living Areas',
      icon: Sofa,
      color: 'orange',
      subcategories: ['Living Room', 'Family Room', 'Den', 'Study', 'Office', 'Dining Room']
    },
    {
      id: 'utility',
      name: 'Utility',
      icon: Home,
      color: 'gray',
      subcategories: ['Laundry Room', 'Basement', 'Attic', 'Storage', 'Utility Closet', 'Garage']
    },
    {
      id: 'exterior',
      name: 'Exterior',
      icon: TreePine,
      color: 'emerald',
      subcategories: ['Front Yard', 'Backyard', 'Patio', 'Balcony', 'Driveway', 'Roof']
    },
    {
      id: 'common',
      name: 'Common Areas',
      icon: Building,
      color: 'indigo',
      subcategories: ['Hallway', 'Entryway', 'Staircase', 'Closet', 'Multiple Rooms']
    }
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/10',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-600 dark:text-blue-400',
      hover: 'hover:border-blue-300 dark:hover:border-blue-600',
      selected: 'border-blue-500 bg-blue-100 dark:bg-blue-900/20'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/10',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-600 dark:text-green-400',
      hover: 'hover:border-green-300 dark:hover:border-green-600',
      selected: 'border-green-500 bg-green-100 dark:bg-green-900/20'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/10',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-600 dark:text-purple-400',
      hover: 'hover:border-purple-300 dark:hover:border-purple-600',
      selected: 'border-purple-500 bg-purple-100 dark:bg-purple-900/20'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/10',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-600 dark:text-orange-400',
      hover: 'hover:border-orange-300 dark:hover:border-orange-600',
      selected: 'border-orange-500 bg-orange-100 dark:bg-orange-900/20'
    },
    gray: {
      bg: 'bg-gray-50 dark:bg-gray-900/10',
      border: 'border-gray-200 dark:border-gray-800',
      text: 'text-gray-600 dark:text-gray-400',
      hover: 'hover:border-gray-300 dark:hover:border-gray-600',
      selected: 'border-gray-500 bg-gray-100 dark:bg-gray-900/20'
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/10',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-600 dark:text-emerald-400',
      hover: 'hover:border-emerald-300 dark:hover:border-emerald-600',
      selected: 'border-emerald-500 bg-emerald-100 dark:bg-emerald-900/20'
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/10',
      border: 'border-indigo-200 dark:border-indigo-800',
      text: 'text-indigo-600 dark:text-indigo-400',
      hover: 'hover:border-indigo-300 dark:hover:border-indigo-600',
      selected: 'border-indigo-500 bg-indigo-100 dark:bg-indigo-900/20'
    }
  };

  // Filter rooms based on search
  const filteredRooms = roomCategories.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.subcategories.some(sub => sub.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRoomSelect = (roomName: string) => {
    setSelectedRoom(roomName);
    onChange(roomName);
  };

  const handleCustomLocationSubmit = () => {
    if (customLocation.trim()) {
      onChange(customLocation.trim());
      setShowCustomInput(false);
      setCustomLocation('');
    }
  };

  // Focus custom input when shown
  useEffect(() => {
    if (showCustomInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCustomInput]);

  return (
    <div className="space-y-6">
      {/* Search input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search for a room or area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent transition-all duration-200"
          />
        </div>
        {value && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
              {value}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Room categories grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
      >
        {filteredRooms.map((room, index) => {
          const IconComponent = room.icon;
          const colors = colorClasses[room.color as keyof typeof colorClasses];
          const isSelected = value === room.name;
          
          return (
            <motion.button
              key={room.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleRoomSelect(room.name)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                isSelected 
                  ? colors.selected 
                  : `${colors.bg} ${colors.border} ${colors.hover} hover:shadow-md`
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`p-2 rounded-lg ${colors.bg} mb-2`}>
                  <IconComponent className={`w-5 h-5 ${colors.text}`} />
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  {room.name}
                </span>
                {room.subcategories.length > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {room.subcategories.length} options
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Subcategories for selected room */}
      {selectedRoom && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <ChevronRight className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Specific area in {selectedRoom}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {roomCategories
                .find(room => room.name === selectedRoom)
                ?.subcategories.map((subcategory, index) => {
                  const isSelected = value === subcategory;
                  return (
                    <button
                      key={subcategory}
                      onClick={() => onChange(subcategory)}
                      className={`p-2 rounded-lg text-left text-sm transition-all duration-200 ${
                        isSelected
                          ? 'bg-orange-100 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-600 text-orange-800 dark:text-orange-200'
                          : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-orange-200 dark:hover:border-orange-700'
                      }`}
                    >
                      {subcategory}
                    </button>
                  );
                })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick suggestions from props */}
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Quick Suggestions
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={suggestion.onClick}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-sm transition-all duration-200 text-sm"
              >
                {suggestion.text}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Custom location input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {!showCustomInput ? (
          <button
            onClick={() => setShowCustomInput(true)}
            className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-orange-300 dark:hover:border-orange-600 transition-colors duration-200 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400"
          >
            <div className="flex items-center justify-center gap-2">
              <MoreHorizontal className="w-4 h-4" />
              <span className="text-sm font-medium">
                Or specify a custom location
              </span>
            </div>
          </button>
        ) : (
          <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
                Custom Location
              </span>
            </div>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="e.g., 'Near the front door', 'Second floor hallway'..."
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomLocationSubmit();
                  } else if (e.key === 'Escape') {
                    setShowCustomInput(false);
                    setCustomLocation('');
                  }
                }}
                className="flex-1 px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent text-sm"
              />
              <button
                onClick={handleCustomLocationSubmit}
                disabled={!customLocation.trim()}
                className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Set
              </button>
              <button
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomLocation('');
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Visual hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800"
      >
        <div className="flex items-start gap-2">
          <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-medium">Pro tip:</span> Being specific about the location helps our team 
            find the issue faster and bring the right tools.
          </div>
        </div>
      </motion.div>
    </div>
  );
};
