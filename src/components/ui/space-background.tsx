import React from "react";
import { useLocation } from "react-router-dom";
import { Trophy, Compass, Target, Zap, Radio } from 'lucide-react';
// Removed: import { PlayerGuide } from "../guide/PlayerGuide";
import { useCosmo } from "../../contexts/CosmoContext";

interface SpaceBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export function RootLayout({ children, className = "" }: SpaceBackgroundProps) {
  const location = useLocation();
  const { showCosmo } = useCosmo();
  const isChatPage = location.pathname.startsWith("/chat/");
  return (
    <div className={`relative min-h-screen ${className}`}>
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?auto=format&fit=crop&q=80")',
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        {/* Add a subtle overlay to ensure text readability */}
        <div className="absolute inset-0 bg-black/30" />
      </div>
      <div className="relative mb-auto">{children}</div>
   
      {/* Removed: {!isChatPage && <PlayerGuide />} */}
    </div>
  );
}