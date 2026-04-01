/**
 * ADC code generation — ported from code_gen.py _adc_section() / _adc_channel_helpers()
 */

import {
  ADCConfig, ALL_ADC_CHANNELS, ADC_REFS, ADC_PRESCALERS,
} from '../data/adc';
import { join } from './index';

export function adcSection(cfg: ADCConfig, fCpu: number): string[] {
  if (!cfg.enabled || cfg.enabledChannels.size === 0) {
    return [];
  }

  const ref = ADC_REFS[cfg.refIdx];
  const ps  = ADC_PRESCALERS[cfg.prescalerIdx];

  const channels = Array.from(cfg.enabledChannels)
    .sort((a, b) => a - b)
    .map(i => ALL_ADC_CHANNELS[i]);

  const lines: string[] = [
    '',
    '    /* ---- ADC ---- */',
    `    // Referenca: ${ref.label}`,
    `    // Prescaler: ${ps.label}`,
  ];

  // ADCSRA = (1<<ADEN) | ADPS[2:0]  -- set once
  const adcsraParts = ['(1<<ADEN)'];
  for (let i = 0; i < 3; i++) {
    if (ps.adps & (1 << i)) {
      adcsraParts.push(`(1<<ADPS${i})`);
    }
  }
  lines.push(`    ADCSRA = ${join(adcsraParts)};`);

  if (channels.length === 1) {
    // Single channel: set ADMUX directly in init
    const ch = channels[0];
    let chDesc = ch.label;
    if (ch.pinNum) {
      chDesc += ` (${ch.pinName}, pin ${ch.pinNum})`;
    }

    const admuxParts: string[] = [];
    if (ref.refs & 0x02) {
      admuxParts.push('(1<<REFS1)');
    }
    if (ref.refs & 0x01) {
      admuxParts.push('(1<<REFS0)');
    }
    for (let i = 0; i < 5; i++) {
      if (ch.mux & (1 << i)) {
        admuxParts.push(`(1<<MUX${i})`);
      }
    }

    lines.push(`    ADMUX  = ${join(admuxParts, '0x00')};  /* ${chDesc} */`);
    if (ch.mux5) {
      lines.push(`    ADCSRB = (1<<MUX5);`);
    } else {
      lines.push(`    ADCSRB = 0x00;`);
    }
  } else {
    // Multiple channels: only set reference, channel via helper functions
    const refParts: string[] = [];
    if (ref.refs & 0x02) {
      refParts.push('(1<<REFS1)');
    }
    if (ref.refs & 0x01) {
      refParts.push('(1<<REFS0)');
    }
    if (refParts.length > 0) {
      lines.push(`    ADMUX  = ${join(refParts)};  /* samo referenca */`);
    }
    lines.push(`    // Kanal odaberi pomo\u0107u adc_select_*() funkcija`);
  }

  return lines;
}

export function adcChannelHelpers(cfg: ADCConfig): string[] {
  if (!cfg.enabled || cfg.enabledChannels.size === 0) {
    return [];
  }

  const ref = ADC_REFS[cfg.refIdx];
  const channels = Array.from(cfg.enabledChannels)
    .sort((a, b) => a - b)
    .map(i => ALL_ADC_CHANNELS[i]);

  const lines: string[] = ['', ''];
  lines.push('/* \u2500\u2500 ADC helper funkcije \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */');
  lines.push('');
  lines.push('uint16_t adc_read(void)');
  lines.push('{');
  lines.push('    ADCSRA |= (1<<ADSC);            /* pokreni konverziju */');
  lines.push('    while (ADCSRA & (1<<ADSC));      /* \u010dekaj zavr\u0161etak */');
  lines.push('    return ADC;');
  lines.push('}');

  if (channels.length < 2) {
    // Single channel -- only adc_read(), no select helpers
    if (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
    }
    return lines;
  }

  lines.push('');

  for (const ch of channels) {
    let chDesc = ch.label;
    if (ch.isDiff) {
      chDesc += ` (diff, ${ch.gain}\u00d7)`;
    } else if (ch.pinNum) {
      chDesc += ` (${ch.pinName}, pin ${ch.pinNum})`;
    }

    // Function name
    const fname = ch.label
      .replace(/\u2013/g, '_')
      .replace(/ /g, '_')
      .replace(/\u00d7/g, 'x')
      .toLowerCase();

    const admuxParts: string[] = [];
    if (ref.refs & 0x02) {
      admuxParts.push('(1<<REFS1)');
    }
    if (ref.refs & 0x01) {
      admuxParts.push('(1<<REFS0)');
    }
    for (let i = 0; i < 5; i++) {
      if (ch.mux & (1 << i)) {
        admuxParts.push(`(1<<MUX${i})`);
      }
    }

    lines.push(`void adc_select_${fname}(void)`);
    lines.push('{');
    lines.push(`    ADMUX  = ${join(admuxParts, '0x00')};`);
    if (ch.mux5) {
      lines.push(`    ADCSRB |= (1<<MUX5);`);
    } else {
      lines.push(`    ADCSRB &= ~(1<<MUX5);`);
    }
    lines.push('}');
    lines.push('');
  }

  // Remove trailing blank
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines;
}
