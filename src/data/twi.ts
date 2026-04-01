/**
 * TWI (I2C) definitions and runtime config for ATmega32U4.
 *
 * Master + Slave modes. Pins: PD0=SCL (pin 17), PD1=SDA (pin 18).
 * Registers: TWBR, TWSR, TWCR, TWAR.
 */

export const F_CPU_DEFAULT = 16_000_000;

// -- Speed presets --------------------------------------------------------

export const TWI_SPEEDS: readonly [number, string][] = [
  [100_000, '100 kHz (Standard)'],
  [400_000, '400 kHz (Fast)'],
];

export const DEFAULT_SPEED_IDX = 0; // 100 kHz

// -- Prescaler (TWPS[1:0]) ------------------------------------------------

export interface TWIPrescalerOption {
  readonly twps: number;   // TWPS[1:0] value
  readonly div: number;    // prescaler value (1, 4, 16, 64)
  readonly label: string;
}

export const TWI_PRESCALERS: readonly TWIPrescalerOption[] = [
  { twps: 0b00, div:  1, label: '1'  },
  { twps: 0b01, div:  4, label: '4'  },
  { twps: 0b10, div: 16, label: '16' },
  { twps: 0b11, div: 64, label: '64' },
];

export const DEFAULT_PRESCALER_IDX = 0; // prescaler = 1

// -- Helpers --------------------------------------------------------------

/** TWBR = (F_CPU / SCL_freq - 16) / (2 * prescaler) */
export function calcTwbr(
  sclFreq: number, prescalerIdx: number = 0, fCpu: number = F_CPU_DEFAULT,
): number {
  const ps = TWI_PRESCALERS[prescalerIdx].div;
  const val = (fCpu / sclFreq - 16) / (2 * ps);
  return Math.max(0, Math.round(val));
}

/** Actual SCL frequency from TWBR value. */
export function calcActualScl(
  twbr: number, prescalerIdx: number = 0, fCpu: number = F_CPU_DEFAULT,
): number {
  const ps = TWI_PRESCALERS[prescalerIdx].div;
  const denom = 16 + 2 * ps * twbr;
  if (denom === 0) return 0;
  return fCpu / denom;
}

/** SCL frequency error in percent. */
export function calcSclError(
  sclFreq: number, prescalerIdx: number = 0, fCpu: number = F_CPU_DEFAULT,
): number {
  const twbr = calcTwbr(sclFreq, prescalerIdx, fCpu);
  const actual = calcActualScl(twbr, prescalerIdx, fCpu);
  if (sclFreq === 0) return 0;
  return (actual / sclFreq - 1) * 100;
}

export function fmtTwiInfo(
  sclFreq: number, prescalerIdx: number = 0, fCpu: number = F_CPU_DEFAULT,
): string {
  const twbr = calcTwbr(sclFreq, prescalerIdx, fCpu);
  const actual = calcActualScl(twbr, prescalerIdx, fCpu);
  const error = calcSclError(sclFreq, prescalerIdx, fCpu);
  const sign = error >= 0 ? '+' : '';
  return `TWBR = ${twbr}, stvarni SCL = ${(actual / 1000).toFixed(1)} kHz, gre\u0161ka = ${sign}${error.toFixed(1)}%`;
}

// -- Runtime config -------------------------------------------------------

export interface TWIConfig {
  enabled: boolean;
  isMaster: boolean;
  speedIdx: number;
  prescalerIdx: number;
  // Slave
  slaveAddr: number;       // 7-bit address (0-127)
  generalCall: boolean;    // TWGCE
  // Interrupt
  twiInt: boolean;         // TWIE
}

/** Get SCL frequency from config. */
export function configSclFreq(cfg: TWIConfig): number {
  return TWI_SPEEDS[cfg.speedIdx][0];
}

/** Check if TWI interrupts are enabled. */
export function twiHasInterrupts(cfg: TWIConfig): boolean {
  return cfg.twiInt;
}

export function makeTwiConfig(): TWIConfig {
  return {
    enabled: false,
    isMaster: true,
    speedIdx: DEFAULT_SPEED_IDX,
    prescalerIdx: DEFAULT_PRESCALER_IDX,
    slaveAddr: 0x50,
    generalCall: false,
    twiInt: false,
  };
}
