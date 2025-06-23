import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ModelContextProtocol, { 
  ModelContextConfig, 
  ModelMessage, 
  ModelContextResponse,
  ModelMessageRole
} from '../services/modelContext';

// Define the context interface
interface ModelContextInterface {
  protocol: ModelContextProtocol;
  isLoading: boolean;
  error: Error | null;
  messages: ModelMessage[];
  addMessage: (role: ModelMessageRole, content: string, name?: string) => void;
  setSystemMessage: (content: string) => void;
  getCompletion: () => Promise<ModelContextResponse>;
  clearContext: () => void;
  configure: (config: Partial<ModelContextConfig>) => void;
}

// Create the context with a default undefined value
const ModelContext = createContext<ModelContextInterface | undefined>(undefined);

// Props for the provider component
interface ModelContextProviderProps {
  children: ReactNode;
  initialConfig?: Partial<ModelContextConfig>;
}

// Provider component
export const ModelContextProvider: React.FC<ModelContextProviderProps> = ({ 
  children, 
  initialConfig 
}) => {
  const [protocol] = useState(() => new ModelContextProtocol(initialConfig));
  const [messages, setMessages] = useState<ModelMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Keep messages state in sync with protocol
  useEffect(() => {
    setMessages(protocol.getMessages());
  }, [protocol]);

  // Add a message to the context
  const addMessage = (role: ModelMessageRole, content: string, name?: string) => {
    protocol.addMessage(role, content, name);
    setMessages(protocol.getMessages());
  };

  // Set the system message
  const setSystemMessage = (content: string) => {
    protocol.setSystemMessage(content);
    setMessages(protocol.getMessages());
  };

  // Get a completion from the model
  const getCompletion = async (): Promise<ModelContextResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await protocol.getCompletion();
      setMessages(protocol.getMessages());
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear the context
  const clearContext = () => {
    protocol.clearContext();
    setMessages(protocol.getMessages());
  };

  // Configure the model
  const configure = (config: Partial<ModelContextConfig>) => {
    protocol.configure(config);
  };

  // Context value
  const value: ModelContextInterface = {
    protocol,
    isLoading,
    error,
    messages,
    addMessage,
    setSystemMessage,
    getCompletion,
    clearContext,
    configure,
  };

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>;
};

// Custom hook to use the model context
export const useModelContext = (): ModelContextInterface => {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModelContext must be used within a ModelContextProvider');
  }
  return context;
};

export default ModelContext; 