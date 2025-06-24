import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Droplets, 
  Zap, 
  Wind, 
  Home,
  Bug,
  Shield,
  Wrench,
  Wifi,
  DoorOpen,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface CategoryStepProps {
  value?: string;
  onChange: (category: string, subcategory?: string) => void;
}

interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  subcategories?: string[];
  color: string;
}

export const CategoryStep: React.FC<CategoryStepProps> = ({ value, onChange }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(value);
  const [showSubcategories, setShowSubcategories] = useState(false);

  const categories: Category[] = [
    {
      id: 'plumbing',
      name: 'Plumbing',
      icon: Droplets,
      description: 'Leaks, clogs, water pressure issues',
      subcategories: ['Leak', 'Clog', 'No Water', 'Low Pressure', 'Other'],
      color: 'blue'
    },
    {
      id: 'electrical',
      name: 'Electrical',
      icon: Zap,
      description: 'Outlets, lights, circuit breakers',
      subcategories: ['No Power', 'Flickering Lights', 'Outlet Issues', 'Circuit Breaker', 'Other'],
      color: 'yellow'
    },
    {
      id: 'hvac',
      name: 'HVAC',
      icon: Wind,
      description: 'Heating, cooling, ventilation',
      subcategories: ['No Heat', 'No Cooling', 'Strange Noise', 'Bad Smell', 'Other'],
      color: 'cyan'
    },
    {
      id: 'appliance',
      name: 'Appliances',
      icon: Home,
      description: 'Refrigerator, stove, washer, dryer',
      subcategories: ['Refrigerator', 'Stove/Oven', 'Dishwasher', 'Washer/Dryer', 'Other'],
      color: 'purple'
    },
    {
      id: 'pest',
      name: 'Pest Control',
      icon: Bug,
      description: 'Insects, rodents, wildlife',
      subcategories: ['Insects', 'Rodents', 'Wildlife', 'Other'],
      color: 'green'
    },
    {
      id: 'security',
      name: 'Security',
      icon: Shield,
      description: 'Locks, alarms, safety concerns',
      subcategories: ['Lock Issues', 'Alarm System', 'Window/Door Security', 'Other'],
      color: 'red'
    },
    {
      id: 'general',
      name: 'General Maintenance',
      icon: Wrench,
      description: 'Repairs, painting, fixtures',
      subcategories: ['Wall/Ceiling', 'Floor', 'Paint', 'Fixtures', 'Other'],
      color: 'gray'
    },
    {
      id: 'internet',
      name: 'Internet/Cable',
      icon: Wifi,
      description: 'Connectivity, equipment issues',
      subcategories: ['No Connection', 'Slow Speed', 'Equipment Issue', 'Other'],
      color: 'indigo'
    },
    {
      id: 'access',
      name: 'Access Issues',
      icon: DoorOpen,
      description: 'Keys, doors, garage',
      subcategories: ['Lost Keys', 'Door Won\'t Open/Close', 'Garage Issues', 'Other'],
      color: 'orange'
    },
    {
      id: 'emergency',
      name: 'Emergency',
      icon: AlertTriangle,
      description: 'Urgent safety issues',
      subcategories: ['Fire/Smoke', 'Flooding', 'Gas Leak', 'Structural Damage', 'Other'],
      color: 'red'
    }
  ];

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors: Record<string, { bg: string; border: string; text: string; hover: string }> = {
      blue: {
        bg: isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800',
        border: isSelected ? 'border-blue-300 dark:border-blue-700' : 'border-gray-200 dark:border-gray-700',
        text: 'text-blue-600 dark:text-blue-400',
        hover: 'hover:border-blue-300 dark:hover:border-blue-700'
      },
      yellow: {
        bg: isSelected ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-white dark:bg-gray-800',
        border: isSelected ? 'border-yellow-300 dark:border-yellow-700' : 'border-gray-200 dark:border-gray-700',
        text: 'text-yellow-600 dark:text-yellow-400',
        hover: 'hover:border-yellow-300 dark:hover:border-yellow-700'
      },
      cyan: {
        bg: isSelected ? 'bg-cyan-50 dark:bg-cyan-900/20' : 'bg-white dark:bg-gray-800',
        border: isSelected ? 'border-cyan-300 dark:border-cyan-700' : 'border-gray-200 dark:border-gray-700',
        text: 'text-cyan-600 dark:text-cyan-400',
        hover: 'hover:border-cyan-300 dark:hover:border-cyan-700'
      },
      purple: {
        bg: isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-white dark:bg-gray-800',
        border: isSelected ? 'border-purple-300 dark:border-purple-700' : 'border-gray-200 dark:border-gray-700',
        text: 'text-purple-600 dark:text-purple-400',
        hover: 'hover:border-purple-300 dark:hover:border-purple-700'
      },
      green: {
        bg: isSelected ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-gray-800',
        border: isSelected ? 'border-green-300 dark:border-green-700' : 'border-gray-200 dark:border-gray-700',
        text: 'text-green-600 dark:text-green-400',
        hover: 'hover:border-green-300 dark:hover:border-green-700'
      },
      red: {
        bg: isSelected ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white dark:bg-gray-800',
        border: isSelected ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700',
        text: 'text-red-600 dark:text-red-400',
        hover: 'hover:border-red-300 dark:hover:border-red-700'
      },
      gray: {
        bg: isSelected ? 'bg-gray-50 dark:bg-gray-900/20' : 'bg-white dark:bg-gray-800',
        border: isSelected ? 'border-gray-300 dark:border-gray-700' : 'border-gray-200 dark:border-gray-700',
        text: 'text-gray-600 dark:text-gray-400',
        hover: 'hover:border-gray-300 dark:hover:border-gray-700'
      },
      indigo: {
        bg: isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-white dark:bg-gray-800',
        border: isSelected ? 'border-indigo-300 dark:border-indigo-700' : 'border-gray-200 dark:border-gray-700',
        text: 'text-indigo-600 dark:text-indigo-400',
        hover: 'hover:border-indigo-300 dark:hover:border-indigo-700'
      },
      orange: {
        bg: isSelected ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-white dark:bg-gray-800',
        border: isSelected ? 'border-orange-300 dark:border-orange-700' : 'border-gray-200 dark:border-gray-700',
        text: 'text-orange-600 dark:text-orange-400',
        hover: 'hover:border-orange-300 dark:hover:border-orange-700'
      }
    };

    return colors[color] || colors.gray;
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category.id);
    if (category.subcategories && category.subcategories.length > 0) {
      setShowSubcategories(true);
    } else {
      onChange(category.id);
    }
  };

  const handleSubcategorySelect = (subcategory: string) => {
    if (selectedCategory) {
      onChange(selectedCategory, subcategory);
    }
  };

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);

  return (
    <div className="space-y-6">
      {!showSubcategories ? (
        <>
          {/* Category grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((category, index) => {
              const isSelected = selectedCategory === category.id;
              const colorClasses = getColorClasses(category.color, isSelected);
              
              return (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleCategorySelect(category)}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all text-left",
                    colorClasses.bg,
                    colorClasses.border,
                    colorClasses.hover,
                    isSelected && "ring-2 ring-offset-2 ring-orange-500 dark:ring-offset-gray-900"
                  )}
                >
                  <category.icon className={cn("w-8 h-8 mb-2", colorClasses.text)} />
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {category.name}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {category.description}
                  </p>
                </motion.button>
              );
            })}
          </div>

          {/* Emergency notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-900 dark:text-red-100 mb-1">
                  For emergencies, please call 911
                </p>
                <p className="text-red-700 dark:text-red-300">
                  If this is a life-threatening emergency or poses immediate danger, contact emergency services immediately.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      ) : (
        <>
          {/* Subcategory selection */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <button
              onClick={() => setShowSubcategories(false)}
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 flex items-center gap-1"
            >
              ← Back to categories
            </button>

            {selectedCategoryData && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("p-3 rounded-lg", getColorClasses(selectedCategoryData.color, true).bg)}>
                    <selectedCategoryData.icon 
                      className={cn("w-8 h-8", getColorClasses(selectedCategoryData.color, true).text)} 
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {selectedCategoryData.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Select a specific issue type
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {selectedCategoryData.subcategories?.map((subcategory, index) => (
                    <motion.button
                      key={subcategory}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSubcategorySelect(subcategory)}
                      className="p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all"
                    >
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {subcategory}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}; 