/**
 * Timer definitions and runtime config for ATmega32U4.
 * Covers Timer0 (8-bit), Timer1 (16-bit), Timer3 (16-bit), Timer4 (10-bit HS).
 */

export const F_CPU_DEFAULT = 16_000_000; // Hz

// -- Static descriptors (frozen) ------------------------------------------

export interface WGMMode {
  readonly name: string;
  readonly wgm: number;              // WGM field value
  readonly top: string;              // "MAX8","MAX10","MAX16","OCRA","ICR","OCRC"
  readonly topFixed: number | null;  // null -> user sets TOP; number -> fixed
  readonly isPwm: boolean;
  readonly isPhase: boolean;         // phase-correct or phase+freq-correct
}

export interface CSOption {
  readonly label: string;
  readonly cs: number;
  readonly div: number;              // 0 = timer stopped
}

export interface OCChannel {
  readonly letter: string;           // 'A','B','C','D'
  readonly pinName: string;          // e.g. 'PB7'
  readonly pinNum: number;           // physical TQFP-44 pin
}

export interface TimerDef {
  readonly n: number;
  readonly bits: number;
  readonly label: string;            // display name
  readonly modes: readonly WGMMode[];
  readonly prescalers: readonly CSOption[];
  readonly channels: readonly OCChannel[];
}

// -- Timer 0 (8-bit) ------------------------------------------------------

export const T0_MODES: readonly WGMMode[] = [
  { name: 'Normal',                         wgm: 0, top: 'MAX8',  topFixed: 0xFF,  isPwm: false, isPhase: false },
  { name: 'CTC  (TOP = OCR0A)',             wgm: 2, top: 'OCRA',  topFixed: null,  isPwm: false, isPhase: false },
  { name: 'Fast PWM  (TOP = 0xFF)',         wgm: 3, top: 'MAX8',  topFixed: 0xFF,  isPwm: true,  isPhase: false },
  { name: 'Fast PWM  (TOP = OCR0A)',        wgm: 7, top: 'OCRA',  topFixed: null,  isPwm: true,  isPhase: false },
  { name: 'Phase Correct  (TOP = 0xFF)',    wgm: 1, top: 'MAX8',  topFixed: 0xFF,  isPwm: true,  isPhase: true  },
  { name: 'Phase Correct  (TOP = OCR0A)',   wgm: 5, top: 'OCRA',  topFixed: null,  isPwm: true,  isPhase: true  },
];

export const T0_CS: readonly CSOption[] = [
  { label: 'Stopped',      cs: 0, div: 0    },
  { label: 'clk / 1',      cs: 1, div: 1    },
  { label: 'clk / 8',      cs: 2, div: 8    },
  { label: 'clk / 64',     cs: 3, div: 64   },
  { label: 'clk / 256',    cs: 4, div: 256  },
  { label: 'clk / 1024',   cs: 5, div: 1024 },
  { label: 'Ext T0 ↓',     cs: 6, div: 0    },
  { label: 'Ext T0 ↑',     cs: 7, div: 0    },
];

export const TIMER0: TimerDef = {
  n: 0, bits: 8, label: 'Timer 0  (8-bit)',
  modes: T0_MODES, prescalers: T0_CS,
  channels: [
    { letter: 'A', pinName: 'PB7', pinNum: 11 },
    { letter: 'B', pinName: 'PD0', pinNum: 17 },
  ],
};

// -- Timer 1 (16-bit) -----------------------------------------------------

export const T13_MODES: readonly WGMMode[] = [
  { name: 'Normal',                              wgm: 0,  top: 'MAX16', topFixed: 0xFFFF, isPwm: false, isPhase: false },
  { name: 'CTC  (TOP = OCR1A)',                  wgm: 4,  top: 'OCRA',  topFixed: null,   isPwm: false, isPhase: false },
  { name: 'CTC  (TOP = ICR1)',                   wgm: 12, top: 'ICR',   topFixed: null,   isPwm: false, isPhase: false },
  { name: 'Fast PWM  8-bit  (TOP = 0x00FF)',     wgm: 5,  top: 'MAX8',  topFixed: 0xFF,   isPwm: true,  isPhase: false },
  { name: 'Fast PWM  9-bit  (TOP = 0x01FF)',     wgm: 6,  top: 'MAX9',  topFixed: 0x1FF,  isPwm: true,  isPhase: false },
  { name: 'Fast PWM  10-bit  (TOP = 0x03FF)',    wgm: 7,  top: 'MAX10', topFixed: 0x3FF,  isPwm: true,  isPhase: false },
  { name: 'Fast PWM  (TOP = ICR1)',              wgm: 14, top: 'ICR',   topFixed: null,   isPwm: true,  isPhase: false },
  { name: 'Fast PWM  (TOP = OCR1A)',             wgm: 15, top: 'OCRA',  topFixed: null,   isPwm: true,  isPhase: false },
  { name: 'Phase Correct  (TOP = ICR1)',         wgm: 10, top: 'ICR',   topFixed: null,   isPwm: true,  isPhase: true  },
  { name: 'Phase Correct  (TOP = OCR1A)',        wgm: 11, top: 'OCRA',  topFixed: null,   isPwm: true,  isPhase: true  },
  { name: 'Phase+Freq Correct  (TOP = ICR1)',    wgm: 8,  top: 'ICR',   topFixed: null,   isPwm: true,  isPhase: true  },
  { name: 'Phase+Freq Correct  (TOP = OCR1A)',   wgm: 9,  top: 'OCRA',  topFixed: null,   isPwm: true,  isPhase: true  },
];

export const T13_CS: readonly CSOption[] = [
  { label: 'Stopped',      cs: 0, div: 0    },
  { label: 'clk / 1',      cs: 1, div: 1    },
  { label: 'clk / 8',      cs: 2, div: 8    },
  { label: 'clk / 64',     cs: 3, div: 64   },
  { label: 'clk / 256',    cs: 4, div: 256  },
  { label: 'clk / 1024',   cs: 5, div: 1024 },
  { label: 'Ext T1 ↓',     cs: 6, div: 0    },
  { label: 'Ext T1 ↑',     cs: 7, div: 0    },
];

export const TIMER1: TimerDef = {
  n: 1, bits: 16, label: 'Timer 1  (16-bit)',
  modes: T13_MODES, prescalers: T13_CS,
  channels: [
    { letter: 'A', pinName: 'PB5', pinNum: 28 },
    { letter: 'B', pinName: 'PB6', pinNum: 29 },
    { letter: 'C', pinName: 'PB7', pinNum: 11 },
  ],
};

// -- Timer 3 (16-bit, same structure as Timer1) ----------------------------

export const TIMER3: TimerDef = {
  n: 3, bits: 16, label: 'Timer 3  (16-bit)',
  modes: T13_MODES, prescalers: T13_CS,
  channels: [
    { letter: 'A', pinName: 'PC6', pinNum: 30 },
  ],
};

// -- Timer 4 (10-bit high-speed) ------------------------------------------

export const T4_MODES: readonly WGMMode[] = [
  { name: 'Normal',                  wgm: 0, top: 'MAX10', topFixed: 0x3FF, isPwm: false, isPhase: false },
  { name: 'CTC  (TOP = OCR4C)',      wgm: 1, top: 'OCRC',  topFixed: null,  isPwm: false, isPhase: false },
  { name: 'Fast PWM  (TOP = OCR4C)', wgm: 2, top: 'OCRC',  topFixed: null,  isPwm: true,  isPhase: false },
  { name: 'Phase+Freq Correct',      wgm: 3, top: 'OCRC',  topFixed: null,  isPwm: true,  isPhase: true  },
];

export const T4_CS: readonly CSOption[] = [
  { label: 'Stopped',       cs: 0,  div: 0     },
  { label: 'clk / 1',       cs: 1,  div: 1     },
  { label: 'clk / 2',       cs: 2,  div: 2     },
  { label: 'clk / 4',       cs: 3,  div: 4     },
  { label: 'clk / 8',       cs: 4,  div: 8     },
  { label: 'clk / 16',      cs: 5,  div: 16    },
  { label: 'clk / 32',      cs: 6,  div: 32    },
  { label: 'clk / 64',      cs: 7,  div: 64    },
  { label: 'clk / 128',     cs: 8,  div: 128   },
  { label: 'clk / 256',     cs: 9,  div: 256   },
  { label: 'clk / 512',     cs: 10, div: 512   },
  { label: 'clk / 1024',    cs: 11, div: 1024  },
  { label: 'clk / 2048',    cs: 12, div: 2048  },
  { label: 'clk / 4096',    cs: 13, div: 4096  },
  { label: 'clk / 8192',    cs: 14, div: 8192  },
  { label: 'clk / 16384',   cs: 15, div: 16384 },
];

export const TIMER4: TimerDef = {
  n: 4, bits: 10, label: 'Timer 4  (10-bit HS)',
  modes: T4_MODES, prescalers: T4_CS,
  channels: [
    { letter: 'A', pinName: 'PC6', pinNum: 30 },
    { letter: 'B', pinName: 'PB6', pinNum: 29 },
    { letter: 'D', pinName: 'PD7', pinNum: 26 },
  ],
};

export const ALL_TIMERS: readonly TimerDef[] = [TIMER0, TIMER1, TIMER3, TIMER4];

export const TIMER_MAP: ReadonlyMap<number, TimerDef> = new Map(
  ALL_TIMERS.map(t => [t.n, t]),
);

// -- PLL for Timer 4 ------------------------------------------------------

export const PLL_FREQ = 96_000_000; // PLL output: 96 MHz (8 MHz x 12, PDIV=1010)

export interface PLLTMOption {
  readonly plltm: number;      // PLLTM[1:0] value
  readonly label: string;
  readonly clockHz: number;    // Timer 4 clock frequency (0 = disabled)
}

export const PLL_TM_OPTIONS: readonly PLLTMOption[] = [
  { plltm: 0b00, label: 'PLL off (koristi F_CPU)',   clockHz: 0          },
  { plltm: 0b01, label: '96 MHz  (PLL / 1)',         clockHz: 96_000_000 },
  { plltm: 0b10, label: '64 MHz  (PLL / 1.5)',       clockHz: 64_000_000 },
  { plltm: 0b11, label: '48 MHz  (PLL / 2)',         clockHz: 48_000_000 },
];

// -- Runtime configuration ------------------------------------------------

export interface ChannelConfig {
  enabled: boolean;
  ocr: number;
  com: number; // 0=disconnected, 1=toggle, 2=non-inv/clear, 3=inv/set
}

export interface TimerConfig {
  enabled: boolean;
  modeIdx: number;
  prescalerIdx: number;
  top: number;
  // Normal mode extras
  tcnt: number;       // initial counter value (preload)
  toie: boolean;      // overflow interrupt enable
  // CTC mode extras
  ocie: boolean;      // output compare interrupt enable (OCIEnA)
  // PLL (Timer 4 only)
  pllEnabled: boolean;
  pllTmIdx: number;   // index into PLL_TM_OPTIONS
  // Channel configs keyed by letter
  channels: Record<string, ChannelConfig>;
}

export function makeChannelConfig(): ChannelConfig {
  return { enabled: false, ocr: 0, com: 0 };
}

export function makeTimerConfig(): TimerConfig {
  return {
    enabled: false,
    modeIdx: 0,
    prescalerIdx: 0,
    top: 255,
    tcnt: 0,
    toie: false,
    ocie: false,
    pllEnabled: false,
    pllTmIdx: 1,   // default: 96 MHz (index 1 into PLL_TM_OPTIONS)
    channels: {},
  };
}

/** Get (or lazily create) a channel config by letter. */
export function getChannelConfig(cfg: TimerConfig, letter: string): ChannelConfig {
  if (!cfg.channels[letter]) {
    cfg.channels[letter] = makeChannelConfig();
  }
  return cfg.channels[letter];
}

export function makeTimerConfigs(): Record<number, TimerConfig> {
  const out: Record<number, TimerConfig> = {};
  for (const t of ALL_TIMERS) {
    out[t.n] = makeTimerConfig();
  }
  return out;
}

// -- Frequency / duty helpers ---------------------------------------------

export function effectiveTop(tdef: TimerDef, cfg: TimerConfig): number | null {
  const mode = tdef.modes[cfg.modeIdx];
  return mode.topFixed !== null ? mode.topFixed : cfg.top;
}

export function calcFreq(
  tdef: TimerDef, cfg: TimerConfig, fCpu: number = F_CPU_DEFAULT,
): number | null {
  /** Return timer base frequency (PWM/OVF) in Hz, or null if stopped. */
  const cs = tdef.prescalers[cfg.prescalerIdx];
  if (cs.div === 0) return null;
  const mode = tdef.modes[cfg.modeIdx];
  const top = effectiveTop(tdef, cfg);
  if (top === null || top === 0) return null;
  const N = cs.div;
  if (!mode.isPwm) {
    if (mode.wgm === 0) {            // Normal — overflow frequency
      return fCpu / (N * (top + 1));
    }
    return fCpu / (N * (top + 1));   // CTC — compare match frequency
  }
  if (mode.isPhase) {
    return fCpu / (N * 2 * top);
  }
  return fCpu / (N * (top + 1));
}

export function calcOverflowTime(
  tdef: TimerDef, cfg: TimerConfig, fCpu: number = F_CPU_DEFAULT,
): number | null {
  /** Return Normal-mode overflow period in seconds given TCNTn preload. */
  const cs = tdef.prescalers[cfg.prescalerIdx];
  if (cs.div === 0) return null;
  const maxVal = (1 << tdef.bits) - 1;     // 255 / 65535 / 1023
  const counts = maxVal - cfg.tcnt + 1;    // ticks until overflow
  return counts * cs.div / fCpu;
}

export function fmtPeriod(sec: number | null): string {
  /** Format a period in seconds to a human-readable string. */
  if (sec === null) return '— (stopped)';
  if (sec >= 1.0)   return `${sec.toFixed(4)} s`;
  if (sec >= 1e-3)  return `${(sec * 1e3).toFixed(3)} ms`;
  if (sec >= 1e-6)  return `${(sec * 1e6).toFixed(2)} µs`;
  return `${(sec * 1e9).toFixed(1)} ns`;
}

export function calcDuty(ocr: number, top: number): number {
  if (top === 0) return 0.0;
  return Math.min(ocr / top * 100.0, 100.0);
}

export function fmtFreq(hz: number | null): string {
  if (hz === null) return '— (stopped)';
  if (hz >= 1_000_000) return `${(hz / 1_000_000).toFixed(3)} MHz`;
  if (hz >= 1_000)     return `${(hz / 1_000).toFixed(3)} kHz`;
  return `${hz.toFixed(2)} Hz`;
}
