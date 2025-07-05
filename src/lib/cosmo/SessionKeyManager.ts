import { v4 as uuidv4 } from 'uuid';

/**
 * Manages session keys for Cosmo chat interactions
 * Generates a unique session ID and rotates it every 3 hours
 */
export class SessionKeyManager {
  private static readonly KEY_STORAGE_KEY = 'cosmo_session_id';
  private static readonly EXPIRY_STORAGE_KEY = 'cosmo_session_expiry';
  private static readonly SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

  /**
   * Gets the current session key, generating a new one if needed or if the current one has expired
   * @returns The current valid session key
   */
  static getSessionKey(): string {
    const currentKey = localStorage.getItem(this.KEY_STORAGE_KEY);
    const expiryTimestamp = localStorage.getItem(this.EXPIRY_STORAGE_KEY);
    
    // Check if we need to generate a new key
    if (!currentKey || !expiryTimestamp || this.isExpired(expiryTimestamp)) {
      return this.generateNewKey();
    }
    
    return currentKey;
  }

  /**
   * Generates a new session key and stores it with an expiry timestamp
   * @returns The newly generated session key
   */
  private static generateNewKey(): string {
    const newKey = uuidv4();
    const expiryTime = Date.now() + this.SESSION_DURATION_MS;
    
    localStorage.setItem(this.KEY_STORAGE_KEY, newKey);
    localStorage.setItem(this.EXPIRY_STORAGE_KEY, expiryTime.toString());
    
    console.log(`Generated new Cosmo session key: ${newKey}, expires in 10 minutes at: ${new Date(expiryTime).toISOString()}`);
    
    return newKey;
  }

  /**
   * Checks if the provided expiry timestamp has passed
   * @param expiryTimestamp The expiry timestamp to check
   * @returns True if the timestamp has passed, false otherwise
   */
  private static isExpired(expiryTimestamp: string): boolean {
    const expiryTime = parseInt(expiryTimestamp, 10);
    return isNaN(expiryTime) || Date.now() > expiryTime;
  }

  /**
   * Forces generation of a new session key regardless of current expiry
   * @returns The newly generated session key
   */
  static forceRotateKey(): string {
    return this.generateNewKey();
  }
}