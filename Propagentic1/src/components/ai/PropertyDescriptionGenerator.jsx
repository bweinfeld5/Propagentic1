import React, { useState } from 'react';
import { usePropertyDescriptionAI } from '../../hooks/usePropertyDescriptionAI';

const PropertyDescriptionGenerator = () => {
  const { generatePropertyDescription, description, isLoading, error } = usePropertyDescriptionAI();

  // Form state
  const [propertyDetails, setPropertyDetails] = useState({
    type: 'apartment',
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 1000,
    amenities: '',
    location: '',
    specialFeatures: '',
  });

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPropertyDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Format amenities as an array
      const amenitiesArray = propertyDetails.amenities
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== '');

      // Call the AI to generate a description
      await generatePropertyDescription({
        ...propertyDetails,
        bedrooms: Number(propertyDetails.bedrooms),
        bathrooms: Number(propertyDetails.bathrooms),
        squareFeet: Number(propertyDetails.squareFeet),
        amenities: amenitiesArray,
      });
    } catch (err) {
      console.error('Error generating description:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-propagentic-teal">AI Property Description Generator</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Property Details Form */}
        <div>
          <h3 className="text-lg font-medium mb-4">Property Details</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
              <select
                name="type"
                value={propertyDetails.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-propagentic-teal"
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="studio">Studio</option>
              </select>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                <input
                  type="number"
                  name="bedrooms"
                  min="0"
                  value={propertyDetails.bedrooms}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-propagentic-teal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                <input
                  type="number"
                  name="bathrooms"
                  min="0"
                  step="0.5"
                  value={propertyDetails.bathrooms}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-propagentic-teal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sq. Feet</label>
                <input
                  type="number"
                  name="squareFeet"
                  min="0"
                  value={propertyDetails.squareFeet}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-propagentic-teal"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                placeholder="e.g., Downtown Seattle, WA"
                value={propertyDetails.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-propagentic-teal"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
              <textarea
                name="amenities"
                placeholder="e.g., washer/dryer, parking, gym (comma separated)"
                value={propertyDetails.amenities}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-propagentic-teal"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Features</label>
              <textarea
                name="specialFeatures"
                placeholder="e.g., recently renovated, great view, etc."
                value={propertyDetails.specialFeatures}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-propagentic-teal"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !propertyDetails.location}
              className={`px-4 py-2 bg-propagentic-teal text-white rounded-full hover:bg-teal-600 transition w-full ${
                isLoading || !propertyDetails.location ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Generating...' : 'Generate Description'}
            </button>
          </form>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 rounded text-red-700">
              Error: {error.message}
            </div>
          )}
        </div>
        
        {/* Generated Description */}
        <div className={`p-5 border rounded-lg ${description ? 'bg-gray-50' : 'bg-white'}`}>
          {!description && !isLoading && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Enter property details and click "Generate Description" to create AI-powered listings</p>
            </div>
          )}
          
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-600">Generating property description...</p>
            </div>
          )}
          
          {description && !isLoading && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-propagentic-teal">{description.suggestedTitle}</h3>
                <p className="text-sm text-gray-600 mt-1">{description.shortDescription}</p>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-gray-700">Key Features:</h4>
                <ul className="list-disc pl-5 mt-2">
                  {description.bulletPoints.map((point, index) => (
                    <li key={index} className="text-sm">{point}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-gray-700">Full Description:</h4>
                <p className="text-sm whitespace-pre-line mt-2">{description.marketingDescription}</p>
              </div>
              
              <div className="pt-4 mt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    const text = `${description.suggestedTitle}\n\n${description.marketingDescription}`;
                    navigator.clipboard.writeText(text);
                  }}
                  className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md"
                >
                  Copy to Clipboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDescriptionGenerator; 