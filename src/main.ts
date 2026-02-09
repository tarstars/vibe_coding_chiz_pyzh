import './styles.css';

import { AudioPlayer } from './audio';
import { buildPlaybackNotes } from './melody';
import { MelodyVisualizer } from './visualizer';
import { NOTE_LABELS, mod } from './utils';

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`UI element not found: ${selector}`);
  }
  return element;
}

const shiftInput = requireElement<HTMLInputElement>('#shift-input');
const playButton = requireElement<HTMLButtonElement>('#play-button');
const readout = requireElement<HTMLParagraphElement>('#transpose-readout');
const visualizerElement = requireElement<SVGSVGElement>('#melody-visualizer');

const visualizer = new MelodyVisualizer(visualizerElement);
const audioPlayer = new AudioPlayer();

let activeNoteIndex: number | null = null;

function parseShiftValue(rawValue: string): number {
  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.trunc(numeric);
}

function currentShift(): number {
  return parseShiftValue(shiftInput.value);
}

function applyShiftToUI(): void {
  const shift = currentShift();
  const shiftedPitchClass = mod(shift, 12);

  visualizer.setTransposition(shift);
  readout.textContent = `Нота C после сдвига: ${NOTE_LABELS[shiftedPitchClass]}`;
}

function normalizeInputValue(): void {
  shiftInput.value = String(currentShift());
  applyShiftToUI();
}

async function handlePlay(): Promise<void> {
  const shift = currentShift();
  const playbackNotes = buildPlaybackNotes(shift);

  audioPlayer.stop();
  visualizer.resetHistory();

  playButton.textContent = 'Restart';

  await audioPlayer.play(playbackNotes, {
    onNoteStart(note) {
      activeNoteIndex = note.index;
      visualizer.setActivePitchClass(note.pitchClass);
      visualizer.addHistoryLayer(note.pitchClass, note.durationUnits);
    },
    onNoteEnd(note) {
      if (activeNoteIndex !== note.index) {
        return;
      }

      activeNoteIndex = null;
      visualizer.setActivePitchClass(null);
    },
    onFinish() {
      activeNoteIndex = null;
      visualizer.setActivePitchClass(null);
      playButton.textContent = 'Play';
    },
  });
}

shiftInput.addEventListener('input', () => {
  applyShiftToUI();
});

shiftInput.addEventListener('blur', () => {
  normalizeInputValue();
});

playButton.addEventListener('click', () => {
  void handlePlay();
});

applyShiftToUI();
