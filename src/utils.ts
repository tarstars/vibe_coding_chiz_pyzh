export const NOTE_LABELS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  const chunks = normalized.length === 3
    ? normalized.split('').map((chunk) => chunk + chunk)
    : [normalized.slice(0, 2), normalized.slice(2, 4), normalized.slice(4, 6)];

  return {
    r: Number.parseInt(chunks[0], 16),
    g: Number.parseInt(chunks[1], 16),
    b: Number.parseInt(chunks[2], 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function blendHexColors(leftHex: string, rightHex: string): string {
  const left = hexToRgb(leftHex);
  const right = hexToRgb(rightHex);

  return rgbToHex(
    Math.round((left.r + right.r) / 2),
    Math.round((left.g + right.g) / 2),
    Math.round((left.b + right.b) / 2),
  );
}
