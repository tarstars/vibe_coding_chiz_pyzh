import { NOTE_LABELS, blendHexColors, mod } from './utils';

const SVG_NS = 'http://www.w3.org/2000/svg';

const NATURAL_COLORS: Record<number, string> = {
  0: '#ff3b30',
  2: '#ff9500',
  4: '#ffd60a',
  5: '#30d158',
  7: '#00c7be',
  9: '#0a84ff',
  11: '#5e5ce6',
};

const SHARP_NEIGHBORS: Record<number, [number, number]> = {
  1: [0, 2],
  3: [2, 4],
  6: [5, 7],
  8: [7, 9],
  10: [9, 11],
};

function createNoteColorPalette(): string[] {
  const palette: string[] = Array<string>(12);

  for (const [pitchClassString, color] of Object.entries(NATURAL_COLORS)) {
    palette[Number(pitchClassString)] = color;
  }

  for (const [pitchClassString, neighbors] of Object.entries(SHARP_NEIGHBORS)) {
    const pitchClass = Number(pitchClassString);
    const [left, right] = neighbors;
    palette[pitchClass] = blendHexColors(NATURAL_COLORS[left], NATURAL_COLORS[right]);
  }

  return palette;
}

const NOTE_COLORS = createNoteColorPalette();

function createSvgElement<K extends keyof SVGElementTagNameMap>(tagName: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tagName);
}

interface Point {
  x: number;
  y: number;
}

export class MelodyVisualizer {
  private readonly center = 240;
  private readonly baseInnerRadius = 94;
  private readonly baseOuterRadius = 170;
  private readonly historyOuterRadius = 220;
  private readonly historyThicknessPerUnit = 6;
  private readonly labelRadius = 235;

  private readonly sectorPaths: SVGPathElement[] = [];
  private readonly historyGroup: SVGGElement;
  private readonly arrowGroup: SVGGElement;
  private readonly centerReadout: SVGTextElement;

  private readonly consumedThicknessByPitch = Array<number>(12).fill(0);

  constructor(private readonly svg: SVGSVGElement) {
    this.svg.setAttribute('viewBox', '0 0 480 480');

    const backdropGroup = createSvgElement('g');
    const historyGroup = createSvgElement('g');
    const sectorsGroup = createSvgElement('g');
    const labelsGroup = createSvgElement('g');
    const centerGroup = createSvgElement('g');
    const arrowGroup = createSvgElement('g');

    this.historyGroup = historyGroup;
    this.arrowGroup = arrowGroup;

    this.drawBackdrop(backdropGroup);
    this.drawSectors(sectorsGroup);
    this.drawLabels(labelsGroup);
    this.drawCenter(centerGroup);
    this.drawArrow(arrowGroup);

    this.svg.append(backdropGroup, historyGroup, sectorsGroup, labelsGroup, centerGroup, arrowGroup);

    const centerReadout = createSvgElement('text');
    centerReadout.setAttribute('x', String(this.center));
    centerReadout.setAttribute('y', String(this.center + 8));
    centerReadout.setAttribute('class', 'center-readout');
    centerReadout.textContent = 'C';
    this.centerReadout = centerReadout;

    this.svg.append(centerReadout);
    this.setTransposition(0);
  }

  setTransposition(shiftSemitones: number): void {
    const shiftedPitchClass = mod(shiftSemitones, 12);
    const rotationDeg = -shiftedPitchClass * 30;

    this.arrowGroup.setAttribute(
      'transform',
      `translate(${this.center} ${this.center}) rotate(${rotationDeg})`,
    );

    this.centerReadout.textContent = `C → ${NOTE_LABELS[shiftedPitchClass]}`;
  }

  setActivePitchClass(pitchClass: number | null): void {
    for (const path of this.sectorPaths) {
      path.classList.remove('sector-active');
    }

    if (pitchClass === null) {
      return;
    }

    const normalizedPitchClass = mod(pitchClass, 12);
    this.sectorPaths[normalizedPitchClass].classList.add('sector-active');
  }

  addHistoryLayer(pitchClass: number, durationUnits: number): void {
    const normalizedPitchClass = mod(pitchClass, 12);

    const layerThickness = Math.max(2.5, durationUnits * this.historyThicknessPerUnit);
    const consumed = this.consumedThicknessByPitch[normalizedPitchClass];

    const outerRadius = this.historyOuterRadius - consumed;
    const minInnerRadius = this.baseOuterRadius + 2;

    if (outerRadius <= minInnerRadius) {
      return;
    }

    const innerRadius = Math.max(minInnerRadius, outerRadius - layerThickness);

    const [startDeg, endDeg] = this.getSectorBounds(normalizedPitchClass);
    const layerPath = createSvgElement('path');

    layerPath.setAttribute('d', this.buildAnnularSectorPath(innerRadius, outerRadius, startDeg, endDeg, 16));
    layerPath.setAttribute('class', 'history-layer');
    layerPath.setAttribute('fill', NOTE_COLORS[normalizedPitchClass]);

    this.historyGroup.append(layerPath);
    this.consumedThicknessByPitch[normalizedPitchClass] = this.historyOuterRadius - innerRadius;
  }

  resetHistory(): void {
    this.historyGroup.replaceChildren();
    this.consumedThicknessByPitch.fill(0);
    this.setActivePitchClass(null);
  }

  private drawBackdrop(group: SVGGElement): void {
    const outerCircle = createSvgElement('circle');
    outerCircle.setAttribute('cx', String(this.center));
    outerCircle.setAttribute('cy', String(this.center));
    outerCircle.setAttribute('r', String(this.historyOuterRadius));
    outerCircle.setAttribute('class', 'outer-guide');

    const baseCircle = createSvgElement('circle');
    baseCircle.setAttribute('cx', String(this.center));
    baseCircle.setAttribute('cy', String(this.center));
    baseCircle.setAttribute('r', String(this.baseOuterRadius));
    baseCircle.setAttribute('class', 'base-guide');

    group.append(outerCircle, baseCircle);
  }

  private drawSectors(group: SVGGElement): void {
    for (let pitchClass = 0; pitchClass < 12; pitchClass += 1) {
      const [startDeg, endDeg] = this.getSectorBounds(pitchClass);
      const sector = createSvgElement('path');

      sector.setAttribute(
        'd',
        this.buildAnnularSectorPath(this.baseInnerRadius, this.baseOuterRadius, startDeg, endDeg, 20),
      );
      sector.setAttribute('class', 'note-sector');
      sector.setAttribute('fill', NOTE_COLORS[pitchClass]);

      this.sectorPaths[pitchClass] = sector;
      group.append(sector);
    }
  }

  private drawLabels(group: SVGGElement): void {
    for (let pitchClass = 0; pitchClass < 12; pitchClass += 1) {
      const centerDeg = this.getSectorCenter(pitchClass);
      const point = this.toCartesian(this.labelRadius, centerDeg);

      const label = createSvgElement('text');
      label.setAttribute('x', point.x.toFixed(2));
      label.setAttribute('y', point.y.toFixed(2));
      label.setAttribute('class', 'note-label');
      label.textContent = NOTE_LABELS[pitchClass];

      group.append(label);
    }
  }

  private drawCenter(group: SVGGElement): void {
    const innerCircle = createSvgElement('circle');
    innerCircle.setAttribute('cx', String(this.center));
    innerCircle.setAttribute('cy', String(this.center));
    innerCircle.setAttribute('r', '72');
    innerCircle.setAttribute('class', 'inner-circle');

    group.append(innerCircle);
  }

  private drawArrow(group: SVGGElement): void {
    const shaft = createSvgElement('line');
    shaft.setAttribute('x1', '0');
    shaft.setAttribute('y1', '0');
    shaft.setAttribute('x2', '64');
    shaft.setAttribute('y2', '0');
    shaft.setAttribute('class', 'arrow-shaft');

    const tip = createSvgElement('polygon');
    tip.setAttribute('points', '64,0 48,-8 48,8');
    tip.setAttribute('class', 'arrow-tip');

    const hub = createSvgElement('circle');
    hub.setAttribute('cx', '0');
    hub.setAttribute('cy', '0');
    hub.setAttribute('r', '6');
    hub.setAttribute('class', 'arrow-hub');

    group.append(shaft, tip, hub);
  }

  private getSectorCenter(pitchClass: number): number {
    return -pitchClass * 30;
  }

  private getSectorBounds(pitchClass: number): [number, number] {
    const centerDeg = this.getSectorCenter(pitchClass);
    return [centerDeg - 15, centerDeg + 15];
  }

  private buildAnnularSectorPath(
    innerRadius: number,
    outerRadius: number,
    startDeg: number,
    endDeg: number,
    steps: number,
  ): string {
    const outerPoints: Point[] = [];
    const innerPoints: Point[] = [];

    for (let step = 0; step <= steps; step += 1) {
      const ratio = step / steps;
      const angle = startDeg + (endDeg - startDeg) * ratio;
      outerPoints.push(this.toCartesian(outerRadius, angle));
    }

    for (let step = steps; step >= 0; step -= 1) {
      const ratio = step / steps;
      const angle = startDeg + (endDeg - startDeg) * ratio;
      innerPoints.push(this.toCartesian(innerRadius, angle));
    }

    const allPoints = [...outerPoints, ...innerPoints];

    return allPoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(' ') + ' Z';
  }

  private toCartesian(radius: number, angleDeg: number): Point {
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      x: this.center + radius * Math.cos(angleRad),
      y: this.center + radius * Math.sin(angleRad),
    };
  }
}
