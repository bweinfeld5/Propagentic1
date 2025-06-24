import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Brain,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Eye,
  MessageSquare,
  Image,
  MapPin,
  User,
  Calendar,
  TrendingUp,
  Filter,
  Search,
  MoreHorizontal,
  ArrowRight,
  WrenchIcon as Wrench,
  Star,
  Phone,
  Mail,
  Camera
} from 'lucide-react';
import toast from 'react-hot-toast';

// Mock data for AI-enhanced requests
interface AIRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'ai-analyzed' | 'assigned' | 'in-progress' | 'completed';
  propertyName: string;
  unitNumber?: string;
  location: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone?: string;
  createdAt: Date;
  estimatedCost?: number;
  estimatedDuration?: string;
  priority: number;
  images: string[];
  aiAnalysis?: {
    confidence: number;
    suggestedCategory: string;
    suggestedContractor: string;
    estimatedCost: number;
    urgencyReason: string;
    similarRequests: number;
    predictedSolution: string;
  };
  contactPreference: 'phone' | 'email' | 'text';
  allowEntry: boolean;
  conversationalData?: {
    keyPoints: string[];
    sentiment: 'positive' | 'neutral' | 'frustrated';
    clarity: number;
  };
}

// Sample AI-enhanced requests
const mockAIRequests: AIRequest[] = [
  {
    id: 'REQ-001',
    title: 'Kitchen Sink Dripping - Urgent Water Waste',
    description: 'The kitchen faucet has been dripping constantly for 3 days. Water is pooling and the sound keeps me up at night. I tried tightening it but it made no difference.',
    category: 'plumbing',
    subcategory: 'faucet-repair',
    urgency: 'high',
    status: 'ai-analyzed',
    propertyName: 'Oak Street Apartments',
    unitNumber: '101',
    location: 'Kitchen',
    tenantName: 'Sarah Chen',
    tenantEmail: 'sarah.chen@email.com',
    tenantPhone: '(555) 123-4567',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    estimatedCost: 150,
    estimatedDuration: '1-2 hours',
    priority: 8,
    images: [
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
      'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=400'
    ],
    aiAnalysis: {
      confidence: 92,
      suggestedCategory: 'plumbing',
      suggestedContractor: 'ABC Plumbing Co.',
      estimatedCost: 150,
      urgencyReason: 'Water waste detected, tenant sleep disruption mentioned',
      similarRequests: 23,
      predictedSolution: 'Likely needs cartridge replacement or O-ring seal repair'
    },
    contactPreference: 'phone',
    allowEntry: true,
    conversationalData: {
      keyPoints: ['Constant dripping', 'Water pooling', 'Sleep disruption', 'Attempted self-repair'],
      sentiment: 'frustrated',
      clarity: 89
    }
  }
];

interface EnhancedMaintenanceDashboardProps {
  className?: string;
}

export const EnhancedMaintenanceDashboard: React.FC<EnhancedMaintenanceDashboardProps> = ({ 
  className = '' 
}) => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<AIRequest[]>(mockAIRequests);
  const [selectedRequest, setSelectedRequest] = useState<AIRequest | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequests = useMemo(() => {
    let filtered = requests;

    if (filter !== 'all') {
      filtered = filtered.filter(req => {
        if (filter === 'ai-enhanced') return req.aiAnalysis;
        if (filter === 'urgent') return req.urgency === 'urgent' || req.urgency === 'high';
        return req.status === filter;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(req => 
        req.title.toLowerCase().includes(term) ||
        req.description.toLowerCase().includes(term) ||
        req.tenantName.toLowerCase().includes(term)
      );
    }

    return filtered.sort((a, b) => b.priority - a.priority);
  }, [requests, filter, searchTerm]);

  const stats = useMemo(() => {
    const total = requests.length;
    const urgent = requests.filter(r => r.urgency === 'urgent' || r.urgency === 'high').length;
    const aiAnalyzed = requests.filter(r => r.aiAnalysis).length;
    const completed = requests.filter(r => r.status === 'completed').length;

    return { total, urgent, aiAnalyzed, completed };
  }, [requests]);

  return (
    <div className={`p-6 bg-orange-50 min-h-screen ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500 rounded-xl text-white shadow-lg">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI-Powered Maintenance</h1>
              <p className="text-gray-600">Intelligent request analysis and automated workflow</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-orange-500 text-white rounded-lg shadow-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">94% AI Accuracy</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
      >
        <div className="bg-white rounded-xl p-6 shadow-sm border border-orange-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Wrench className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Total Requests</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500 mt-1">+12% from last week</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-orange-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Urgent Requests</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.urgent}</div>
          <div className="text-xs text-red-500 mt-1">Requires immediate attention</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-orange-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Brain className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">AI Analyzed</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.aiAnalyzed}</div>
          <div className="text-xs text-orange-500 mt-1">Smart categorization active</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-orange-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Avg Response</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">2.3h</div>
          <div className="text-xs text-green-500 mt-1">-30% improvement</div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-4 shadow-sm border border-orange-100 mb-6"
      >
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {['all', 'ai-enhanced', 'urgent', 'new'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-orange-50'
                }`}
              >
                {filterOption === 'ai-enhanced' ? 'AI Enhanced' : 
                 filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Requests Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredRequests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -2 }}
              className="bg-white rounded-xl border border-orange-100 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
              onClick={() => setSelectedRequest(request)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Clock className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600 border border-orange-200">
                        {request.status.replace('-', ' ').toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    request.urgency === 'urgent' ? 'bg-red-100 text-red-600' :
                    request.urgency === 'high' ? 'bg-orange-100 text-orange-600' :
                    request.urgency === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {request.urgency.toUpperCase()}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
                  {request.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {request.description}
                </p>

                {request.aiAnalysis && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-700">AI Analysis</span>
                      <span className="text-xs text-orange-600">
                        {request.aiAnalysis.confidence}% confidence
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">
                      {request.aiAnalysis.predictedSolution}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Est. cost: ${request.aiAnalysis.estimatedCost} • {request.estimatedDuration}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{request.propertyName}</span>
                    {request.unitNumber && <span>• Unit {request.unitNumber}</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {request.tenantName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{request.tenantName}</div>
                      <div className="text-xs text-gray-500">{request.contactPreference}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {request.images.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Camera className="w-3 h-3" />
                        <span>{request.images.length}</span>
                      </div>
                    )}
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredRequests.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-12 h-12 text-orange-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests found</h3>
          <p className="text-gray-600">
            {searchTerm || filter !== 'all' 
              ? 'Try adjusting your search or filters.' 
              : 'All maintenance requests will appear here.'}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedMaintenanceDashboard; 