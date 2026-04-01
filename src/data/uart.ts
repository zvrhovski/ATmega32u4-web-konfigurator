/**
 * USART1 definitions and runtime config for ATmega32U4.
 *
 * Async mode only. Pins: PD2=RXD1 (pin 19), PD3=TXD1 (pin 20).
 * Registers: UCSR1A, UCSR1B, UCSR1C, UBRR1H, UBRR1L.
 */

export const F_CPU_DEFAULT = 16_000_000; // 16 MHz

// -- Baud rate helpers ----------------------------------------------------

export function calcUbrr(baud: number, u2x: boolean = false, fCpu: number = F_CPU_DEFAULT): number {
  /** Calculate UBRR value for given baud rate. */
  const divisor = u2x ? 8 : 16;
  return Math.round(fCpu / (divisor * baud) - 1);
}

export function calcActualBaud(ubrr: number, u2x: boolean = false, fCpu: number = F_CPU_DEFAULT): number {
  /** Actual baud rate for a given UBRR value. */
  const divisor = u2x ? 8 : 16;
  return fCpu / (divisor * (ubrr + 1));
}

export function calcBaudError(baud: number, u2x: boolean = false, fCpu: number = F_CPU_DEFAULT): number {
  /** Baud rate error in percent. */
  const ubrr = calcUbrr(baud, u2x, fCpu);
  const actual = calcActualBaud(ubrr, u2x, fCpu);
  return (actual / baud - 1) * 100;
}

export function fmtBaudInfo(baud: number, u2x: boolean = false, fCpu: number = F_CPU_DEFAULT): string {
  /** Human-readable baud info with UBRR and error. */
  const ubrr = calcUbrr(baud, u2x, fCpu);
  const actual = calcActualBaud(ubrr, u2x, fCpu);
  const error = calcBaudError(baud, u2x, fCpu);
  const sign = error >= 0 ? '+' : '';
  return `UBRR = ${ubrr}, stvarni baud = ${actual.toFixed(0)}, gre\u0161ka = ${sign}${error.toFixed(1)}%`;
}

// -- Standard baud rates --------------------------------------------------

export const BAUD_RATES = [2400, 4800, 9600, 14400, 19200, 28800, 38400, 57600, 76800, 115200] as const;

export const DEFAULT_BAUD_IDX = 2; // 9600

// -- Data bits (UCSZ1[2:0]) -----------------------------------------------

export interface DataBitsOption {
  readonly bits: number;   // 5, 6, 7, 8, 9
  readonly ucsz: number;   // UCSZ1[2:0] value (0-7)
  readonly label: string;
}

export const DATA_BITS_OPTIONS: readonly DataBitsOption[] = [
  { bits: 5, ucsz: 0b000, label: '5-bit' },
  { bits: 6, ucsz: 0b001, label: '6-bit' },
  { bits: 7, ucsz: 0b010, label: '7-bit' },
  { bits: 8, ucsz: 0b011, label: '8-bit' },
  { bits: 9, ucsz: 0b111, label: '9-bit' },
];

export const DEFAULT_DATABITS_IDX = 3; // 8-bit

// -- Parity (UPM1[1:0]) ---------------------------------------------------

export interface ParityOption {
  readonly upm: number;    // UPM1[1:0] value
  readonly label: string;
  readonly code: string;   // for display: N, E, O
}

export const PARITY_OPTIONS: readonly ParityOption[] = [
  { upm: 0b00, label: 'Disabled (None)', code: 'N' },
  { upm: 0b10, label: 'Even',            code: 'E' },
  { upm: 0b11, label: 'Odd',             code: 'O' },
];

export const DEFAULT_PARITY_IDX = 0; // None

// -- Stop bits (USBS1) ----------------------------------------------------

export interface StopBitsOption {
  readonly usbs: number;   // USBS1 bit value (0 or 1)
  readonly label: string;
}

export const STOP_BITS_OPTIONS: readonly StopBitsOption[] = [
  { usbs: 0, label: '1 stop bit'  },
  { usbs: 1, label: '2 stop bits' },
];

export const DEFAULT_STOPBITS_IDX = 0; // 1 stop

// -- Runtime config -------------------------------------------------------

export interface USARTConfig {
  enabled: boolean;
  baudIdx: number;
  databitsIdx: number;
  parityIdx: number;
  stopbitsIdx: number;
  txEn: boolean;
  rxEn: boolean;
  u2x: boolean;
  // Interrupt enables
  rxcie: boolean;    // RX Complete Interrupt Enable
  txcie: boolean;    // TX Complete Interrupt Enable
  udrie: boolean;    // Data Register Empty Interrupt Enable
}

/** Get the baud rate from config. */
export function configBaud(cfg: USARTConfig): number {
  return BAUD_RATES[cfg.baudIdx];
}

/** Calculate UBRR from config. */
export function configUbrr(cfg: USARTConfig, fCpu: number = F_CPU_DEFAULT): number {
  return calcUbrr(configBaud(cfg), cfg.u2x, fCpu);
}

/** Format string e.g. '8N1' or '7E2'. */
export function configFormatStr(cfg: USARTConfig): string {
  const db = DATA_BITS_OPTIONS[cfg.databitsIdx];
  const par = PARITY_OPTIONS[cfg.parityIdx];
  const sb = STOP_BITS_OPTIONS[cfg.stopbitsIdx];
  return `${db.bits}${par.code}${1 + sb.usbs}`;
}

/** Check if any USART interrupts are enabled. */
export function configHasInterrupts(cfg: USARTConfig): boolean {
  return cfg.rxcie || cfg.txcie || cfg.udrie;
}

export function makeUartConfig(): USARTConfig {
  return {
    enabled: false,
    baudIdx: DEFAULT_BAUD_IDX,
    databitsIdx: DEFAULT_DATABITS_IDX,
    parityIdx: DEFAULT_PARITY_IDX,
    stopbitsIdx: DEFAULT_STOPBITS_IDX,
    txEn: true,
    rxEn: true,
    u2x: false,
    rxcie: false,
    txcie: false,
    udrie: false,
  };
}
