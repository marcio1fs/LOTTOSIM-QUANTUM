
import React from 'react';

interface NumberBallProps {
  number: number;
  isSelected?: boolean;
  isDraw?: boolean;
  onClick?: () => void;
  colorClass: string;
  size?: 'sm' | 'md' | 'lg';
}

const NumberBall: React.FC<NumberBallProps> = ({ 
  number, 
  isSelected, 
  isDraw, 
  onClick, 
  colorClass,
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        ${sizeClasses[size]}
        rounded-full flex items-center justify-center font-bold border-2 transition-all duration-200
        ${isSelected 
          ? `${colorClass} text-white border-transparent shadow-md scale-110` 
          : isDraw 
            ? `${colorClass} text-white border-transparent animate-draw` 
            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'}
      `}
    >
      {number.toString().padStart(2, '0')}
    </button>
  );
};

export default NumberBall;
