import { useState } from 'react';
import { useModelContext } from '../contexts/ModelContext';
import { generateFollowUpQuestions } from '../services/ai/questionEngine';

// Maintenance request classification types
export type MaintenanceCategory = 
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'appliance'
  | 'structural'
  | 'other';

export interface MaintenanceClassification {
  category: MaintenanceCategory;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: string;
  suggestedAction: string;
}

// System prompt for maintenance classification
const MAINTENANCE_SYSTEM_PROMPT = `
You are an AI assistant specialized in property maintenance classification.
Your task is to analyze maintenance requests and classify them based on:
1. Category (plumbing, electrical, hvac, appliance, structural, or other)
2. Priority (low, medium, high)
3. Estimated time to address
4. Suggested first steps for the maintenance team

Provide your classification in JSON format without explanation.
`;

/**
 * Hook for using AI to classify maintenance requests
 */
export const useMaintenanceAI = () => {
  const {
    addMessage,
    setSystemMessage,
    getCompletion,
    clearContext,
    isLoading,
    error,
    messages
  } = useModelContext();
  
  const [classification, setClassification] = useState<MaintenanceClassification | null>(null);

  /** Send a message in the current conversation and get the AI response */
  const sendMessage = async (message: string): Promise<string> => {
    addMessage('user', message);
    const response = await getCompletion();
    return response.content;
  };

  /** Get follow-up question suggestions based on conversation context */
  const getFollowUpQuestions = () => generateFollowUpQuestions(messages);

  /** Reset the conversation context */
  const resetConversation = () => {
    clearContext();
    setClassification(null);
  };

  /**
   * Classifies a maintenance request using the AI
   */
  const classifyMaintenanceRequest = async (description: string): Promise<MaintenanceClassification> => {
    try {
      // Clear previous context and set system message
      clearContext();
      setSystemMessage(MAINTENANCE_SYSTEM_PROMPT);
      
      // Add the user's maintenance request description
      addMessage('user', `Maintenance request: ${description}`);
      
      // Get the AI classification
      const response = await getCompletion();
      
      // Parse the JSON response
      const result = JSON.parse(response.content) as MaintenanceClassification;
      setClassification(result);
      
      return result;
    } catch (err) {
      console.error('Error classifying maintenance request:', err);
      throw err;
    }
  };

  return {
    classifyMaintenanceRequest,
    sendMessage,
    getFollowUpQuestions,
    resetConversation,
    messages,
    classification,
    isLoading,
    error,
  };
};

export default useMaintenanceAI; 