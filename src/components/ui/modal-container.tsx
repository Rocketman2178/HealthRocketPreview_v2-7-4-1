import React from 'react';
import { ModalPosition } from '../dashboard/rank/CommunityLeaderboard';

interface ModalContainerProps {
  children: React.ReactNode;
  onClose?: () => void;
  applyPosition?:boolean;
  position?:ModalPosition;
}

export function ModalContainer({ children, onClose,applyPosition=false,position }: ModalContainerProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" style={applyPosition? position:{}}>
      <div 
        className="relative w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl border border-gray-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
      {onClose && (
        <div 
          className="absolute inset-0 -z-10"
          onClick={onClose}
        />
      )}
    </div>
  );
}