interface KeyState {
  key: string;
  cooldownUntil: number; // timestamp ms
}

export class KeyManager {
  private keys: KeyState[] = [];
  private currentIndex: number = 0;
  private readonly cooldownMs = 60 * 1000; // 1 minute cooldown on 429

  constructor(envKeys: string) {
    const rawKeys = envKeys.split(',').map((k) => k.trim()).filter((k) => k.length > 0);
    if (rawKeys.length === 0) {
      console.warn("⚠️ No OPENROUTER_KEYS provided. Please set it in your environment.");
    }
    this.keys = rawKeys.map((k) => ({
      key: k,
      cooldownUntil: 0
    }));
  }

  // Returns a usable API key, or throws if all are on cooldown
  public getNextKey(): string {
    if (this.keys.length === 0) {
        throw new Error("No API keys found. Setup OPENROUTER_KEYS env variable.");
    }
    const now = Date.now();
    for (let i = 0; i < this.keys.length; i++) {
        // Round robin
        const attemptIndex = (this.currentIndex + i) % this.keys.length;
        const keyState = this.keys[attemptIndex];
        
        if (now > keyState.cooldownUntil) {
            this.currentIndex = (attemptIndex + 1) % this.keys.length; // advance for next time
            return keyState.key;
        }
    }
    throw new Error("All API keys are currently rate-limited (429 cooldown). Please wait 1 minute.");
  }

  // Mark a key as rate-limited
  public reportRateLimit(failedKey: string) {
    const keyState = this.keys.find(k => k.key === failedKey);
    if (keyState) {
        keyState.cooldownUntil = Date.now() + this.cooldownMs;
        console.warn(`[KeyManager] Key starting with ${failedKey.substring(0, 8)}... placed on cooldown for ${this.cooldownMs}ms`);
    }
  }
}
