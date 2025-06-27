import React, { useState, useEffect, useRef } from 'react';
import { useModelContext } from '../../contexts/ModelContext';
import useMaintenanceAI from '../../hooks/useMaintenanceAI';
import { 
  Wrench, 
  Zap, 
  Wind, 
  Home, 
  Shield, 
  Bug, 
  Sparkles, 
  MoreHorizontal,
  ArrowLeft,
  Send,
  User,
  Bot
} from 'lucide-react';

interface MaintenanceCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const maintenanceCategories: MaintenanceCategory[] = [
  {
    id: 'plumbing',
    name: 'Plumbing',
    description: 'Leaks, clogs, water pressure issues',
    icon: <Wrench className="w-6 h-6" />,
    color: 'bg-blue-500'
  },
  {
    id: 'electrical',
    name: 'Electrical',
    description: 'Outlets, lighting, electrical safety',
    icon: <Zap className="w-6 h-6" />,
    color: 'bg-yellow-500'
  },
  {
    id: 'hvac',
    name: 'HVAC',
    description: 'Heating, cooling, ventilation',
    icon: <Wind className="w-6 h-6" />,
    color: 'bg-teal-500'
  },
  {
    id: 'appliances',
    name: 'Appliances',
    description: 'Refrigerator, washer, dryer, dishwasher',
    icon: <Home className="w-6 h-6" />,
    color: 'bg-green-500'
  },
  {
    id: 'structural',
    name: 'Structural',
    description: 'Walls, floors, doors, windows',
    icon: <Home className="w-6 h-6" />,
    color: 'bg-purple-500'
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Locks, alarms, access control',
    icon: <Shield className="w-6 h-6" />,
    color: 'bg-red-500'
  },
  {
    id: 'pest',
    name: 'Pest Control',
    description: 'Insects, rodents, infestations',
    icon: <Bug className="w-6 h-6" />,
    color: 'bg-orange-500'
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    description: 'Deep cleaning, maintenance cleaning',
    icon: <Sparkles className="w-6 h-6" />,
    color: 'bg-pink-500'
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Something else not listed above',
    icon: <MoreHorizontal className="w-6 h-6" />,
    color: 'bg-gray-500'
  }
];

const AIMaintenanceChat: React.FC = () => {
  const { messages, isLoading } = useModelContext();
  const { sendMessage } = useMaintenanceAI();
  const [selectedCategory, setSelectedCategory] = useState<MaintenanceCategory | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [input, setInput] = useState('');
  const [currentStep, setCurrentStep] = useState<'category' | 'chat'>('category');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleCategorySelect = (category: MaintenanceCategory) => {
    setSelectedCategory(category);
    setCurrentStep('chat');
    
    // Initialize chat with AI greeting
    const initialMessage = {
      role: 'assistant' as const,
      content: `Hi! I'm your Propagentic maintenance assistant. To help you get the right contractor quickly, let's start by selecting the category that best describes your maintenance issue.`
    };
    
    const categoryMessage = {
      role: 'assistant' as const,
      content: `Great! You selected ${category.name} - ${category.description}. Now, please describe your specific issue in detail, and I'll help connect you with the right contractor.`
    };
    
    setChatMessages([initialMessage, categoryMessage]);
  };

  const handleBackToCategories = () => {
    setCurrentStep('category');
    setSelectedCategory(null);
    setChatMessages([]);
    setInput('');
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input.trim() };
    setChatMessages(prev => [...prev, userMessage]);

    try {
      // Here you would integrate with your AI service
      // For now, providing intelligent responses based on category
      const response = await generateAIResponse(input, selectedCategory);
      const aiMessage = { role: 'assistant' as const, content: response };
      setChatMessages(prev => [...prev, aiMessage]);
      setInput('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const generateAIResponse = async (userInput: string, category: MaintenanceCategory | null): Promise<string> => {
    // This is a simplified AI response. In production, you'd use your actual AI service
    const responses = {
      plumbing: "I understand you're having plumbing issues. Based on your description, I recommend documenting the problem with photos if possible. Is this an emergency (like a major leak) or can it wait for regular business hours?",
      electrical: "Electrical issues can be serious. For safety, please don't attempt any repairs yourself. Can you tell me if this affects your main power or just specific outlets/fixtures?",
      hvac: "HVAC problems can affect your comfort significantly. Is this issue affecting heating, cooling, or both? Also, when did you first notice the problem?",
      structural: "Structural issues should be addressed promptly. Can you describe the extent of the damage and whether it seems to be getting worse?",
      security: "Security concerns are important for your safety. Is this preventing you from properly securing your home?",
      other: "I'd be happy to help with your maintenance issue. Can you provide more specific details about what's happening?"
    };

    return responses[category?.id as keyof typeof responses] || "Thank you for the information. I'm processing your request and will connect you with an appropriate contractor. Is there anything else you'd like to add about this issue?";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (currentStep === 'category') {
    return (
      <div className="bg-slate-700 min-h-[500px] p-4 rounded-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white mb-2">
            What type of maintenance do you need?
          </h2>
          <p className="text-slate-300 text-sm">
            Select the category that best describes your issue
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {maintenanceCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category)}
              className="bg-slate-600 hover:bg-slate-500 transition-colors duration-200 rounded-lg p-4 text-left group"
            >
              <div className={`${category.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-white group-hover:scale-110 transition-transform duration-200`}>
                {category.icon}
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                {category.name}
              </h3>
              <p className="text-slate-300 text-xs">
                {category.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-700 min-h-[500px] p-4 rounded-lg flex flex-col">
      {/* Header with back button and selected category */}
      <div className="flex items-center mb-4">
        <button
          onClick={handleBackToCategories}
          className="flex items-center text-slate-300 hover:text-white transition-colors mr-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Categories
        </button>
        
        {selectedCategory && (
          <div className="flex items-center">
            <div className={`${selectedCategory.color} w-6 h-6 rounded-lg flex items-center justify-center text-white mr-2`}>
              {selectedCategory.icon}
            </div>
            <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              {selectedCategory.name}
            </span>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto mb-3 space-y-3 min-h-[300px]">
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'bg-slate-600 ml-2' : 'bg-orange-500 mr-2'
              }`}>
                {msg.role === 'user' ? (
                  <User className="w-3 h-3 text-white" />
                ) : (
                  <Bot className="w-3 h-3 text-white" />
                )}
              </div>
              <div
                className={`px-3 py-2 rounded-lg text-sm ${
                  msg.role === 'user' 
                    ? 'bg-slate-600 text-white' 
                    : 'bg-slate-600 text-slate-100 border border-slate-500'
                }`}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-600 text-slate-300 px-3 py-2 rounded-lg text-sm">
              AI is typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-slate-600 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            className="flex-1 bg-slate-700 text-white placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your maintenance issue in detail..."
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!input.trim() || isLoading}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-slate-400 text-xs mt-2 text-center">
          Powered by AI • Your request will be automatically routed to the right contractor
        </p>
      </div>
    </div>
  );
};

export default AIMaintenanceChat;
