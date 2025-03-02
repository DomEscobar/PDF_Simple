
import React from 'react';
import { cn } from '@/lib/utils';

type ActionButtonProps = {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  active?: boolean;
  className?: string;
  tooltip?: string;
};

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  icon,
  label,
  active = false,
  className,
  tooltip,
}) => {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={cn(
          "tool-button",
          active && "active",
          className
        )}
        aria-label={label || tooltip}
      >
        {icon}
      </button>
      
      {tooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/75 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
          {tooltip}
        </div>
      )}
    </div>
  );
};

export default ActionButton;
