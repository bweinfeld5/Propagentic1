import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, MessageSquare, Camera, Zap } from 'lucide-react';

interface AIMaintenanceFeatureHighlightProps {
  onViewAIRequest?: () => void;
}

export const AIMaintenanceFeatureHighlight: React.FC<AIMaintenanceFeatureHighlightProps> = ({
  onViewAIRequest
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-orange-50 rounded-xl border border-orange-200 p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-orange-500 rounded-lg text-white shadow-lg">
          <Brain className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI-Powered Maintenance</h3>
          <p className="text-sm text-gray-600">Get help faster with intelligent assistance</p>
        </div>
        <div className="ml-auto px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full border border-orange-200">
          NEW ✨
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-orange-100 rounded-lg">
            <MessageSquare className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900">Conversational Interface</h4>
            <p className="text-xs text-gray-600">Describe issues naturally, like talking to a person</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-amber-100 rounded-lg">
            <Brain className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900">Smart Analysis</h4>
            <p className="text-xs text-gray-600">AI categorizes and prioritizes your request</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-orange-100 rounded-lg">
            <Camera className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900">Photo Intelligence</h4>
            <p className="text-xs text-gray-600">Upload photos for instant problem diagnosis</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-green-100 rounded-lg">
            <Zap className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900">Instant Estimates</h4>
            <p className="text-xs text-gray-600">Get cost and timeline predictions instantly</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-orange-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Ready to try the new experience?</p>
            <p className="text-xs text-gray-600">Submit requests faster with AI guidance</p>
          </div>
          <button
            onClick={onViewAIRequest}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            Try AI Assistant
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AIMaintenanceFeatureHighlight; 