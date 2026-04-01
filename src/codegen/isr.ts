/**
 * ISR template code generation — ported from code_gen.py _isr_section()
 */

import { InterruptConfig, EXT_INTS, PCINT_PINS, SENSE_OPTIONS } from '../data/interrupts';
import { TimerConfig, ALL_TIMERS } from '../data/timers';
import { USARTConfig } from '../data/uart';
import { SPIConfig } from '../data/spi';
import { TWIConfig } from '../data/twi';

export function isrSection(
  irqConfig:    InterruptConfig | null,
  timerConfigs: Record<number, TimerConfig> | null,
  uartConfig:   USARTConfig | null = null,
  spiConfig:    SPIConfig | null = null,
  twiConfig:    TWIConfig | null = null,
): string[] {
  const isrs: [string, string[]][] = [];   // [vector_name, body_lines]

  // -- External INTx --
  if (irqConfig) {
    for (const edef of EXT_INTS) {
      if (irqConfig.ext[edef.n].enabled) {
        const sense = irqConfig.ext[edef.n].sense;
        const label = SENSE_OPTIONS.find(([v]) => v === sense)![1];
        isrs.push([
          `INT${edef.n}_vect`,
          [`    /* INT${edef.n} (${edef.pinName}) \u2014 ${label} */`],
        ]);
      }
    }

    // -- PCINT0 --
    if (irqConfig.pcint.groupEnabled && Object.values(irqConfig.pcint.pins).some(v => v)) {
      const active = PCINT_PINS.filter(p => irqConfig.pcint.pins[p.pcintN]);
      const pinsStr = active.map(p => p.pinName).join(', ');
      isrs.push([
        'PCINT0_vect',
        [`    /* Pin change on: ${pinsStr} */`],
      ]);
    }
  }

  // -- Timer overflow (TOIE) --
  if (timerConfigs) {
    for (const tdef of ALL_TIMERS) {
      const cfg = timerConfigs[tdef.n];
      if (!cfg || !cfg.enabled) {
        continue;
      }
      if (cfg.toie) {
        const body = [`    /* Timer ${tdef.n} overflow */`];
        if (cfg.tcnt > 0) {
          body.push(`    TCNT${tdef.n} = ${cfg.tcnt};  /* reload preload */`);
        }
        isrs.push([`TIMER${tdef.n}_OVF_vect`, body]);
      }
      if (cfg.ocie) {
        const mode = tdef.modes[cfg.modeIdx];
        if (mode.name.includes('CTC')) {
          isrs.push([
            `TIMER${tdef.n}_COMPA_vect`,
            [`    /* Timer ${tdef.n} Compare Match A (CTC) */`],
          ]);
        }
      }
    }
  }

  // -- USART1 interrupts --
  if (uartConfig && uartConfig.enabled) {
    if (uartConfig.rxcie) {
      isrs.push([
        'USART1_RX_vect',
        ['    /* USART1 RX Complete */',
         '    uint8_t data = UDR1;'],
      ]);
    }
    if (uartConfig.txcie) {
      isrs.push([
        'USART1_TX_vect',
        ['    /* USART1 TX Complete */'],
      ]);
    }
    if (uartConfig.udrie) {
      isrs.push([
        'USART1_UDRE_vect',
        ['    /* USART1 Data Register Empty */'],
      ]);
    }
  }

  // -- SPI interrupt --
  if (spiConfig && spiConfig.enabled && spiConfig.spiInt) {
    isrs.push([
      'SPI_STC_vect',
      ['    /* SPI Transfer Complete */',
       '    uint8_t data = SPDR;'],
    ]);
  }

  // -- TWI interrupt --
  if (twiConfig && twiConfig.enabled && twiConfig.twiInt) {
    isrs.push([
      'TWI_vect',
      ['    /* TWI/I2C */',
       '    uint8_t status = TWSR & 0xF8;'],
    ]);
  }

  if (isrs.length === 0) {
    return [];
  }

  const lines: string[] = ['', ''];
  lines.push('/* \u2500\u2500 Interrupt Service Routines \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */');
  for (const [vect, body] of isrs) {
    lines.push('');
    lines.push(`ISR(${vect})`);
    lines.push('{');
    lines.push(...body);
    lines.push('}');
  }

  return lines;
}
