import React from 'react';
import { Switch } from './switch';

interface SwitchItemProps {
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  variant?: 'default' | 'bordered';
}

export const SwitchItem: React.FC<SwitchItemProps> = ({
  title,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  icon,
  variant = 'default'
}) => {
  const baseClasses = "flex items-center justify-between transition-colors";
  const variantClasses = variant === 'bordered' 
    ? "p-4 border rounded-lg bg-gray-50/50 hover:bg-gray-100/50" 
    : "py-3";

  return (
    <div className={`${baseClasses} ${variantClasses}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900">{title}</p>
          {description && (
            <p className="text-sm text-gray-500 mt-1 truncate">{description}</p>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 ml-4 rtl:ml-0 rtl:mr-4">
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
};