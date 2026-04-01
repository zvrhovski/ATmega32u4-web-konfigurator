import { useState, useMemo } from 'react';
import {
  ALL_PINS,
  PinDef,
  PinConfig,
  PinType,
  GpioMode,
  pinSide,
  pinSideIndex,
} from '../data/pins';

interface ChipViewProps {
  pinConfigs: Record<number, PinConfig>;
  selectedPin: number | null;
  onPinSelect: (pin: number | null) => void;
}

// Layout constants
const SVG_W = 500;
const SVG_H = 500;
const BODY_X = 120;
const BODY_Y = 120;
const BODY_W = 260;
const BODY_H = 260;
const PIN_LEN = 28;
const PIN_W = 12;
const PIN_SPACING = 22;
const LABEL_OFFSET = 18;
const PINS_PER_SIDE = 11;

function pinColor(pdef: PinDef, cfg: PinConfig | undefined): string {
  switch (pdef.pinType) {
    case PinType.POWER:  return '#ef4444'; // red
    case PinType.USB:    return '#a855f7'; // purple
    case PinType.CLOCK:  return '#f97316'; // orange
    case PinType.RESET:  return '#ec4899'; // pink
    case PinType.REF:    return '#14b8a6'; // teal
    case PinType.GPIO: {
      if (!cfg || cfg.mode === GpioMode.UNCONFIGURED) return '#6b7280'; // gray
      if (cfg.mode === GpioMode.INPUT || cfg.mode === GpioMode.INPUT_PULLUP)
        return '#3b82f6'; // blue
      return '#22c55e'; // green (output)
    }
    default:
      return '#6b7280';
  }
}

interface PinPos {
  // Pin rectangle position and size
  rx: number;
  ry: number;
  rw: number;
  rh: number;
  // Label position and anchor
  lx: number;
  ly: number;
  anchor: string;
  rotate?: number;
}

function calcPinPos(pdef: PinDef): PinPos {
  const side = pinSide(pdef);
  const idx = pinSideIndex(pdef);

  // Starting offset so pins are centered on each side
  const startOffset = (BODY_W - PINS_PER_SIDE * PIN_SPACING) / 2 + (PIN_SPACING - PIN_W) / 2;

  switch (side) {
    case 'left': {
      const x = BODY_X - PIN_LEN;
      const y = BODY_Y + startOffset + idx * PIN_SPACING;
      return {
        rx: x, ry: y, rw: PIN_LEN, rh: PIN_W,
        lx: x - LABEL_OFFSET + 10, ly: y + PIN_W / 2,
        anchor: 'end',
      };
    }
    case 'bottom': {
      const x = BODY_X + startOffset + idx * PIN_SPACING;
      const y = BODY_Y + BODY_H;
      return {
        rx: x, ry: y, rw: PIN_W, rh: PIN_LEN,
        lx: x + PIN_W / 2, ly: y + PIN_LEN + LABEL_OFFSET - 6,
        anchor: 'end',
        rotate: -90,
      };
    }
    case 'right': {
      const x = BODY_X + BODY_W;
      // Right side goes bottom to top
      const y = BODY_Y + BODY_H - startOffset - idx * PIN_SPACING - PIN_W;
      return {
        rx: x, ry: y, rw: PIN_LEN, rh: PIN_W,
        lx: x + PIN_LEN + LABEL_OFFSET - 10, ly: y + PIN_W / 2,
        anchor: 'start',
      };
    }
    case 'top': {
      // Top side goes right to left
      const x = BODY_X + BODY_W - startOffset - idx * PIN_SPACING - PIN_W;
      const y = BODY_Y - PIN_LEN;
      return {
        rx: x, ry: y, rw: PIN_W, rh: PIN_LEN,
        lx: x + PIN_W / 2, ly: y - LABEL_OFFSET + 10,
        anchor: 'start',
        rotate: -90,
      };
    }
  }
}

function PinElement({
  pdef,
  pos,
  color,
  isSelected,
  onSelect,
  onHover,
  onLeave,
}: {
  pdef: PinDef;
  pos: PinPos;
  color: string;
  isSelected: boolean;
  onSelect: () => void;
  onHover: () => void;
  onLeave: () => void;
}) {
  return (
    <g
      className="cursor-pointer"
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <rect
        x={pos.rx}
        y={pos.ry}
        width={pos.rw}
        height={pos.rh}
        fill={color}
        stroke={isSelected ? '#fbbf24' : '#374151'}
        strokeWidth={isSelected ? 2 : 1}
        rx={1}
      />
      <text
        x={pos.lx}
        y={pos.ly}
        textAnchor={pos.anchor as 'start' | 'middle' | 'end'}
        dominantBaseline="central"
        fill="#d1d5db"
        fontSize={8}
        fontFamily="monospace"
        transform={pos.rotate ? `rotate(${pos.rotate}, ${pos.lx}, ${pos.ly})` : undefined}
      >
        {pdef.name}
      </text>
      {/* Pin number */}
      <text
        x={pos.rx + pos.rw / 2}
        y={pos.ry + pos.rh / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize={7}
        fontFamily="monospace"
        fontWeight="bold"
        pointerEvents="none"
      >
        {pdef.number}
      </text>
    </g>
  );
}

export default function ChipView({ pinConfigs, selectedPin, onPinSelect }: ChipViewProps) {
  const [hoveredPin, setHoveredPin] = useState<PinDef | null>(null);

  const pinPositions = useMemo(() => {
    const map = new Map<number, PinPos>();
    for (const p of ALL_PINS) {
      map.set(p.number, calcPinPos(p));
    }
    return map;
  }, []);

  const hoveredCfg = hoveredPin ? pinConfigs[hoveredPin.number] : undefined;

  return (
    <div className="relative flex items-center justify-center h-full bg-gray-900">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full h-full max-w-[500px] max-h-[500px]"
      >
        {/* Chip body */}
        <rect
          x={BODY_X}
          y={BODY_Y}
          width={BODY_W}
          height={BODY_H}
          fill="#1f2937"
          stroke="#4b5563"
          strokeWidth={2}
          rx={4}
        />
        {/* Dot marker (pin 1 indicator) */}
        <circle cx={BODY_X + 16} cy={BODY_Y + 16} r={5} fill="#4b5563" />
        {/* Chip label */}
        <text
          x={BODY_X + BODY_W / 2}
          y={BODY_Y + BODY_H / 2 - 10}
          textAnchor="middle"
          fill="#6b7280"
          fontSize={14}
          fontFamily="monospace"
          fontWeight="bold"
        >
          ATmega32U4
        </text>
        <text
          x={BODY_X + BODY_W / 2}
          y={BODY_Y + BODY_H / 2 + 10}
          textAnchor="middle"
          fill="#4b5563"
          fontSize={10}
          fontFamily="monospace"
        >
          TQFP-44
        </text>

        {/* Pins */}
        {ALL_PINS.map(pdef => {
          const pos = pinPositions.get(pdef.number)!;
          const cfg = pinConfigs[pdef.number];
          const color = pinColor(pdef, cfg);
          const isSelected = selectedPin === pdef.number;

          return (
            <PinElement
              key={pdef.number}
              pdef={pdef}
              pos={pos}
              color={color}
              isSelected={isSelected}
              onSelect={() => onPinSelect(pdef.number)}
              onHover={() => setHoveredPin(pdef)}
              onLeave={() => setHoveredPin(null)}
            />
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredPin && (
        <div
          className="absolute bottom-2 left-2 bg-gray-800 border border-gray-600 rounded
                     px-3 py-2 text-xs text-gray-200 pointer-events-none shadow-lg z-10"
        >
          <p className="font-mono font-bold text-blue-400">
            Pin {hoveredPin.number}: {hoveredPin.name}
          </p>
          <p className="text-gray-400">{hoveredPin.pinType}</p>
          {hoveredPin.altFunctions.length > 0 && (
            <p className="text-yellow-400 font-mono">
              {hoveredPin.altFunctions.join(', ')}
            </p>
          )}
          {hoveredCfg && hoveredCfg.mode !== GpioMode.UNCONFIGURED && (
            <p className="text-green-400">{hoveredCfg.mode}</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div
        className="absolute top-2 right-2 bg-gray-800/90 border border-gray-700 rounded
                   px-2 py-1.5 text-[9px] space-y-0.5 pointer-events-none"
      >
        {[
          ['#6b7280', 'Unconfigured'],
          ['#3b82f6', 'Input'],
          ['#22c55e', 'Output'],
          ['#ef4444', 'Power'],
          ['#a855f7', 'USB'],
          ['#f97316', 'Clock'],
        ].map(([c, l]) => (
          <div key={l} className="flex items-center gap-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: c }}
            />
            <span className="text-gray-300">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
