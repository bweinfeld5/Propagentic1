import { OpenAI } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Types for the Model Context Protocol
export type ModelMessageRole = 'system' | 'user' | 'assistant' | 'function';

export interface ModelMessage {
  role: ModelMessageRole;
  content: string;
  name?: string;
}

export interface ModelContextConfig {
  model: string;
  maxTokens?: number;
  temperature?: number;
  apiKey?: string;
}

export interface ModelContextResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Default configuration
const DEFAULT_CONFIG: ModelContextConfig = {
  model: 'gpt-3.5-turbo',
  maxTokens: 500,
  temperature: 0.7,
};

/**
 * Model Context Protocol - Manages context and interactions with AI models
 */
export class ModelContextProtocol {
  private messages: ModelMessage[] = [];
  private config: ModelContextConfig;
  private openai: OpenAI | null = null;

  constructor(config: Partial<ModelContextConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeOpenAI();
  }

  /**
   * Initialize the OpenAI client with the appropriate API key
   */
  private initializeOpenAI(): void {
    // Priority: 
    // 1. Config passed to constructor
    // 2. localStorage API key
    // 3. Environment variable
    
    let apiKey: string | undefined = this.config.apiKey;
    
    // If no API key in config, try localStorage
    if (!apiKey && typeof window !== 'undefined') {
      try {
        const storedApiKey = localStorage.getItem('openai_api_key');
        if (storedApiKey) {
          apiKey = storedApiKey;
          this.config.apiKey = apiKey;
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error);
      }
    }
    
    // If still no API key, try environment variable
    if (!apiKey && process.env.REACT_APP_OPENAI_API_KEY) {
      apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      this.config.apiKey = apiKey;
    }
    
    // Initialize the client if we have an API key
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true // Allow browser usage - be careful with this in production!
      });
    }
  }

  /**
   * Adds a new message to the context
   */
  addMessage(role: ModelMessageRole, content: string, name?: string): this {
    this.messages.push({ role, content, name });
    return this;
  }

  /**
   * Clears all messages in the context
   */
  clearContext(): this {
    this.messages = [];
    return this;
  }

  /**
   * Sets the system message (instructions for the AI)
   */
  setSystemMessage(content: string): this {
    // Remove any existing system messages
    this.messages = this.messages.filter(msg => msg.role !== 'system');
    // Add the new system message at the beginning
    this.messages.unshift({ role: 'system', content });
    return this;
  }

  /**
   * Gets the current messages in the context
   */
  getMessages(): ModelMessage[] {
    return [...this.messages];
  }

  /**
   * Configures the model settings
   */
  configure(config: Partial<ModelContextConfig>): this {
    this.config = { ...this.config, ...config };
    
    // Re-initialize OpenAI if API key changes
    if (config.apiKey) {
      this.initializeOpenAI();
    }
    
    return this;
  }

  /**
   * Converts our ModelMessage format to OpenAI's ChatCompletionMessageParam format
   */
  private convertToOpenAIMessages(messages: ModelMessage[]): ChatCompletionMessageParam[] {
    return messages.map(msg => {
      if (msg.role === 'function' && !msg.name) {
        throw new Error('Function messages must include a name property');
      }
      
      // Return the appropriate structure based on the role
      return msg as ChatCompletionMessageParam;
    });
  }

  /**
   * Gets a completion from the model
   */
  async getCompletion(): Promise<ModelContextResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please provide an API key.');
    }

    try {
      const openAIMessages = this.convertToOpenAIMessages(this.messages);
      
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: openAIMessages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      const content = response.choices[0]?.message.content || '';
      
      // Add the assistant's response to the message history
      this.addMessage('assistant', content);

      return {
        content,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error('Error getting model completion:', error);
      throw error;
    }
  }
}

export default ModelContextProtocol; 