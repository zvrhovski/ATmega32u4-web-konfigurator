/**
 * SPI definitions and runtime config for ATmega32U4.
 *
 * Master + Slave modes. Pins: PB0=SS, PB1=SCK, PB2=MOSI, PB3=MISO.
 * Registers: SPCR, SPSR.
 */

export const F_CPU_DEFAULT = 16_000_000;

// -- SPI Mode (CPOL, CPHA) ------------------------------------------------

export interface SPIModeOption {
  readonly mode: number;    // 0-3
  readonly cpol: number;    // clock polarity
  readonly cpha: number;    // clock phase
  readonly label: string;
}

export const SPI_MODES: readonly SPIModeOption[] = [
  { mode: 0, cpol: 0, cpha: 0, label: 'Mode 0  (CPOL=0, CPHA=0)' },
  { mode: 1, cpol: 0, cpha: 1, label: 'Mode 1  (CPOL=0, CPHA=1)' },
  { mode: 2, cpol: 1, cpha: 0, label: 'Mode 2  (CPOL=1, CPHA=0)' },
  { mode: 3, cpol: 1, cpha: 1, label: 'Mode 3  (CPOL=1, CPHA=1)' },
];

// -- SPI Prescaler (SPR[1:0] + SPI2X) ------------------------------------

export interface SPIPrescalerOption {
  readonly spr: number;     // SPR[1:0] value
  readonly spi2x: number;   // SPI2X bit
  readonly div: number;     // prescaler divisor
  readonly label: string;
}

export const SPI_PRESCALERS: readonly SPIPrescalerOption[] = [
  { spr: 0b00, spi2x: 1, div:   2, label: '/2'   },
  { spr: 0b00, spi2x: 0, div:   4, label: '/4'   },
  { spr: 0b01, spi2x: 1, div:   8, label: '/8'   },
  { spr: 0b01, spi2x: 0, div:  16, label: '/16'  },
  { spr: 0b10, spi2x: 1, div:  32, label: '/32'  },
  { spr: 0b10, spi2x: 0, div:  64, label: '/64'  },
  { spr: 0b11, spi2x: 0, div: 128, label: '/128' },
];

export const DEFAULT_PRESCALER_IDX = 3; // /16

// -- Helpers --------------------------------------------------------------

export function spiClockHz(prescalerIdx: number, fCpu: number = F_CPU_DEFAULT): number {
  return Math.floor(fCpu / SPI_PRESCALERS[prescalerIdx].div);
}

export function fmtSpiClock(prescalerIdx: number, fCpu: number = F_CPU_DEFAULT): string {
  const hz = spiClockHz(prescalerIdx, fCpu);
  if (hz >= 1_000_000) return `${(hz / 1_000_000).toFixed(1)} MHz`;
  return `${(hz / 1_000).toFixed(0)} kHz`;
}

// -- Runtime config -------------------------------------------------------

export interface SPIConfig {
  enabled: boolean;
  isMaster: boolean;
  modeIdx: number;               // SPI Mode 0
  prescalerIdx: number;
  lsbFirst: boolean;             // DORD: false=MSB, true=LSB
  spiInt: boolean;               // SPIE
}

/** Check if SPI interrupts are enabled. */
export function spiHasInterrupts(cfg: SPIConfig): boolean {
  return cfg.spiInt;
}

export function makeSpiConfig(): SPIConfig {
  return {
    enabled: false,
    isMaster: true,
    modeIdx: 0,
    prescalerIdx: DEFAULT_PRESCALER_IDX,
    lsbFirst: false,
    spiInt: false,
  };
}
