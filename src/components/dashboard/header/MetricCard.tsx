import React from 'react';
import { Bell, Info } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  showNotification?: boolean;
  showClickIndicator?: boolean;
}

export function MetricCard({ icon, label, value, showNotification, showClickIndicator }: MetricCardProps) {
  return (
    <div className={cn(
      "flex items-center justify-center gap-2 sm:gap-3 bg-gray-700/50 px-3 py-2 sm:px-4 sm:py-3 rounded-lg w-full relative group",
      showClickIndicator && "hover:bg-gray-700/70 cursor-pointer"
    )}>
      <div className="flex items-center justify-center relative">
        {icon}
        {showNotification && (
          <div className="absolute -top-1 -right-1">
            <Bell className="text-lime-500 fill-current animate-pulse" size={12} />
          </div>
        )}
        {showClickIndicator && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-ping" />
        )}
      </div>
      <div className="flex flex-col items-center min-w-0 pr-3">
        <span className="text-xs sm:text-sm text-gray-400 leading-none truncate text-center">{label}</span>
        <span className="text-sm sm:text-base font-semibold text-white leading-tight truncate text-center">{value}</span>
      </div>
      <div className="absolute bottom-2 right-2 text-gray-400">
        <Info size={12} />
      </div>
      {showClickIndicator && (
        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-orange-500 bg-gray-800 px-2 py-1 rounded-full">
          Click to view
        </div>
      )}
    </div>
  );
}