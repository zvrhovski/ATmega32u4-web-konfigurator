/**
 * GPIO code generation — ported from code_gen.py _gpio_section()
 */

import { PinConfig, GpioMode, PIN_MAP, PinType } from '../data/pins';
import { bits } from './index';

const PORTS = ['B', 'C', 'D', 'E', 'F'] as const;

export function gpioSection(pinConfigs: Record<number, PinConfig>): string[] {
  const outBits:  Record<string, number[]> = {};
  const highBits: Record<string, number[]> = {};
  const notes:    Record<string, string[]> = {};
  const configured = new Set<string>();

  for (const p of PORTS) {
    outBits[p]  = [];
    highBits[p] = [];
    notes[p]    = [];
  }

  for (const [pinNumStr, cfg] of Object.entries(pinConfigs)) {
    const pinNum = Number(pinNumStr);
    const pin = PIN_MAP.get(pinNum);
    if (!pin || pin.pinType !== PinType.GPIO || cfg.mode === GpioMode.UNCONFIGURED) {
      continue;
    }
    const port = pin.port!;
    const bit  = pin.bit!;
    const name = `P${port}${bit}`;
    configured.add(port);

    if (cfg.mode === GpioMode.OUTPUT_LOW) {
      outBits[port].push(bit);
      notes[port].push(`${name}=Out/LOW`);
    } else if (cfg.mode === GpioMode.OUTPUT_HIGH) {
      outBits[port].push(bit);
      highBits[port].push(bit);
      notes[port].push(`${name}=Out/HIGH`);
    } else if (cfg.mode === GpioMode.INPUT) {
      notes[port].push(`${name}=In`);
    } else if (cfg.mode === GpioMode.INPUT_PULLUP) {
      highBits[port].push(bit);
      notes[port].push(`${name}=In/PU`);
    }
  }

  if (configured.size === 0) {
    return [];
  }

  const lines: string[] = ['    /* ---- GPIO ---- */'];
  for (const port of PORTS) {
    if (!configured.has(port)) {
      continue;
    }
    lines.push(`    /* Port ${port}: ${notes[port].join(', ')} */`);
    if (outBits[port].length > 0) {
      lines.push(`    DDR${port}  |= ${bits(port, outBits[port].slice().sort((a, b) => a - b))};`);
    }
    if (highBits[port].length > 0) {
      lines.push(`    PORT${port} |= ${bits(port, highBits[port].slice().sort((a, b) => a - b))};`);
    }
    lines.push('');
  }

  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines;
}
