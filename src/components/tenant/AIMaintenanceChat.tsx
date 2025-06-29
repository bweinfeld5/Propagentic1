import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Wrench, Zap, Wind, Home, Shield, Bug, Sparkles, MoreHorizontal, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

// Mock message type
interface MockMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Maintenance categories with icons and descriptions
const MAINTENANCE_CATEGORIES = [
  {
    id: 'plumbing',
    name: 'Plumbing',
    description: 'Leaks, clogs, water pressure issues',
    icon: <Wrench className="w-6 h-6" />,
    iconBg: 'bg-blue-600'
  },
  {
    id: 'electrical',
    name: 'Electrical', 
    description: 'Outlets, lighting, electrical safety',
    icon: <Zap className="w-6 h-6" />,
    iconBg: 'bg-yellow-600'
  },
  {
    id: 'hvac',
    name: 'HVAC',
    description: 'Heating, cooling, ventilation',
    icon: <Wind className="w-6 h-6" />,
    iconBg: 'bg-cyan-600'
  },
  {
    id: 'appliances',
    name: 'Appliances',
    description: 'Refrigerator, washer, dryer, dishwasher',
    icon: <Home className="w-6 h-6" />,
    iconBg: 'bg-green-600'
  },
  {
    id: 'structural',
    name: 'Structural',
    description: 'Walls, floors, doors, windows',
    icon: <Home className="w-6 h-6" />,
    iconBg: 'bg-purple-600'
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Locks, alarms, access control',
    icon: <Shield className="w-6 h-6" />,
    iconBg: 'bg-red-600'
  },
  {
    id: 'pest-control',
    name: 'Pest Control',
    description: 'Insects, rodents, infestations',
    icon: <Bug className="w-6 h-6" />,
    iconBg: 'bg-orange-600'
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    description: 'Deep cleaning, maintenance cleaning',
    icon: <Sparkles className="w-6 h-6" />,
    iconBg: 'bg-pink-600'
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Something else not listed above',
    icon: <MoreHorizontal className="w-6 h-6" />,
    iconBg: 'bg-gray-600'
  }
];

// Mock AI responses for demonstration
const MOCK_AI_RESPONSES = [
  "Thank you for providing that information. Can you tell me more about when this issue started?",
  "I understand the problem. To help route this to the right contractor, can you describe the specific symptoms you're experiencing?",
  "That's helpful information. Is this affecting your daily activities? How urgent would you say this issue is?",
  "Perfect! I have enough information to create your maintenance request. A qualified contractor will be notified and should contact you within 24 hours.",
  "Based on your description, this sounds like it may require immediate attention. I'm prioritizing this request for you."
];

const AIMaintenanceChat: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [input, setInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'category' | 'chat'>('category');
  const [messages, setMessages] = useState<MockMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [maintenanceRequestId, setMaintenanceRequestId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to check for existing recent maintenance requests (idempotency)
  const findRecentMaintenanceRequest = async (tenantId: string, withinMinutes: number = 5): Promise<string | null> => {
    try {
      const cutoffTime = new Date(Date.now() - withinMinutes * 60 * 1000);
      
      const requestsRef = collection(db, 'maintenanceRequests');
      const q = query(
        requestsRef,
        where('tenantId', '==', tenantId),
        where('timestamp', '>=', cutoffTime),
        where('createdVia', '==', 'ai_chat')
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        // Return the most recent one
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          timestamp: doc.data().timestamp
        }));
        
        requests.sort((a, b) => {
          const aTime = a.timestamp?.toDate?.() || new Date(0);
          const bTime = b.timestamp?.toDate?.() || new Date(0);
          return bTime.getTime() - aTime.getTime();
        });
        
        return requests[0].id;
      }
      
      return null;
    } catch (error) {
      console.error('❌ [AIChat] Error finding recent request:', error);
      return null;
    }
  };

  // Function to get tenant's properties
  const getTenantProperties = async (tenantId: string): Promise<any[]> => {
    const properties: any[] = [];
    
    try {
      // Check new tenantProfiles structure first
      const tenantProfileRef = doc(db, 'tenantProfiles', tenantId);
      const tenantProfileSnap = await getDoc(tenantProfileRef);
      
      if (tenantProfileSnap.exists()) {
        const tenantProfile = tenantProfileSnap.data();
        const propertyIds = tenantProfile.properties || [];
        
        console.log('🔍 [AIChat] Found property IDs in tenant profile:', propertyIds);
        
        // Fetch each property
        for (const propertyId of propertyIds) {
          try {
            const propertyRef = doc(db, 'properties', propertyId);
            const propertySnap = await getDoc(propertyRef);
            
            if (propertySnap.exists()) {
              properties.push({
                id: propertySnap.id,
                ...propertySnap.data()
              });
            }
          } catch (error) {
            console.warn('⚠️ [AIChat] Failed to fetch property:', propertyId, error);
          }
        }
      } else {
        // Fallback to legacy user profile structure
        console.log('🔍 [AIChat] No tenant profile found, checking legacy structure');
        const userRef = doc(db, 'users', tenantId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.propertyId) {
            try {
              const propertyRef = doc(db, 'properties', userData.propertyId);
              const propertySnap = await getDoc(propertyRef);
              
              if (propertySnap.exists()) {
                properties.push({
                  id: propertySnap.id,
                  ...propertySnap.data()
                });
              }
            } catch (error) {
              console.warn('⚠️ [AIChat] Failed to fetch legacy property:', userData.propertyId, error);
            }
          }
        }
      }
      
      return properties;
    } catch (error) {
      console.error('❌ [AIChat] Error getting tenant properties:', error);
      return [];
    }
  };

  // Function to create maintenance request when tenant starts AI chat
  const createMaintenanceRequest = async (category: any): Promise<string | null> => {
    if (!currentUser) {
      console.error('❌ [AIChat] No authenticated user');
      return null;
    }

    try {
      console.log('🔍 [AIChat] Creating maintenance request for category:', category.name);
      
      // Check for existing recent request to ensure idempotency
      const recentRequestId = await findRecentMaintenanceRequest(currentUser.uid, 5);
      if (recentRequestId) {
        console.log('✅ [AIChat] Found recent request within 5 minutes:', recentRequestId);
        return recentRequestId;
      }

      // Get tenant information
      const tenantName = userProfile?.displayName || userProfile?.firstName || userProfile?.name || currentUser.displayName || 'Unknown Tenant';
      const tenantEmail = userProfile?.email || currentUser.email || '';

      // Get tenant's properties
      const properties = await getTenantProperties(currentUser.uid);
      if (properties.length === 0) {
        console.warn('⚠️ [AIChat] No properties found for tenant:', currentUser.uid);
        // Still create the request, but it won't be associated with a property
      }

      // Create the maintenance request
      const requestRef = doc(collection(db, 'maintenanceRequests'));
      const requestId = requestRef.id;

      const chatSessionId = `ai-chat-${currentUser.uid}-${Date.now()}`;

      const requestData = {
        tenantId: currentUser.uid,
        tenantName,
        tenantEmail,
        chatSessionId,
        propertyId: properties[0]?.id || null,
        landlordId: properties[0]?.landlordId || null,
        timestamp: serverTimestamp(),
        status: 'pending',
        issueType: category.id,
        category: category.name,
        description: `AI Chat initiated for ${category.name}: ${category.description}`,
        images: [],
        createdVia: 'ai_chat',
        aiChatCategory: category.id,
        aiChatCategoryName: category.name
      };

      await setDoc(requestRef, requestData);
      console.log('✅ [AIChat] Maintenance request created:', requestId);

      // Associate with properties
      if (properties.length > 0) {
        for (const property of properties) {
          try {
            const propertyRef = doc(db, 'properties', property.id);
            await updateDoc(propertyRef, {
              maintenanceRequests: arrayUnion(requestId),
              updatedAt: serverTimestamp()
            });
            
            console.log('✅ [AIChat] Request linked to property:', property.id);
          } catch (error) {
            console.warn('⚠️ [AIChat] Failed to link request to property:', property.id, error);
            // Continue with other properties even if one fails
          }
        }
      }

      return requestId;

    } catch (error) {
      console.error('❌ [AIChat] Error creating maintenance request:', error);
      // Gracefully handle errors - don't prevent chat from continuing
      return null;
    }
  };

  const handleCategorySelect = async (categoryId: string) => {
    const category = MAINTENANCE_CATEGORIES.find(cat => cat.id === categoryId);
    if (!category) return;

    if (!currentUser) {
      toast.error('Please log in to submit a maintenance request');
      return;
    }

      setSelectedCategory(categoryId);
      setCurrentStep('chat');
    
    // **NEW: Create maintenance request when tenant selects category**
    try {
      console.log('🔍 [AIChat] Creating maintenance request for selected category...');
      const requestId = await createMaintenanceRequest(category);
      
      if (requestId) {
        setMaintenanceRequestId(requestId);
        console.log('✅ [AIChat] Maintenance request created:', requestId);
        toast.success(`Maintenance request created for ${category.name}`);
      } else {
        console.log('⚠️ [AIChat] No new request created (may have existing recent request)');
        toast('Continuing with existing maintenance request', { icon: '🔄' });
      }
    } catch (error) {
      console.error('❌ [AIChat] Failed to create maintenance request:', error);
      toast.error('Failed to create maintenance request, but you can continue chatting');
      // Continue with chat even if maintenance request creation fails
    }
      
      // Add initial user message about the selected category
      const userMessage: MockMessage = {
        role: 'user',
        content: `I need help with: ${category.name} - ${category.description}`,
        timestamp: new Date()
      };
      
      setMessages([userMessage]);
      
      // Mock AI response after a short delay
      setTimeout(() => {
        const aiMessage: MockMessage = {
          role: 'assistant',
          content: `I can help you with ${category.name.toLowerCase()} issues. Please describe the specific problem you're experiencing in detail.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      }, 1000);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: MockMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Mock AI response after delay
    setTimeout(() => {
      const randomResponse = MOCK_AI_RESPONSES[Math.floor(Math.random() * MOCK_AI_RESPONSES.length)];
      const aiMessage: MockMessage = {
        role: 'assistant',
        content: randomResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBackToCategories = () => {
    setCurrentStep('category');
    setSelectedCategory(null);
    setMessages([]);
  };

  const handleBackToDashboard = () => {
    navigate('/tenant/dashboard');
  };

  const selectedCategoryData = MAINTENANCE_CATEGORIES.find(cat => cat.id === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-800 border-b border-slate-600">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">PropAgentic</h1>
              <p className="text-slate-300 text-sm">AI-Powered Property Maintenance</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {currentStep === 'chat' && (
              <button
                onClick={handleBackToCategories}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Categories
              </button>
            )}
            
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Category Selection */}
      {currentStep === 'category' && (
        <div className="max-w-4xl mx-auto px-6 py-12 pt-32">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              What type of maintenance do you need?
            </h2>
            <p className="text-slate-300 text-lg">
              Select the category that best describes your issue
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MAINTENANCE_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className="bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 hover:border-slate-500 rounded-xl p-6 text-left transition-all duration-200 hover:scale-105 hover:shadow-xl"
              >
                <div className={`${category.iconBg} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  {category.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {category.name}
                </h3>
                <p className="text-slate-300 text-sm">
                  {category.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Interface */}
      {currentStep === 'chat' && selectedCategoryData && (
        <div className="max-w-4xl mx-auto px-6 py-8 pt-24 flex flex-col h-[calc(100vh-96px)]">
          {/* Selected Category Badge */}
          <div className="flex justify-center mb-6">
            <div className="bg-orange-600 text-white px-4 py-2 rounded-full flex items-center gap-2">
              {selectedCategoryData.icon}
              {selectedCategoryData.name}
              {maintenanceRequestId && (
                <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Request Created
                </span>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto mb-6 space-y-4">
            {/* Initial AI Message */}
            <div className="flex justify-start">
              <div className="bg-slate-700/50 rounded-2xl rounded-bl-sm px-6 py-4 max-w-[80%]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-300">AI Assistant</span>
                </div>
                <p className="text-white">
                  Hi! I'm your PropAgentic maintenance assistant. To help you get the right contractor quickly, let's start by selecting the category that best describes your maintenance issue.
                </p>
              </div>
            </div>

            {/* Messages */}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-6 py-4 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-orange-600 text-white rounded-br-sm'
                      : 'bg-slate-700/50 text-white rounded-bl-sm'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                        <Wrench className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-slate-300">AI Assistant</span>
                    </div>
                  )}
                  {msg.role === 'user' && (
                    <div className="flex items-center gap-2 mb-2 justify-end">
                      <span className="text-sm font-medium text-orange-100">You</span>
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-700/50 rounded-2xl rounded-bl-sm px-6 py-4 max-w-[80%]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                      <Wrench className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-300">AI Assistant</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600">
            <div className="flex gap-4 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your maintenance issue in detail..."
                className="flex-1 bg-transparent text-white placeholder-slate-400 resize-none focus:outline-none min-h-[60px] max-h-32"
                disabled={isLoading}
                rows={2}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center mt-3 text-sm text-slate-400">
              Demo Mode • Responses are simulated for demonstration purposes
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIMaintenanceChat;
