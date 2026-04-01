/**
 * USART1 code generation — ported from code_gen.py _uart_section()
 */

import {
  USARTConfig, BAUD_RATES, DATA_BITS_OPTIONS,
  PARITY_OPTIONS, STOP_BITS_OPTIONS, calcBaudError,
  configBaud, configUbrr, configFormatStr,
} from '../data/uart';
import { join } from './index';

export function uartSection(cfg: USARTConfig, fCpu: number): string[] {
  if (!cfg.enabled) {
    return [];
  }

  const baud  = configBaud(cfg);
  const ubrr  = configUbrr(cfg, fCpu);
  const fmt   = configFormatStr(cfg);
  const error = calcBaudError(baud, cfg.u2x, fCpu);

  const db  = DATA_BITS_OPTIONS[cfg.databitsIdx];
  const par = PARITY_OPTIONS[cfg.parityIdx];
  const sb  = STOP_BITS_OPTIONS[cfg.stopbitsIdx];

  const lines: string[] = [
    '',
    '    /* ---- USART1 ---- */',
    `    // ${baud} baud, ${fmt} (UBRR=${ubrr}, gre\u0161ka ${error >= 0 ? '+' : ''}${error.toFixed(1)}%)`,
    `    // RXD1=PD2 (pin 19), TXD1=PD3 (pin 20)`,
  ];

  // UBRR1
  lines.push(`    UBRR1H = ${(ubrr >> 8) & 0xFF};`);
  lines.push(`    UBRR1L = ${ubrr & 0xFF};`);

  // UCSR1A -- only if U2X enabled
  if (cfg.u2x) {
    lines.push(`    UCSR1A = (1<<U2X1);`);
  }

  // UCSR1B = RXEN | TXEN | interrupt bits
  const ucsr1bBits: string[] = [];
  if (cfg.rxEn)  ucsr1bBits.push('(1<<RXEN1)');
  if (cfg.txEn)  ucsr1bBits.push('(1<<TXEN1)');
  if (cfg.rxcie) ucsr1bBits.push('(1<<RXCIE1)');
  if (cfg.txcie) ucsr1bBits.push('(1<<TXCIE1)');
  if (cfg.udrie) ucsr1bBits.push('(1<<UDRIE1)');
  // 9-bit mode: UCSZ12 bit is in UCSR1B
  if (db.ucsz & 0x04) {
    ucsr1bBits.push('(1<<UCSZ12)');
  }

  lines.push(`    UCSR1B = ${join(ucsr1bBits, '0x00')};`);

  // UCSR1C = UPM | USBS | UCSZ[1:0]
  const ucsr1cBits: string[] = [];
  // Parity
  if (par.upm & 0x02) ucsr1cBits.push('(1<<UPM11)');
  if (par.upm & 0x01) ucsr1cBits.push('(1<<UPM10)');
  // Stop bits
  if (sb.usbs)        ucsr1cBits.push('(1<<USBS1)');
  // Data bits (lower 2 bits of UCSZ)
  if (db.ucsz & 0x02) ucsr1cBits.push('(1<<UCSZ11)');
  if (db.ucsz & 0x01) ucsr1cBits.push('(1<<UCSZ10)');

  // Build comment
  const parts: string[] = [];
  parts.push(`${db.bits}-bit`);
  if (par.upm === 0) {
    parts.push('no parity');
  } else {
    parts.push(`${par.label.toLowerCase()} parity`);
  }
  parts.push(sb.label);
  const comment = parts.join(', ');

  lines.push(`    UCSR1C = ${join(ucsr1cBits, '0x00')};  /* ${comment} */`);

  return lines;
}
