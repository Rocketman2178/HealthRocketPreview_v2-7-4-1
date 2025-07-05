import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSupabase } from './SupabaseContext';
import type { CosmoState } from '../types/cosmo';

type CosmoActionType = 
  | { type: 'SHOW_COSMO' }
  | { type: 'HIDE_COSMO' }
  | { type: 'DISABLE_UNTIL', payload: 'next-level' | 'manual' | null };

interface CosmoContextType {
  state: CosmoState;
  showCosmo: () => void;
  hideCosmo: () => void;
  disableUntil: (type: 'next-level' | 'manual' | null) => void;
  dispatch: React.Dispatch<CosmoActionType>;
}

const CosmoContext = createContext<CosmoContextType | undefined>(undefined);

interface CosmoState {
  isEnabled: boolean;
  isMinimized: boolean;
  disabledUntil: 'next-level' | 'manual' | null;
}

const initialState: CosmoState = {
  isEnabled: true,
  isMinimized: true,
  disabledUntil: null,
};

function cosmoReducer(state: CosmoState, action: CosmoActionType): CosmoState {
  switch (action.type) {
    case 'SHOW_COSMO':
      return { ...state, isMinimized: false };
    case 'HIDE_COSMO':
      return { ...state, isMinimized: true };
    case 'DISABLE_UNTIL':
      return { ...state, disabledUntil: action.payload, isMinimized: true };
    default:
      return state;
  }
}

export function CosmoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cosmoReducer, initialState);
  const { user } = useSupabase();

  useEffect(() => {
    // Load user preferences from localStorage
    const preferences = localStorage.getItem('cosmo-preferences');
    if (preferences) {
      const { disabledUntil } = JSON.parse(preferences);
      if (disabledUntil) {
        dispatch({ type: 'DISABLE_UNTIL', payload: disabledUntil });
      }
    }
  }, []);

  useEffect(() => {
    // Save preferences when they change
    localStorage.setItem('cosmo-preferences', JSON.stringify({
      disabledUntil: state.disabledUntil
    }));
  }, [state.disabledUntil]);

  const showCosmo = () => dispatch({ type: 'SHOW_COSMO' });
  const hideCosmo = () => dispatch({ type: 'HIDE_COSMO' });
  const disableUntil = (type: 'next-level' | 'manual' | null) => dispatch({ type: 'DISABLE_UNTIL', payload: type });

  return (
    <CosmoContext.Provider value={{ state, showCosmo, hideCosmo, disableUntil, dispatch }}>
      {children}
    </CosmoContext.Provider>
  );
}

export function useCosmo() {
  const context = useContext(CosmoContext);
  if (context === undefined) {
    throw new Error('useCosmo must be used within a CosmoProvider');
  }
  return context;
}