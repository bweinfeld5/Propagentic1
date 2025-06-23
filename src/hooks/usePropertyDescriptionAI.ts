import { useState } from 'react';
import { useModelContext } from '../contexts/ModelContext';

export interface PropertyDetails {
  type: string; // e.g., apartment, house, condo
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  amenities: string[];
  location: string;
  specialFeatures?: string;
}

export interface GeneratedDescription {
  marketingDescription: string;
  shortDescription: string;
  bulletPoints: string[];
  suggestedTitle: string;
}

// System prompt for property description generation
const PROPERTY_DESCRIPTION_PROMPT = `
You are an expert real estate copywriter specializing in creating compelling property descriptions.
Your task is to create engaging descriptions based on the property details provided.

For each property, create:
1. A marketing description (200-300 words) highlighting the property's best features
2. A short description (50 words max) for listings
3. 5 bullet points highlighting key selling points
4. A suggested property title/headline

Format your response as a JSON object with keys: marketingDescription, shortDescription, bulletPoints (array), and suggestedTitle.
Focus on being accurate, professional, and appealing to potential renters.
`;

/**
 * Hook for generating property descriptions using AI
 */
export const usePropertyDescriptionAI = () => {
  const {
    addMessage,
    setSystemMessage,
    getCompletion,
    clearContext,
    isLoading,
    error
  } = useModelContext();
  
  const [description, setDescription] = useState<GeneratedDescription | null>(null);

  /**
   * Generates a property description based on details
   */
  const generatePropertyDescription = async (
    details: PropertyDetails
  ): Promise<GeneratedDescription> => {
    try {
      // Clear previous context and set system message
      clearContext();
      setSystemMessage(PROPERTY_DESCRIPTION_PROMPT);
      
      // Format the property details
      const propertyDetailsString = `
Property Type: ${details.type}
Bedrooms: ${details.bedrooms}
Bathrooms: ${details.bathrooms}
Square Feet: ${details.squareFeet}
Location: ${details.location}
Amenities: ${details.amenities.join(', ')}
${details.specialFeatures ? `Special Features: ${details.specialFeatures}` : ''}
`;
      
      // Add the property details to the context
      addMessage('user', `Please create a description for this property: ${propertyDetailsString}`);
      
      // Get the AI-generated description
      const response = await getCompletion();
      
      // Parse the JSON response
      const result = JSON.parse(response.content) as GeneratedDescription;
      setDescription(result);
      
      return result;
    } catch (err) {
      console.error('Error generating property description:', err);
      throw err;
    }
  };

  return {
    generatePropertyDescription,
    description,
    isLoading,
    error,
  };
};

export default usePropertyDescriptionAI; 