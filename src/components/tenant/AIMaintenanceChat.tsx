import React, { useState, useEffect, useRef } from 'react';
import { useModelContext } from '../../contexts/ModelContext';
import useMaintenanceAI from '../../hooks/useMaintenanceAI';

const AIMaintenanceChat: React.FC = () => {
  const { messages, isLoading } = useModelContext();
  const { sendMessage, getFollowUpQuestions } = useMaintenanceAI();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    try {
      await sendMessage(input.trim());
      setInput('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = getFollowUpQuestions();

  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-w-lg mx-auto">
      <div className="h-64 overflow-y-auto mb-4 space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`px-3 py-2 rounded-lg max-w-[70%] ${
                msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && <div className="text-sm text-gray-500">AI is typing...</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex">
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded-l px-3 py-2 focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the issue..."
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-blue-500 text-white rounded-r"
          disabled={!input.trim() || isLoading}
        >
          Send
        </button>
      </div>
      {suggestions.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-600 mb-1">Suggested follow-up questions:</p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {suggestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AIMaintenanceChat;
