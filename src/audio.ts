import type { PlaybackNote } from './melody';
import { midiToFrequency } from './utils';

interface PlaybackCallbacks {
  onNoteStart?: (note: PlaybackNote) => void;
  onNoteEnd?: (note: PlaybackNote) => void;
  onFinish?: () => void;
}

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private timerIds: number[] = [];
  private oscillators: OscillatorNode[] = [];
  private runToken = 0;
  private playing = false;

  get isPlaying(): boolean {
    return this.playing;
  }

  async play(notes: PlaybackNote[], callbacks: PlaybackCallbacks): Promise<void> {
    if (notes.length === 0) {
      callbacks.onFinish?.();
      return;
    }

    await this.ensureContext();
    this.clearScheduledAudio();

    const token = ++this.runToken;
    const context = this.audioContext as AudioContext;

    if (context.state === 'suspended') {
      await context.resume();
    }

    this.playing = true;

    const leadInSec = 0.06;
    const startAt = context.currentTime + leadInSec;

    for (const note of notes) {
      const startTime = startAt + note.startSec;
      const endTime = startTime + note.durationSec;

      const oscillator = context.createOscillator();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(midiToFrequency(note.midi), startTime);

      const gain = context.createGain();
      const attackSec = Math.min(0.02, note.durationSec * 0.3);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.2, startTime + attackSec);
      gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(startTime);
      oscillator.stop(endTime + 0.01);

      this.oscillators.push(oscillator);

      const noteStartDelayMs = Math.max(0, (startTime - context.currentTime) * 1000);
      const noteEndDelayMs = Math.max(0, (endTime - context.currentTime) * 1000);

      this.timerIds.push(
        window.setTimeout(() => {
          if (token !== this.runToken) {
            return;
          }
          callbacks.onNoteStart?.(note);
        }, noteStartDelayMs),
      );

      this.timerIds.push(
        window.setTimeout(() => {
          if (token !== this.runToken) {
            return;
          }
          callbacks.onNoteEnd?.(note);
        }, noteEndDelayMs),
      );
    }

    const totalDurationMs =
      (startAt + notes[notes.length - 1].startSec + notes[notes.length - 1].durationSec - context.currentTime) *
      1000;

    this.timerIds.push(
      window.setTimeout(() => {
        if (token !== this.runToken) {
          return;
        }

        this.playing = false;
        callbacks.onFinish?.();
      }, Math.max(0, totalDurationMs + 20)),
    );
  }

  stop(): void {
    this.runToken += 1;
    this.playing = false;
    this.clearScheduledAudio();
  }

  private clearScheduledAudio(): void {
    for (const timerId of this.timerIds) {
      window.clearTimeout(timerId);
    }
    this.timerIds = [];

    for (const oscillator of this.oscillators) {
      try {
        oscillator.stop();
      } catch {
        // Oscillator could be already stopped; this is safe to ignore.
      }
    }
    this.oscillators = [];
  }

  private async ensureContext(): Promise<void> {
    if (this.audioContext) {
      return;
    }

    const AudioContextConstructor = window.AudioContext;
    this.audioContext = new AudioContextConstructor();
  }
}
