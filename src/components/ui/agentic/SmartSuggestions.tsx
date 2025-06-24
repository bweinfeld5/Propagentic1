import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { Sparkles, Lightbulb, TrendingUp, Clock } from 'lucide-react';

export interface Suggestion {
  id: string;
  text: string;
  type?: 'ai' | 'trending' | 'recent' | 'tip';
  confidence?: number;
  onClick?: () => void;
}

interface SmartSuggestionsProps {
  suggestions: Suggestion[];
  isLoading?: boolean;
  className?: string;
  title?: string;
  onSuggestionClick?: (suggestion: Suggestion) => void;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  suggestions,
  isLoading = false,
  className,
  title = "Suggestions",
  onSuggestionClick
}) => {
  const getIcon = (type?: string) => {
    switch (type) {
      case 'ai':
        return <Sparkles className="w-4 h-4" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4" />;
      case 'recent':
        return <Clock className="w-4 h-4" />;
      case 'tip':
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'ai':
        return 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20';
      case 'trending':
        return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20';
      case 'recent':
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20';
      case 'tip':
        return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20';
      default:
        return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20';
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </h3>
        {isLoading && (
          <div className="flex items-center gap-1">
            <motion.div
              className="w-1 h-1 bg-orange-500 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="w-1 h-1 bg-orange-500 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-1 h-1 bg-orange-500 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        )}
      </div>

      {/* Suggestions list */}
      <AnimatePresence mode="popLayout">
        {suggestions.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  suggestion.onClick?.();
                  onSuggestionClick?.(suggestion);
                }}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all",
                  "hover:shadow-md hover:-translate-y-0.5",
                  "bg-white dark:bg-gray-800",
                  "border-gray-200 dark:border-gray-700",
                  "hover:border-orange-300 dark:hover:border-orange-700"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-1.5 rounded-md",
                    getTypeColor(suggestion.type)
                  )}>
                    {getIcon(suggestion.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      {suggestion.text}
                    </p>
                    {suggestion.confidence !== undefined && (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1 w-20 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-orange-400 to-orange-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${suggestion.confidence * 100}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.round(suggestion.confidence * 100)}% match
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        ) : !isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-6 text-sm text-gray-500 dark:text-gray-400"
          >
            No suggestions available
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* AI-powered badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center gap-2 pt-2"
      >
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <Sparkles className="w-3 h-3" />
          <span>AI-powered suggestions</span>
        </div>
      </motion.div>
    </div>
  );
}; 