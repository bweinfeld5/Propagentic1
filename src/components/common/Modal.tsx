import React from 'react';

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
  isOpen?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-3xl'
};

const Modal: React.FC<ModalProps> = ({ 
  children, 
  onClose, 
  title, 
  isOpen = true,
  size = 'md',
  className = ''
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto ${className}`}>
        <div className="flex justify-between items-center mb-4">
          {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;