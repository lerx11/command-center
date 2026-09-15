// Tiny Web Audio helpers: success chime + (louder) timer alarm.

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

function tone(
  c: AudioContext,
  freq: number,
  start: number,
  dur: number,
  peak: number
) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  const t0 = c.currentTime + start;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** Positive, short success chime (task done). `volume` 0..1. */
export function playSuccess(volume = 0.45) {
  const c = getCtx();
  if (!c) return;
  tone(c, 659.25, 0, 0.18, volume); // E5
  tone(c, 987.77, 0.1, 0.28, volume); // B5
}

/** Louder, more insistent timer-complete alarm. */
export function playTimerEnd(volume = 0.85) {
  const c = getCtx();
  if (!c) return;
  // Three ascending alert beeps.
  tone(c, 880, 0, 0.25, volume); // A5
  tone(c, 880, 0.36, 0.25, volume);
  tone(c, 1174.66, 0.72, 0.5, volume); // D6
}