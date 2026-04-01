/**
 * SPI code generation — ported from code_gen.py _spi_section()
 */

import {
  SPIConfig, SPI_MODES, SPI_PRESCALERS,
} from '../data/spi';
import { join } from './index';

export function spiSection(cfg: SPIConfig, fCpu: number): string[] {
  if (!cfg.enabled) {
    return [];
  }

  const mode = SPI_MODES[cfg.modeIdx];
  const ps   = SPI_PRESCALERS[cfg.prescalerIdx];

  const lines: string[] = ['', '    /* ---- SPI ---- */'];

  if (cfg.isMaster) {
    const clk = Math.floor(fCpu / ps.div);
    let clkStr: string;
    if (clk >= 1_000_000) {
      clkStr = `${(clk / 1_000_000).toFixed(1)} MHz`;
    } else {
      clkStr = `${(clk / 1_000).toFixed(0)} kHz`;
    }
    lines.push(`    // Master, ${mode.label}, ${ps.label} (${clkStr})`);
  } else {
    lines.push(`    // Slave, ${mode.label}`);
  }

  lines.push(`    // SS=PB0 (pin 7), SCK=PB1 (pin 8), MOSI=PB2 (pin 9), MISO=PB3 (pin 10)`);

  // SPCR
  const spcrBits = ['(1<<SPE)'];
  if (cfg.isMaster) spcrBits.push('(1<<MSTR)');
  if (cfg.spiInt)   spcrBits.push('(1<<SPIE)');
  if (cfg.lsbFirst) spcrBits.push('(1<<DORD)');
  if (mode.cpol)    spcrBits.push('(1<<CPOL)');
  if (mode.cpha)    spcrBits.push('(1<<CPHA)');
  if (cfg.isMaster) {
    if (ps.spr & 0x01) spcrBits.push('(1<<SPR0)');
    if (ps.spr & 0x02) spcrBits.push('(1<<SPR1)');
  }

  lines.push(`    SPCR = ${join(spcrBits)};`);

  // SPSR (SPI2X for double speed)
  if (cfg.isMaster && ps.spi2x) {
    lines.push(`    SPSR = (1<<SPI2X);`);
  }

  // DDR configuration
  if (cfg.isMaster) {
    lines.push(`    DDRB |= (1<<PB1) | (1<<PB2);   /* SCK, MOSI output */`);
    lines.push(`    DDRB &= ~(1<<PB3);              /* MISO input */`);
    lines.push(`    DDRB |= (1<<PB0);               /* SS output */`);
  } else {
    lines.push(`    DDRB |= (1<<PB3);               /* MISO output (Slave) */`);
    lines.push(`    DDRB &= ~((1<<PB0) | (1<<PB1) | (1<<PB2));  /* SS, SCK, MOSI input */`);
  }

  return lines;
}
