/**
 * External interrupt definitions and config for ATmega32U4.
 *
 * INT0-INT3, INT6  ->  EICRA / EICRB / EIMSK
 * PCINT0-7         ->  PCICR / PCMSK0
 */

// -- Sense control options (ISCx1:ISCx0) ----------------------------------

export const SENSE_OPTIONS: readonly [number, string][] = [
  [0b00, 'Low level'],
  [0b01, 'Any change'],
  [0b10, 'Falling edge'],
  [0b11, 'Rising edge'],
];

// -- Static descriptor ----------------------------------------------------

export interface ExtIntDef {
  readonly n: number;          // interrupt number: 0,1,2,3,6
  readonly pinName: string;    // e.g. 'PD0'
  readonly pinNum: number;     // physical TQFP-44 pin
  readonly eicrReg: string;    // 'EICRA' or 'EICRB'
  readonly iscBit: number;     // LSB position of ISCn0 in the register (ISCn1 = iscBit+1)
  readonly eimskBit: number;   // bit position in EIMSK
}

export const EXT_INTS: readonly ExtIntDef[] = [
  { n: 0, pinName: 'PD0', pinNum: 17, eicrReg: 'EICRA', iscBit: 0, eimskBit: 0 },
  { n: 1, pinName: 'PD1', pinNum: 18, eicrReg: 'EICRA', iscBit: 2, eimskBit: 1 },
  { n: 2, pinName: 'PD2', pinNum: 19, eicrReg: 'EICRA', iscBit: 4, eimskBit: 2 },
  { n: 3, pinName: 'PD3', pinNum: 20, eicrReg: 'EICRA', iscBit: 6, eimskBit: 3 },
  { n: 6, pinName: 'PE6', pinNum:  1, eicrReg: 'EICRB', iscBit: 4, eimskBit: 6 },
];

export const EXT_INT_MAP: ReadonlyMap<number, ExtIntDef> = new Map(
  EXT_INTS.map(e => [e.n, e]),
);

// -- PCINT group (Port B only on ATmega32U4) ------------------------------

export interface PCIntPinDef {
  readonly pcintN: number;   // PCINT0-7
  readonly pinName: string;
  readonly pinNum: number;
}

export const PCINT_PINS: readonly PCIntPinDef[] = [
  { pcintN: 0, pinName: 'PB0', pinNum:  7 },
  { pcintN: 1, pinName: 'PB1', pinNum:  8 },
  { pcintN: 2, pinName: 'PB2', pinNum:  9 },
  { pcintN: 3, pinName: 'PB3', pinNum: 10 },
  { pcintN: 4, pinName: 'PB4', pinNum: 27 },
  { pcintN: 5, pinName: 'PB5', pinNum: 28 },
  { pcintN: 6, pinName: 'PB6', pinNum: 29 },
  { pcintN: 7, pinName: 'PB7', pinNum: 11 },
];

// -- Runtime config -------------------------------------------------------

export interface ExtIntConfig {
  enabled: boolean;
  sense: number;           // default: falling edge (0b10)
}

export interface PCIntConfig {
  groupEnabled: boolean;
  pins: Record<number, boolean>;
}

export interface InterruptConfig {
  ext: Record<number, ExtIntConfig>;
  pcint: PCIntConfig;
  sei: boolean;            // add sei() at end of init
}

export function makeExtIntConfig(): ExtIntConfig {
  return { enabled: false, sense: 0b10 };
}

export function makePcIntConfig(): PCIntConfig {
  const pins: Record<number, boolean> = {};
  for (const p of PCINT_PINS) {
    pins[p.pcintN] = false;
  }
  return { groupEnabled: false, pins };
}

export function makeInterruptConfig(): InterruptConfig {
  const ext: Record<number, ExtIntConfig> = {};
  for (const e of EXT_INTS) {
    ext[e.n] = makeExtIntConfig();
  }
  return {
    ext,
    pcint: makePcIntConfig(),
    sei: false,
  };
}
