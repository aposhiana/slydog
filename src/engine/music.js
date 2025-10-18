// engine/music.js
export class BackgroundMusic {
  constructor(audioSourceUrl) {
    // Use HTMLAudio for simplicity; loop gives us seamless restart
    this.audioElement = new Audio(audioSourceUrl);
    this.audioElement.loop = true;
    this.audioElement.volume = 0.25; // default volume 
    this.isUnlocked = false;

    // Keep iOS/Safari happier
    this.audioElement.playsInline = true;
  }

  async playIfPossible() {
    // Try to play immediately (may be blocked by autoplay policy)
    try {
      await this.audioElement.play();
      this.isUnlocked = true;
    } catch (err) {
      // Autoplay blocked; we will unlock on first gesture
    }
  }

  // Call this once after creating the instance. Pass elements that will receive user gestures.
  installUnlockOnFirstGesture(targetElements = [document]) {
    const tryUnlock = async () => {
      if (this.isUnlocked) {
        cleanup();
        return;
      }
      try {
        await this.audioElement.play();
        this.isUnlocked = true;
        cleanup();
      } catch {
        // Keep listeners; the next gesture may succeed
      }
    };

    const cleanup = () => {
      targetElements.forEach((el) => {
        el.removeEventListener('pointerdown', tryUnlock);
        el.removeEventListener('keydown', tryUnlock);
        el.removeEventListener('touchstart', tryUnlock);
      });
    };

    targetElements.forEach((el) => {
      el.addEventListener('pointerdown', tryUnlock);
      el.addEventListener('keydown', tryUnlock);
      el.addEventListener('touchstart', tryUnlock, { passive: true });
    });
  }

  setVolume(volume0to1) {
    this.audioElement.volume = Math.min(1, Math.max(0, volume0to1));
  }

  pause() {
    this.audioElement.pause();
  }
}
