import React from 'react';
import { getTagIcon, getCategoryColor } from '../utils/tagIcons';

interface ChipProps {
  tagId: number;
  tagName: string;
  tagType: string;
  isSelected?: boolean;
  isClickable?: boolean;
  onClick?: (tagId: number) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'filled';
}

export const Chip: React.FC<ChipProps> = ({
  tagId,
  tagName,
  tagType,
  isSelected = false,
  isClickable = false,
  onClick,
  size = 'md',
  variant = 'default'
}) => {
  const colors = getCategoryColor(tagType);
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-2 text-sm gap-2',
    lg: 'px-4 py-3 text-base gap-2'
  };

  const baseClasses = `
    inline-flex items-center rounded-full border font-medium
    transition-all duration-200
    ${sizeClasses[size]}
    ${isClickable ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}
  `;

  const variantClasses = () => {
    switch (variant) {
      case 'outlined':
        return isSelected 
          ? `${colors.selectedBg} ${colors.selectedText} border-current shadow-sm`
          : `bg-transparent ${colors.text} border-current hover:${colors.bg}`;
      case 'filled':
        return isSelected
          ? `${colors.selectedBg} ${colors.selectedText} border-transparent shadow-sm`
          : `${colors.bg} ${colors.text} border-transparent`;
      default:
        return isSelected 
          ? `${colors.selectedBg} ${colors.selectedText} shadow-sm` 
          : `${colors.bg} ${colors.text}`;
    }
  };

  const handleClick = () => {
    if (isClickable && onClick) {
      onClick(tagId);
    }
  };

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isClickable}
      className={`${baseClasses} ${variantClasses()}`}
    >
      {React.cloneElement(getTagIcon(tagName, tagType), { 
        size: iconSize, 
        stroke: 1.5 
      })}
      <span>{tagName}</span>
    </button>
  );
};

export default Chip;
