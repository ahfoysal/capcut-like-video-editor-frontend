/** Shared AudioContext for decoded buffer playback — smooth, no streaming decode jank. */

let sharedAudioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    sharedAudioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return sharedAudioContext;
}

export function resumeAudioContextOnGesture(): void {
  if (sharedAudioContext?.state === "suspended") {
    sharedAudioContext.resume();
  }
}
