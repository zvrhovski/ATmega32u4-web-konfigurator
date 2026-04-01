/**
 * Timer code generation — ported from code_gen.py timer section
 */

import {
  TimerDef, TimerConfig, ALL_TIMERS, TIMER_MAP,
  calcFreq, calcDuty, fmtFreq, fmtPeriod,
  calcOverflowTime, effectiveTop, F_CPU_DEFAULT,
  PLL_TM_OPTIONS, WGMMode, CSOption,
} from '../data/timers';
import { join, comBits, csBits } from './index';

export function timerSection(
  timerConfigs: Record<number, TimerConfig>,
  fCpu: number = F_CPU_DEFAULT,
): string[] {
  const lines: string[] = [];
  for (const tdef of ALL_TIMERS) {
    const cfg = timerConfigs[tdef.n];
    if (!cfg || !cfg.enabled) {
      continue;
    }
    lines.push('');
    lines.push(...timerRegs(tdef, cfg, fCpu));
  }
  return lines;
}

function timerRegs(
  tdef: TimerDef, cfg: TimerConfig, fCpu: number = F_CPU_DEFAULT,
): string[] {
  const mode = tdef.modes[cfg.modeIdx];
  const cs   = tdef.prescalers[cfg.prescalerIdx];
  let top    = effectiveTop(tdef, cfg);
  if (top === null) {
    top = cfg.top;
  }

  // Effective clock: PLL for Timer 4, or F_CPU
  let effClk = fCpu;
  if (tdef.n === 4 && cfg.pllEnabled) {
    const pllOpt = PLL_TM_OPTIONS[cfg.pllTmIdx];
    if (pllOpt.clockHz > 0) {
      effClk = pllOpt.clockHz;
    }
  }

  const hz = calcFreq(tdef, cfg, effClk);
  const freqStr = fmtFreq(hz);

  const lines: string[] = [
    `    /* ---- Timer ${tdef.n} (${tdef.label})  |  ${mode.name}  |  ${cs.label}  |  ${freqStr} ---- */`,
  ];

  // PLL setup for Timer 4
  if (tdef.n === 4 && cfg.pllEnabled) {
    lines.push(...t4PllRegs(cfg, fCpu));
  }

  if (tdef.n === 0) {
    lines.push(...t0Regs(mode, cfg, top, cs));
  } else if (tdef.n === 1 || tdef.n === 3) {
    lines.push(...t13Regs(tdef.n, mode, cfg, top, cs));
  } else if (tdef.n === 4) {
    lines.push(...t4Regs(mode, cfg, top, cs));
  }

  lines.push(...normalModeExtras(tdef, mode, cfg, fCpu));
  lines.push(...ctcModeExtras(tdef, mode, cfg));

  // Configure OC pins as output (DDRx) for any enabled channel with COM != 0
  for (const chDef of tdef.channels) {
    const ch = cfg.channels[chDef.letter];
    if (ch && ch.enabled && ch.com > 0) {
      const port = chDef.pinName[1]; // e.g. 'PB7' -> 'B'
      const bit  = chDef.pinName[2]; // e.g. 'PB7' -> '7'
      lines.push(
        `    DDR${port}  |= (1<<P${port}${bit});` +
        `  /* OC${tdef.n}${chDef.letter} (${chDef.pinName}, pin ${chDef.pinNum}) output */`
      );
    }
  }

  // External clock (counter mode) -- Tn pin as input
  // T0=PD7 (pin 26), T1=PD6 (pin 25)
  const EXT_CLK_PINS: Record<number, [string, string, string, number]> = {
    0: ['D', '7', 'PD7', 26],
    1: ['D', '6', 'PD6', 25],
  };
  if ((cs.cs === 6 || cs.cs === 7) && tdef.n in EXT_CLK_PINS) {
    const [port, bit, pname, pnum] = EXT_CLK_PINS[tdef.n];
    const edge = cs.cs === 6 ? 'silazni brid' : 'uzlazni brid';
    lines.push(
      `    DDR${port}  &= ~(1<<P${port}${bit});` +
      `  /* T${tdef.n} (${pname}, pin ${pnum}) input \u2014 ${edge} */`
    );
  }

  return lines;
}

export function t4PllRegs(cfg: TimerConfig, fCpu: number): string[] {
  const pllOpt = PLL_TM_OPTIONS[cfg.pllTmIdx];
  const lines: string[] = [];

  // PLLCSR: PINDIV + PLLE
  const pllcsrBits = ['(1<<PLLE)'];
  if (fCpu > 8_000_000) {
    pllcsrBits.push('(1<<PINDIV)');
    lines.push(`    PLLCSR = ${join(pllcsrBits)};  /* PLL enable, \u00f72 \u2192 8 MHz ulaz */`);
  } else {
    lines.push(`    PLLCSR = ${join(pllcsrBits)};  /* PLL enable, 8 MHz ulaz */`);
  }

  // Wait for PLL lock
  lines.push(`    while (!(PLLCSR & (1<<PLOCK)));  /* \u010dekaj PLL lock */`);

  // PLLFRQ: PDIV=1010 (96 MHz = 8 MHz x 12), PLLTM, PLLUSB
  const pllfrqBits = ['(1<<PDIV3)', '(1<<PDIV1)'];  // PDIV=1010 -> 96 MHz

  // PLLUSB: 96 MHz / 2 = 48 MHz za USB
  pllfrqBits.push('(1<<PLLUSB)');

  // PLLTM: Timer 4 clock postscaler
  const plltm = pllOpt.plltm;
  if (plltm & 0x02) {
    pllfrqBits.push('(1<<PLLTM1)');
  }
  if (plltm & 0x01) {
    pllfrqBits.push('(1<<PLLTM0)');
  }

  lines.push(`    PLLFRQ = ${join(pllfrqBits)};  /* 96 MHz PLL, USB=48 MHz, T4: ${pllOpt.label} */`);

  return lines;
}

export function normalModeExtras(
  tdef: TimerDef, mode: WGMMode, cfg: TimerConfig, fCpu: number = F_CPU_DEFAULT,
): string[] {
  if (mode.wgm !== 0) {  // only Normal mode
    return [];
  }
  const lines: string[] = [];
  const n = tdef.n;
  const t = calcOverflowTime(tdef, cfg, fCpu);
  const periodStr = t ? fmtPeriod(t) : '\u2014';

  if (cfg.tcnt > 0) {
    lines.push(`    TCNT${n}  = ${cfg.tcnt};  /* overflow in ${periodStr} */`);
  }
  if (cfg.toie) {
    lines.push(`    TIMSK${n} |= (1<<TOIE${n});  /* overflow interrupt */`);
  }
  return lines;
}

export function ctcModeExtras(
  tdef: TimerDef, mode: WGMMode, cfg: TimerConfig,
): string[] {
  if (!mode.name.includes('CTC')) {
    return [];
  }
  if (!cfg.ocie) {
    return [];
  }
  const n = tdef.n;
  return [`    TIMSK${n} |= (1<<OCIE${n}A);  /* compare match interrupt */`];
}

// ── Timer 0 ────────────────────────────────────────────────────────────────────

export function t0Regs(mode: WGMMode, cfg: TimerConfig, top: number, cs: CSOption): string[] {
  const wgm = mode.wgm;
  const tccr0aBits: string[] = [];
  const tccr0bBits: string[] = [];

  if (wgm & 0x01) tccr0aBits.push('(1<<WGM00)');
  if (wgm & 0x02) tccr0aBits.push('(1<<WGM01)');
  if (wgm & 0x04) tccr0bBits.push('(1<<WGM02)');

  const lines: string[] = [];
  const chA = cfg.channels['A'];
  const chB = cfg.channels['B'];

  if (chA && chA.enabled) {
    tccr0aBits.push(...comBits('COM0A', chA.com, mode.isPwm));
  }
  if (chB && chB.enabled) {
    tccr0aBits.push(...comBits('COM0B', chB.com, mode.isPwm));
  }

  const csBitsArr = csBits('CS0', cs.cs, 3);
  tccr0bBits.push(...csBitsArr);

  lines.push(`    TCCR0A = ${join(tccr0aBits, '0x00')};`);
  lines.push(`    TCCR0B = ${join(tccr0bBits, '0x00')};`);

  if (mode.top === 'OCRA') {
    lines.push(`    OCR0A  = ${top};  /* TOP */`);
  }
  if (chA && chA.enabled && mode.top !== 'OCRA') {
    lines.push(`    OCR0A  = ${chA.ocr};  /* ${calcDuty(chA.ocr, top).toFixed(1)}% duty */`);
  }
  if (chB && chB.enabled) {
    lines.push(`    OCR0B  = ${chB.ocr};  /* ${calcDuty(chB.ocr, top).toFixed(1)}% duty */`);
  }

  return lines;
}

// ── Timer 1 / Timer 3 ──────────────────────────────────────────────────────────

export function t13Regs(
  n: number, mode: WGMMode, cfg: TimerConfig, top: number, cs: CSOption,
): string[] {
  const wgm = mode.wgm;
  const tccrA: string[] = [];
  const tccrB: string[] = [];

  if (wgm & 0x01) tccrA.push(`(1<<WGM${n}0)`);
  if (wgm & 0x02) tccrA.push(`(1<<WGM${n}1)`);
  if (wgm & 0x04) tccrB.push(`(1<<WGM${n}2)`);
  if (wgm & 0x08) tccrB.push(`(1<<WGM${n}3)`);

  const lines: string[] = [];
  const tdef = TIMER_MAP.get(n)!;
  for (const chDef of tdef.channels) {
    const ch = cfg.channels[chDef.letter];
    if (ch && ch.enabled) {
      tccrA.push(...comBits(`COM${n}${chDef.letter}`, ch.com, mode.isPwm));
    }
  }

  tccrB.push(...csBits(`CS${n}`, cs.cs, 3));

  lines.push(`    TCCR${n}A = ${join(tccrA, '0x00')};`);
  lines.push(`    TCCR${n}B = ${join(tccrB, '0x00')};`);

  // TOP register
  if (mode.top === 'ICR') {
    lines.push(`    ICR${n}   = ${top};  /* TOP */`);
  } else if (mode.top === 'OCRA') {
    lines.push(`    OCR${n}A  = ${top};  /* TOP */`);
  }

  // Channel OCR values
  for (const chDef of tdef.channels) {
    const ch = cfg.channels[chDef.letter];
    // Skip OCR1A if it's used as TOP
    if (chDef.letter === 'A' && mode.top === 'OCRA') {
      continue;
    }
    if (ch && ch.enabled) {
      lines.push(`    OCR${n}${chDef.letter}  = ${ch.ocr};  /* ${calcDuty(ch.ocr, top).toFixed(1)}% duty */`);
    }
  }

  return lines;
}

// ── Timer 4 ────────────────────────────────────────────────────────────────────

export function t4Regs(mode: WGMMode, cfg: TimerConfig, top: number, cs: CSOption): string[] {
  const wgm = mode.wgm;
  const tccr4a: string[] = [];
  const tccr4b: string[] = [];
  const tccr4c: string[] = [];
  const tccr4d: string[] = [];

  if (wgm & 0x01) tccr4d.push('(1<<WGM40)');
  if (wgm & 0x02) tccr4d.push('(1<<WGM41)');

  // CS bits in TCCR4B are 4-bit wide
  tccr4b.push(...csBits('CS4', cs.cs, 4));

  const chA = cfg.channels['A'];
  const chB = cfg.channels['B'];
  const chD = cfg.channels['D'];

  const lines: string[] = [];

  if (chA && chA.enabled) {
    tccr4a.push('(1<<PWM4A)');
    tccr4a.push(...comBits('COM4A', chA.com, mode.isPwm));
  }
  if (chB && chB.enabled) {
    tccr4a.push('(1<<PWM4B)');
    tccr4a.push(...comBits('COM4B', chB.com, mode.isPwm));
  }
  if (chD && chD.enabled) {
    tccr4c.push('(1<<PWM4D)');
    tccr4c.push(...comBits('COM4D', chD.com, mode.isPwm));
  }

  lines.push(`    TCCR4A = ${join(tccr4a, '0x00')};`);
  lines.push(`    TCCR4B = ${join(tccr4b, '0x00')};`);
  if (tccr4c.length > 0) {
    lines.push(`    TCCR4C = ${join(tccr4c, '0x00')};`);
  }
  lines.push(`    TCCR4D = ${join(tccr4d, '0x00')};`);

  if (mode.top === 'OCRC') {
    lines.push(`    OCR4C  = ${top};  /* TOP */`);
  }
  if (chA && chA.enabled) {
    lines.push(`    OCR4A  = ${chA.ocr};  /* ${calcDuty(chA.ocr, top).toFixed(1)}% duty */`);
  }
  if (chB && chB.enabled) {
    lines.push(`    OCR4B  = ${chB.ocr};  /* ${calcDuty(chB.ocr, top).toFixed(1)}% duty */`);
  }
  if (chD && chD.enabled) {
    lines.push(`    OCR4D  = ${chD.ocr};  /* ${calcDuty(chD.ocr, top).toFixed(1)}% duty */`);
  }

  return lines;
}
