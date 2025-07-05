import React, { createContext, useContext, useState, useEffect } from "react";
import { LeaderboardEntry } from "../types/community";
import { PlayerProfileModal } from "../components/dashboard/rank/PlayerProfileModal";
import { ModalPosition } from "../components/dashboard/rank/CommunityLeaderboard";

interface ModalContextType {
  showPlayerProfile: (
    player: LeaderboardEntry,
    position?: ModalPosition
  ) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [playerProfile, setPlayerProfile] = useState<LeaderboardEntry | null>(
    null
  );
  const [modalPosition, setModalPosition] = useState<ModalPosition | undefined>(
    { top: 0, left: 0 }
  );

  const showPlayerProfile = (
    player: LeaderboardEntry,
    position?: ModalPosition
  ) => {
    setPlayerProfile(player);
    setModalPosition(position);
  };

  const hideModal = () => {
    setPlayerProfile(null);
  };

  useEffect(() => {
    // Lock body scroll when modal is open
    if (playerProfile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [playerProfile]);

  return (
    <ModalContext.Provider value={{ showPlayerProfile, hideModal }}>
      {children}
      {playerProfile && (
        <PlayerProfileModal
          player={playerProfile}
          onClose={hideModal}
          position={modalPosition}
        />
      )}
    </ModalContext.Provider>
  );
};
