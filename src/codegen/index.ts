/**
 * Code generation orchestrator — ported from code_gen.py generate_code()
 *
 * Exports helper functions used by all codegen modules:
 *   join(), bits(), comBits(), csBits()
 *
 * Main entry: generateCode()
 */

import { PinConfig } from '../data/pins';
import { TimerConfig, F_CPU_DEFAULT } from '../data/timers';
import { InterruptConfig } from '../data/interrupts';
import { ADCConfig } from '../data/adc';
import { USARTConfig, configHasInterrupts } from '../data/uart';
import { SPIConfig, spiHasInterrupts } from '../data/spi';
import { TWIConfig, twiHasInterrupts } from '../data/twi';

import { gpioSection } from './gpio';
import { timerSection } from './timers';
import { adcSection, adcChannelHelpers } from './adc';
import { uartSection } from './uart';
import { spiSection } from './spi';
import { twiSection } from './twi';
import { interruptSection } from './interrupts';
import { isrSection } from './isr';

// ── Helper functions (used by all codegen modules) ──────────────────────────

export function join(bitsList: string[], zero: string = '0x00'): string {
  return bitsList.length > 0 ? bitsList.join(' | ') : zero;
}

export function bits(port: string, bitNums: number[]): string {
  return bitNums.map(b => `(1 << P${port}${b})`).join(' | ');
}

export function comBits(prefix: string, com: number, isPwm: boolean): string[] {
  const result: string[] = [];
  if (com & 0x02) result.push(`(1<<${prefix}1)`);
  if (com & 0x01) result.push(`(1<<${prefix}0)`);
  return result;
}

export function csBits(prefix: string, csVal: number, width: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < width; i++) {
    if (csVal & (1 << i)) {
      result.push(`(1<<${prefix}${i})`);
    }
  }
  return result;
}

// ── needsSei() ──────────────────────────────────────────────────────────────

export function needsSei(
  irqConfig:    InterruptConfig | null,
  timerConfigs: Record<number, TimerConfig> | null,
  uartConfig:   USARTConfig | null = null,
  spiConfig:    SPIConfig | null = null,
  twiConfig:    TWIConfig | null = null,
): boolean {
  if (irqConfig) {
    if (irqConfig.sei) {
      return true;
    }
    if (Object.values(irqConfig.ext).some(c => c.enabled)) {
      return true;
    }
    if (irqConfig.pcint.groupEnabled && Object.values(irqConfig.pcint.pins).some(v => v)) {
      return true;
    }
  }
  if (timerConfigs) {
    if (Object.values(timerConfigs).some(c => c.toie || c.ocie)) {
      return true;
    }
  }
  if (uartConfig && uartConfig.enabled && configHasInterrupts(uartConfig)) {
    return true;
  }
  if (spiConfig && spiConfig.enabled && spiHasInterrupts(spiConfig)) {
    return true;
  }
  if (twiConfig && twiConfig.enabled && twiHasInterrupts(twiConfig)) {
    return true;
  }
  return false;
}

// ── Main entry point ────────────────────────────────────────────────────────

export function generateCode(
  pinConfigs:   Record<number, PinConfig>,
  timerConfigs: Record<number, TimerConfig> | null = null,
  irqConfig:    InterruptConfig | null = null,
  adcConfig:    ADCConfig | null = null,
  uartConfig:   USARTConfig | null = null,
  spiConfig:    SPIConfig | null = null,
  twiConfig:    TWIConfig | null = null,
  fCpu:         number = F_CPU_DEFAULT,
): string {
  const gpioLines  = gpioSection(pinConfigs);
  const timerLines = timerConfigs ? timerSection(timerConfigs, fCpu) : [];
  const adcLines   = adcConfig   ? adcSection(adcConfig, fCpu) : [];
  const uartLines  = uartConfig  ? uartSection(uartConfig, fCpu) : [];
  const spiLines   = spiConfig   ? spiSection(spiConfig, fCpu) : [];
  const twiLines   = twiConfig   ? twiSection(twiConfig, fCpu) : [];
  const irqLines   = irqConfig   ? interruptSection(irqConfig) : [];
  const isrLines   = isrSection(irqConfig, timerConfigs, uartConfig, spiConfig, twiConfig);
  const seiNeeded  = needsSei(irqConfig, timerConfigs, uartConfig, spiConfig, twiConfig);

  const hasContent = [
    gpioLines, timerLines, adcLines, uartLines,
    spiLines, twiLines, irqLines,
  ].some(l => l.length > 0) || seiNeeded;

  const includes = ['#include <avr/io.h>'];
  if (seiNeeded || isrLines.length > 0) {
    includes.push('#include <avr/interrupt.h>');
  }

  // F_CPU define
  const fMhz = fCpu / 1_000_000;
  let fStr: string;
  if (fMhz === Math.floor(fMhz)) {
    fStr = `${Math.floor(fMhz)}000000UL`;
  } else {
    fStr = `${Math.floor(fCpu)}UL`;
  }
  const fDefine = `#define F_CPU ${fStr}`;

  if (!hasContent) {
    return (
      `${fDefine}\n` +
      '#include <avr/io.h>\n\n' +
      'void init(void)\n{\n' +
      '    /* Nothing configured yet */\n' +
      '}\n'
    );
  }

  const lines: string[] = [fDefine, ...includes, '', 'void init(void)', '{'];
  lines.push(...gpioLines);
  lines.push(...timerLines);
  lines.push(...adcLines);
  lines.push(...uartLines);
  lines.push(...spiLines);
  lines.push(...twiLines);
  lines.push(...irqLines);
  if (seiNeeded) {
    lines.push('');
    lines.push('    sei();  /* enable global interrupts */');
  }
  lines.push('}');
  lines.push(...isrLines);
  if (adcConfig) {
    lines.push(...adcChannelHelpers(adcConfig));
  }
  return lines.join('\n') + '\n';
}
