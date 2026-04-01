/**
 * Interrupt code generation — ported from code_gen.py _interrupt_section()
 */

import {
  InterruptConfig, EXT_INTS, PCINT_PINS, SENSE_OPTIONS,
} from '../data/interrupts';
import { join } from './index';

export function interruptSection(cfg: InterruptConfig): string[] {
  const activeExt   = EXT_INTS.filter(e => cfg.ext[e.n].enabled);
  const activePcint = PCINT_PINS.filter(p => cfg.pcint.pins[p.pcintN]);
  const hasPcint    = cfg.pcint.groupEnabled && activePcint.length > 0;

  if (activeExt.length === 0 && !hasPcint) {
    return [];
  }

  const lines: string[] = ['', '    /* ---- Interrupts ---- */'];

  // -- INTx --
  if (activeExt.length > 0) {
    const eicraBits: string[] = [];
    const eicrbBits: string[] = [];
    const eimskBits: string[] = [];

    for (const edef of activeExt) {
      const sense = cfg.ext[edef.n].sense;
      const label = SENSE_OPTIONS.find(([v]) => v === sense)![1];
      lines.push(`    /* INT${edef.n} (${edef.pinName}): ${label} */`);

      // ISC bits
      if (sense & 0x01) {
        const bitName = `ISC${edef.n}0`;
        if (edef.eicrReg === 'EICRA') {
          eicraBits.push(`(1<<${bitName})`);
        } else {
          eicrbBits.push(`(1<<${bitName})`);
        }
      }
      if (sense & 0x02) {
        const bitName = `ISC${edef.n}1`;
        if (edef.eicrReg === 'EICRA') {
          eicraBits.push(`(1<<${bitName})`);
        } else {
          eicrbBits.push(`(1<<${bitName})`);
        }
      }

      eimskBits.push(`(1<<INT${edef.n})`);
    }

    if (eicraBits.length > 0) {
      lines.push(`    EICRA  = ${join(eicraBits)};`);
    }
    if (eicrbBits.length > 0) {
      lines.push(`    EICRB  = ${join(eicrbBits)};`);
    }
    lines.push(`    EIMSK  = ${join(eimskBits)};`);
  }

  // -- PCINTx --
  if (hasPcint) {
    const pinNames = activePcint.map(p => p.pinName).join(', ');
    lines.push(`    /* PCINT0 group: ${pinNames} */`);
    lines.push('    PCICR  = (1<<PCIE0);');
    const maskBits = activePcint.map(p => `(1<<PCINT${p.pcintN})`);
    lines.push(`    PCMSK0 = ${join(maskBits)};`);
  }

  // sei() is NOT added here -- handled centrally in generateCode()
  return lines;
}
