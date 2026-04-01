/**
 * ADC definitions and runtime config for ATmega32U4.
 *
 * Single-ended: ADC0-ADC13, 1.1V bandgap, GND
 * Differential: various pairs with 1x/10x/200x gain
 * Registers:    ADMUX, ADCSRA, ADCSRB
 */

export const F_CPU_DEFAULT = 16_000_000; // 16 MHz

// -- Channel definition ---------------------------------------------------

export interface ADCChannelDef {
  readonly idx: number;         // unique index in ALL_ADC_CHANNELS
  readonly mux: number;         // MUX[4:0] value (lower 5 bits)
  readonly mux5: number;        // MUX5 bit (in ADCSRB)
  readonly label: string;       // display label
  readonly pinName: string;     // e.g. 'PF0' or '\u2014' for internal
  readonly pinNum: number;      // physical TQFP-44 pin, 0 if N/A
  readonly isDiff: boolean;     // true for differential channels
  readonly gain: number | null; // 1, 10, 200 or null for single-ended
}

// -- Single-ended channels ------------------------------------------------

const _se: [number, number, string, string, number][] = [
  [0x00, 0, 'ADC0',  'PF0', 40],
  [0x01, 0, 'ADC1',  'PF1', 39],
  [0x04, 0, 'ADC4',  'PF4', 38],
  [0x05, 0, 'ADC5',  'PF5', 37],
  [0x06, 0, 'ADC6',  'PF6', 36],
  [0x07, 0, 'ADC7',  'PF7', 35],
  [0x00, 1, 'ADC8',  'PD4', 24],
  [0x01, 1, 'ADC9',  'PD6', 25],
  [0x02, 1, 'ADC10', 'PD7', 26],
  [0x03, 1, 'ADC11', 'PB4', 27],
  [0x04, 1, 'ADC12', 'PB5', 28],
  [0x05, 1, 'ADC13', 'PB6', 29],
  [0x1E, 0, '1.1V Bandgap', '\u2014', 0],
  [0x1F, 0, 'GND',          '\u2014', 0],
];

export const SE_CHANNELS: readonly ADCChannelDef[] = _se.map(
  ([m, m5, l, p, pn], i) => ({
    idx: i, mux: m, mux5: m5, label: l, pinName: p,
    pinNum: pn, isDiff: false, gain: null,
  }),
);

const _SE_COUNT = SE_CHANNELS.length;

// -- Differential channels (ATmega32U4 datasheet Table 24-4) --------------

const _diff: [number, number, string, string, number, number][] = [
  // mux, mux5, label, pin_name, pin_num, gain
  [0x08, 0, 'ADC0\u2013ADC0 10\u00d7',   'PF0',       40, 10],
  [0x09, 0, 'ADC1\u2013ADC0 10\u00d7',   'PF0\u2013PF1', 0, 10],
  [0x0A, 0, 'ADC0\u2013ADC0 200\u00d7',  'PF0',       40, 200],
  [0x0B, 0, 'ADC1\u2013ADC0 200\u00d7',  'PF0\u2013PF1', 0, 200],
  [0x10, 0, 'ADC0\u2013ADC1 1\u00d7',    'PF0\u2013PF1', 0, 1],
  [0x11, 0, 'ADC1\u2013ADC1 1\u00d7',    'PF1',       39, 1],
  [0x14, 0, 'ADC4\u2013ADC1 1\u00d7',    'PF4\u2013PF1', 0, 1],
  [0x15, 0, 'ADC5\u2013ADC1 1\u00d7',    'PF5\u2013PF1', 0, 1],
  [0x16, 0, 'ADC6\u2013ADC1 1\u00d7',    'PF6\u2013PF1', 0, 1],
  [0x17, 0, 'ADC7\u2013ADC1 1\u00d7',    'PF7\u2013PF1', 0, 1],
  // MUX5 = 1 differential pairs
  [0x08, 1, 'ADC8\u2013ADC0 10\u00d7',   'PD4\u2013PF0', 0, 10],
  [0x09, 1, 'ADC9\u2013ADC0 10\u00d7',   'PD6\u2013PF0', 0, 10],
  [0x0A, 1, 'ADC8\u2013ADC0 200\u00d7',  'PD4\u2013PF0', 0, 200],
  [0x0B, 1, 'ADC9\u2013ADC0 200\u00d7',  'PD6\u2013PF0', 0, 200],
  [0x10, 1, 'ADC8\u2013ADC1 1\u00d7',    'PD4\u2013PF1', 0, 1],
  [0x11, 1, 'ADC9\u2013ADC1 1\u00d7',    'PD6\u2013PF1', 0, 1],
  [0x12, 1, 'ADC10\u2013ADC1 1\u00d7',   'PD7\u2013PF1', 0, 1],
  [0x13, 1, 'ADC11\u2013ADC1 1\u00d7',   'PB4\u2013PF1', 0, 1],
  [0x14, 1, 'ADC12\u2013ADC1 1\u00d7',   'PB5\u2013PF1', 0, 1],
  [0x15, 1, 'ADC13\u2013ADC1 1\u00d7',   'PB6\u2013PF1', 0, 1],
];

export const DIFF_CHANNELS: readonly ADCChannelDef[] = _diff.map(
  ([m, m5, l, p, pn, g], i) => ({
    idx: _SE_COUNT + i, mux: m, mux5: m5, label: l, pinName: p,
    pinNum: pn, isDiff: true, gain: g,
  }),
);

export const ALL_ADC_CHANNELS: readonly ADCChannelDef[] = [
  ...SE_CHANNELS,
  ...DIFF_CHANNELS,
];

// -- Voltage reference options (REFS[1:0] in ADMUX) -----------------------

export interface ADCRefOption {
  readonly refs: number;   // REFS[1:0] value
  readonly label: string;
}

export const ADC_REFS: readonly ADCRefOption[] = [
  { refs: 0b00, label: 'AREF (external)' },
  { refs: 0b01, label: 'AVCC (s kapacitetom na AREF)' },
  { refs: 0b11, label: 'Internal 2.56V (s kapacitetom na AREF)' },
];

// -- Prescaler options (ADPS[2:0] in ADCSRA) ------------------------------

export interface ADCPrescalerOption {
  readonly adps: number;   // ADPS[2:0] value
  readonly div: number;    // prescaler divisor
  readonly label: string;
}

export const ADC_PRESCALERS: readonly ADCPrescalerOption[] = [
  { adps: 0b001, div:   2, label: '/2   (8 MHz)' },
  { adps: 0b010, div:   4, label: '/4   (4 MHz)' },
  { adps: 0b011, div:   8, label: '/8   (2 MHz)' },
  { adps: 0b100, div:  16, label: '/16  (1 MHz)' },
  { adps: 0b101, div:  32, label: '/32  (500 kHz)' },
  { adps: 0b110, div:  64, label: '/64  (250 kHz)' },
  { adps: 0b111, div: 128, label: '/128 (125 kHz)  \u2014 preporu\u010deno' },
];

export const DEFAULT_PRESCALER_IDX = 6; // /128

// -- Helpers --------------------------------------------------------------

export function adcClockHz(prescalerIdx: number, fCpu: number = F_CPU_DEFAULT): number {
  return Math.floor(fCpu / ADC_PRESCALERS[prescalerIdx].div);
}

export function conversionTimeUs(prescalerIdx: number, fCpu: number = F_CPU_DEFAULT): number {
  /** Single conversion takes 13 ADC clock cycles (first: 25). */
  return 13 / adcClockHz(prescalerIdx, fCpu) * 1_000_000;
}

export function fmtAdcClock(prescalerIdx: number, fCpu: number = F_CPU_DEFAULT): string {
  const hz = adcClockHz(prescalerIdx, fCpu);
  if (hz >= 1_000_000) return `${(hz / 1_000_000).toFixed(1)} MHz`;
  return `${(hz / 1_000).toFixed(0)} kHz`;
}

// -- Runtime config -------------------------------------------------------

export interface ADCConfig {
  enabled: boolean;
  enabledChannels: Set<number>;  // set of ADCChannelDef.idx
  refIdx: number;                // default: AVCC
  prescalerIdx: number;          // default: /128
}

export function makeAdcConfig(): ADCConfig {
  return {
    enabled: false,
    enabledChannels: new Set(),
    refIdx: 1,                              // default: AVCC
    prescalerIdx: DEFAULT_PRESCALER_IDX,    // default: /128
  };
}
