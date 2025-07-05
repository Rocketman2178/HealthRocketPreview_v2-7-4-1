export interface CosmoState {
  isEnabled: boolean;
  isMinimized: boolean;
  disabledUntil: 'next-level' | 'manual' | null;
}