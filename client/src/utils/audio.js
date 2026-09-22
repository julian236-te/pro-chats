// Synthesize realistic sounds using Web Audio API

let audioCtx = null;

export function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Pro Chats "Pop" sent message sound
export function playSentSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1150, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    console.error('Audio play error', e);
  }
}

// Pro Chats "Chime" incoming message sound
export function playReceivedSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Second higher tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, now + 0.08);
    gain2.gain.setValueAtTime(0.25, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.35);
  } catch (e) {
    console.error('Audio play error', e);
  }
}

// Calling Ringtone
let ringInterval = null;
export function startRingtone() {
  stopRingtone();
  const playRingBurst = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(480, now + 0.1);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);
    } catch (e) {
      console.error(e);
    }
  };

  playRingBurst();
  ringInterval = setInterval(playRingBurst, 2400);
}

export function stopRingtone() {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
}

// Synthesize real audible voice notes (speech-like voice frequencies)
// Used when actual recorded mic audio is unavailable or testing without microphone
export function playSimulatedVoiceNote(durationSeconds = 6, onProgress, onEnd) {
  try {
    const ctx = getAudioContext();
    if (!ctx) {
      if (onEnd) onEnd();
      return { stop: () => {} };
    }

    let isStopped = false;
    let elapsed = 0;
    const notes = [260, 310, 240, 290, 350, 300, 280, 330, 270, 320];

    const interval = setInterval(() => {
      if (isStopped) return;
      elapsed += 0.1;

      if (elapsed >= durationSeconds) {
        clearInterval(interval);
        if (onProgress) onProgress(durationSeconds, 100);
        if (onEnd) onEnd();
        return;
      }

      const percent = Math.min(100, (elapsed / durationSeconds) * 100);
      if (onProgress) onProgress(elapsed, percent);

      // Play soft speech formant burst every 0.3s
      if (Math.floor(elapsed * 10) % 3 === 0) {
        try {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          const randomFreq = notes[Math.floor(Math.random() * notes.length)];
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(randomFreq, now);
          osc.frequency.exponentialRampToValueAtTime(randomFreq * 1.15, now + 0.18);

          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.22);
        } catch (err) {
          // ignore minor audio glitches
        }
      }
    }, 100);

    return {
      stop: () => {
        isStopped = true;
        clearInterval(interval);
        if (onEnd) onEnd();
      }
    };
  } catch (err) {
    console.error(err);
    if (onEnd) onEnd();
    return { stop: () => {} };
  }
}
