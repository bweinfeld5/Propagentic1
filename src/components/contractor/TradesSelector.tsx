import React from 'react';
import { availableTrades } from '../../services/firestore/contractorService';

interface TradesSelectorProps {
  selectedTrades: string[];
  onChange: (trades: string[]) => void;
}

const TradesSelector: React.FC<TradesSelectorProps> = ({ selectedTrades, onChange }) => {
  const handleTradeChange = (trade: string) => {
    const newSelection = selectedTrades.includes(trade)
      ? selectedTrades.filter(t => t !== trade)
      : [...selectedTrades, trade];
    onChange(newSelection);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Your Trades/Services <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {availableTrades.map((trade) => (
          <label
            key={trade}
            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
              selectedTrades.includes(trade)
                ? 'bg-blue-500 border-blue-600 text-white shadow-md'
                : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input
              type="checkbox"
              className="sr-only" // Hide the default checkbox
              checked={selectedTrades.includes(trade)}
              onChange={() => handleTradeChange(trade)}
            />
            <span className="text-sm font-semibold">{trade}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default TradesSelector; 