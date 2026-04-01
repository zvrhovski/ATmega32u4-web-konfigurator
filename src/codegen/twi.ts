/**
 * TWI (I2C) code generation — ported from code_gen.py _twi_section()
 */

import {
  TWIConfig, TWI_SPEEDS, TWI_PRESCALERS,
  calcTwbr, calcActualScl,
} from '../data/twi';
import { join } from './index';

export function twiSection(cfg: TWIConfig, fCpu: number): string[] {
  if (!cfg.enabled) {
    return [];
  }

  const lines: string[] = ['', '    /* ---- TWI (I2C) ---- */'];
  lines.push(`    // SCL=PD0 (pin 17), SDA=PD1 (pin 18)`);

  if (cfg.isMaster) {
    const sclFreq  = TWI_SPEEDS[cfg.speedIdx][0];
    const sclLabel = TWI_SPEEDS[cfg.speedIdx][1];
    const ps   = TWI_PRESCALERS[cfg.prescalerIdx];
    const twbr = calcTwbr(sclFreq, cfg.prescalerIdx, fCpu);
    const actual = calcActualScl(twbr, cfg.prescalerIdx, fCpu);

    lines.push(`    // Master, ${sclLabel} (TWBR=${twbr}, prescaler=${ps.div})`);

    // TWSR -- prescaler bits
    const twsrBits: string[] = [];
    if (ps.twps & 0x01) {
      twsrBits.push('(1<<TWPS0)');
    }
    if (ps.twps & 0x02) {
      twsrBits.push('(1<<TWPS1)');
    }
    lines.push(`    TWSR = ${join(twsrBits, '0x00')};  /* prescaler = ${ps.div} */`);

    // TWBR
    lines.push(`    TWBR = ${twbr};`);

    // TWCR
    const twcrBits = ['(1<<TWEN)'];
    if (cfg.twiInt) {
      twcrBits.push('(1<<TWIE)');
    }
    lines.push(`    TWCR = ${join(twcrBits)};`);

  } else {
    // Slave mode
    const addr = cfg.slaveAddr;
    lines.push(`    // Slave, adresa 0x${addr.toString(16).toUpperCase().padStart(2, '0')}`);

    // TWAR
    const twarBits = [`(0x${addr.toString(16).toUpperCase().padStart(2, '0')}<<1)`];
    if (cfg.generalCall) {
      twarBits.push('(1<<TWGCE)');
    }
    lines.push(`    TWAR = ${join(twarBits)};  /* 7-bit adresa */`);

    // TWCR
    const twcrBits = ['(1<<TWEN)', '(1<<TWEA)'];
    if (cfg.twiInt) {
      twcrBits.push('(1<<TWIE)');
    }
    lines.push(`    TWCR = ${join(twcrBits)};`);
  }

  return lines;
}
