import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDownIcon, BuildingOfficeIcon, CheckIcon } from '@heroicons/react/24/outline';
import { placesService, BusinessInfo } from '../../services/placesService';

interface BusinessAutocompleteProps {
  value: string;
  onChange: (value: string, businessInfo?: BusinessInfo) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
}

const BusinessAutocomplete: React.FC<BusinessAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Search Baltimore businesses...",
  className = "",
  disabled = false,
  error,
  label,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [businesses, setBusinesses] = useState<BusinessInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessInfo | null>(null);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Generate session token for cost optimization
  useEffect(() => {
    setSessionToken(placesService.generateSessionToken());
  }, []);

  // Debounced search function
  const searchBusinesses = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setBusinesses([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await placesService.searchBusinesses(query, sessionToken);
      // Filter to only Baltimore area businesses
      const baltimoreBusinesses = results.filter(business => 
        placesService.isInBaltimoreArea(business)
      );
      setBusinesses(baltimoreBusinesses);
      setIsOpen(baltimoreBusinesses.length > 0);
      setHighlightedIndex(-1);
    } catch (error) {
      console.error('Error searching businesses:', error);
      setBusinesses([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken]);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedBusiness(null);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      searchBusinesses(newValue);
    }, 300);
  };

  // Handle business selection
  const handleBusinessSelect = async (business: BusinessInfo) => {
    try {
      // Get detailed business information
      const detailedBusiness = await placesService.getPlaceDetails(business.placeId, sessionToken);
      setSelectedBusiness(detailedBusiness);
      onChange(detailedBusiness.name, detailedBusiness);
      setIsOpen(false);
      setBusinesses([]);
      
      // Generate new session token for next search
      setSessionToken(placesService.generateSessionToken());
    } catch (error) {
      console.error('Error getting business details:', error);
      // Fallback to basic info
      setSelectedBusiness(business);
      onChange(business.name, business);
      setIsOpen(false);
      setBusinesses([]);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || businesses.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < businesses.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : businesses.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < businesses.length) {
          handleBusinessSelect(businesses[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Focus management for highlighted items
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label htmlFor="business-autocomplete" className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          id="business-autocomplete"
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (businesses.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10 ${
            error ? 'border-red-300 bg-red-50' : ''
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          autoComplete="off"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-describedby={error ? 'business-error' : undefined}
        />
        
        {/* Icon indicators */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          ) : selectedBusiness?.isVerified ? (
            <CheckIcon className="h-4 w-4 text-green-500" title="Verified Business" />
          ) : (
            <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p id="business-error" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {businesses.length > 0 ? (
            businesses.map((business, index) => (
              <div
                key={business.placeId}
                onClick={() => handleBusinessSelect(business)}
                className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                  index === highlightedIndex 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'hover:bg-gray-50'
                }`}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                <div className="flex items-start space-x-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {business.name}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {business.address}
                    </div>
                    {business.types.length > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        {business.types.slice(0, 2).join(', ')}
                      </div>
                    )}
                  </div>
                  {business.isVerified && (
                    <CheckIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-center text-gray-500">
              <BuildingOfficeIcon className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <p>No Baltimore businesses found</p>
              <p className="text-xs mt-1">You can still enter your business name manually</p>
            </div>
          )}
        </div>
      )}

      {/* Manual entry hint */}
      {!selectedBusiness && value && !isLoading && businesses.length === 0 && value.length >= 2 && (
        <div className="mt-2 text-xs text-gray-500">
          💡 Can't find your business? Just type the name manually - we'll verify it later.
        </div>
      )}
    </div>
  );
};

export default BusinessAutocomplete; 