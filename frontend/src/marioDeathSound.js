// Start from the navigation click so browsers can play the short sound immediately.
export function playMarioDeathSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  let context;
  let timer;
  const stop = () => {
    clearTimeout(timer);
    if (context && context.state !== 'closed') context.close().catch(() => {});
  };

  try {
    context = new AudioContext();
    const volume = context.createGain();
    volume.gain.value = 0.12;
    volume.connect(context.destination);

    // The short lose-a-life jingle that precedes Mario's game-over music.
    // Voice it with a classic 8-bit square wave.
    // Each entry is a MIDI note and its length in beats; null is a rest.
    const melody = [
      [71, 0.5], [77, 1], [null, 0.5],
      [77, 0.5], [77, 0.75], [76, 0.75], [74, 0.75],
      [72, 0.5], [64, 1], [64, 0.5], [60, 2],
    ];
    const beat = 0.3;
    let start = context.currentTime + 0.03;

    for (const [note, beats] of melody) {
      const duration = beats * beat;
      if (note !== null) {
        const tone = context.createOscillator();
        const envelope = context.createGain();
        const end = start + duration * 0.9;
        tone.type = 'square';
        tone.frequency.setValueAtTime(440 * 2 ** ((note - 69) / 12), start);
        envelope.gain.setValueAtTime(0, start);
        envelope.gain.linearRampToValueAtTime(0.35, start + 0.004);
        envelope.gain.setValueAtTime(0.35, end - 0.02);
        envelope.gain.linearRampToValueAtTime(0, end);
        tone.connect(envelope);
        envelope.connect(volume);
        tone.start(start);
        tone.stop(end + 0.01);
      }
      start += duration;
    }

    timer = setTimeout(stop, (start - context.currentTime + 0.2) * 1000);
    if (context.state === 'suspended') context.resume().catch(stop);
    return stop;
  } catch {
    stop();
  }
}
