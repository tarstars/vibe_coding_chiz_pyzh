import { mod } from './utils';

export interface NoteEvent {
  pitchClass: number;
  midi: number;
  durationUnits: number;
}

export interface PlaybackNote {
  index: number;
  pitchClass: number;
  midi: number;
  durationUnits: number;
  durationSec: number;
  startSec: number;
}

const BASE_MIDI_C4 = 60;
const DEFAULT_BPM = 120;
const EIGHTH_NOTES_PER_BEAT = 2;

// Source melody: blueprint/cp.abc
const CHIZHIK_PYZHIK_UNITS: Array<{ pitchClass: number; durationUnits: number }> = [
  { pitchClass: 4, durationUnits: 1 },
  { pitchClass: 0, durationUnits: 1 },
  { pitchClass: 4, durationUnits: 1 },
  { pitchClass: 0, durationUnits: 1 },
  { pitchClass: 5, durationUnits: 1 },
  { pitchClass: 4, durationUnits: 1 },
  { pitchClass: 2, durationUnits: 2 },
  { pitchClass: 7, durationUnits: 1 },
  { pitchClass: 7, durationUnits: 1 },
  { pitchClass: 7, durationUnits: 1 },
  { pitchClass: 9, durationUnits: 0.5 },
  { pitchClass: 11, durationUnits: 0.5 },
  { pitchClass: 0, durationUnits: 1 },
  { pitchClass: 0, durationUnits: 1 },
  { pitchClass: 0, durationUnits: 2 },
];

const BASE_MELODY: NoteEvent[] = CHIZHIK_PYZHIK_UNITS.map((note) => ({
  pitchClass: note.pitchClass,
  durationUnits: note.durationUnits,
  midi: BASE_MIDI_C4 + note.pitchClass,
}));

export function durationUnitsToSeconds(durationUnits: number, bpm = DEFAULT_BPM): number {
  const beatSeconds = 60 / bpm;
  const eighthSeconds = beatSeconds / EIGHTH_NOTES_PER_BEAT;
  return durationUnits * eighthSeconds;
}

export function buildPlaybackNotes(shift: number, bpm = DEFAULT_BPM): PlaybackNote[] {
  let cursorSeconds = 0;

  return BASE_MELODY.map((note, index) => {
    const shiftedMidi = note.midi + shift;
    const shiftedPitchClass = mod(note.pitchClass + shift, 12);
    const durationSec = durationUnitsToSeconds(note.durationUnits, bpm);

    const playbackNote: PlaybackNote = {
      index,
      pitchClass: shiftedPitchClass,
      midi: shiftedMidi,
      durationUnits: note.durationUnits,
      durationSec,
      startSec: cursorSeconds,
    };

    cursorSeconds += durationSec;
    return playbackNote;
  });
}

export function getTotalDurationSeconds(notes: PlaybackNote[]): number {
  if (notes.length === 0) {
    return 0;
  }

  const last = notes[notes.length - 1];
  return last.startSec + last.durationSec;
}
