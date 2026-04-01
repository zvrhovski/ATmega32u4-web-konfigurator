import { useState, useCallback, useMemo } from 'react';

interface CodeViewProps {
  code: string;
}

const CODE_FONT_SIZE = '17px';

// ── AVR C syntax highlighter ─────────────────────────────────────────────────

const C_KEYWORDS = new Set([
  'void', 'int', 'uint8_t', 'uint16_t', 'uint32_t', 'int8_t', 'int16_t',
  'char', 'unsigned', 'signed', 'const', 'volatile', 'static', 'extern',
  'return', 'if', 'else', 'while', 'for', 'do', 'switch', 'case', 'break',
  'continue', 'default', 'typedef', 'struct', 'enum', 'union',
]);

const C_DIRECTIVES = /^(\s*)(#\w+)/;

// AVR register names + bit names
const AVR_REGISTERS = /\b(DDR[A-F]|PORT[A-F]|PIN[A-F]|TCCR\d[A-D]|TCNT\d|OCR\d[A-D]?|ICR\d|TIMSK\d|TIFR\d|ADMUX|ADCSRA|ADCSRB|ADC|ADCH|ADCL|UCSR\d[A-C]|UBRR\d[HL]|UDR\d|SPCR|SPSR|SPDR|TWBR|TWSR|TWCR|TWDR|TWAR|TWAMR|EICRA|EICRB|EIMSK|EIFR|PCICR|PCIFR|PCMSK\d|PLLCSR|PLLFRQ|SREG|SP[HL]?)\b/g;

const AVR_BITS = /\b(P[A-F]\d|WGM\d+|COM\d[A-D]\d|CS\d+|OCR\d[A-D]|OCIE\d[A-D]?|TOIE\d|TOV\d|ICF\d|ICES\d|ICNC\d|FOC\d[A-D]|MUX\d|REFS\d|ADPS\d|ADEN|ADSC|ADATE|ADIF|ADIE|ADLAR|RXEN\d|TXEN\d|RXCIE\d|TXCIE\d|UDRIE\d|U2X\d|UCSZ\d+|UPM\d+|USBS\d|RXC\d|TXC\d|UDRE\d|SPE|MSTR|SPR\d|SPI2X|DORD|CPOL|CPHA|SPIE|SPIF|TWEN|TWEA|TWSTA|TWSTO|TWINT|TWIE|TWGCE|TWS\d|PLLE|PLOCK|PINDIV|PDIV\d|PLLTM\d|PLLUSB|PWM4[A-D]|INT\d|ISC\d+|INTF\d|PCIE\d|PCINT\d)\b/g;

const ISR_PATTERN = /\b(ISR|sei|cli)\b/g;

interface Token {
  text: string;
  cls: string;
}

function highlightLine(line: string): Token[] {
  // Check for preprocessor directive
  const dirMatch = line.match(C_DIRECTIVES);
  if (dirMatch) {
    const indent = dirMatch[1];
    const rest = line.slice(indent.length);
    const tokens: Token[] = [];
    if (indent) tokens.push({ text: indent, cls: '' });

    // Split: #keyword + space + remainder
    const parts = rest.match(/^(#\w+)(\s+)(.*)$/);
    if (parts) {
      tokens.push({ text: parts[1], cls: 'c-directive' }); // #define / #include
      tokens.push({ text: parts[2], cls: '' });             // space

      const remainder = parts[3];
      // Check for <...> includes
      if (remainder.startsWith('<') && remainder.includes('>')) {
        tokens.push({ text: remainder, cls: 'c-string' });
      } else if (remainder.startsWith('"') && remainder.endsWith('"')) {
        tokens.push({ text: remainder, cls: 'c-string' });
      } else {
        // #define NAME VALUE — name is register-like, value is number
        const defParts = remainder.match(/^(\w+)(\s+)(.*)$/);
        if (defParts) {
          tokens.push({ text: defParts[1], cls: 'c-register' }); // macro name
          tokens.push({ text: defParts[2], cls: '' });
          tokens.push({ text: defParts[3], cls: 'c-number' });   // value
        } else {
          tokens.push({ text: remainder, cls: '' });
        }
      }
    } else {
      tokens.push({ text: rest, cls: 'c-directive' });
    }
    return tokens;
  }

  // Check for single-line comment
  const commentIdx = line.indexOf('//');
  const blockStart = line.indexOf('/*');

  let codePart = line;
  let commentPart = '';

  if (commentIdx >= 0 && (blockStart < 0 || commentIdx < blockStart)) {
    codePart = line.slice(0, commentIdx);
    commentPart = line.slice(commentIdx);
  } else if (blockStart >= 0) {
    codePart = line.slice(0, blockStart);
    commentPart = line.slice(blockStart);
  }

  const tokens: Token[] = [];

  // Tokenize code part
  if (codePart.length > 0) {
    // Split by word boundaries while keeping delimiters
    const parts = codePart.split(/(\b\w+\b|<<|>>|\|=|&=|[(){};\[\],=|&~+\-*/<>!])/g);

    for (const part of parts) {
      if (!part) continue;

      if (C_KEYWORDS.has(part)) {
        tokens.push({ text: part, cls: 'c-keyword' });
      } else if (part.match(AVR_REGISTERS)) {
        tokens.push({ text: part, cls: 'c-register' });
      } else if (part.match(AVR_BITS)) {
        tokens.push({ text: part, cls: 'c-bit' });
      } else if (part.match(ISR_PATTERN)) {
        tokens.push({ text: part, cls: 'c-isr' });
      } else if (part.match(/^\d+$/)) {
        tokens.push({ text: part, cls: 'c-number' });
      } else if (part.match(/^0x[0-9A-Fa-f]+$/)) {
        tokens.push({ text: part, cls: 'c-number' });
      } else if (part.match(/^".*"$/) || part.match(/^<.*>$/)) {
        tokens.push({ text: part, cls: 'c-string' });
      } else {
        tokens.push({ text: part, cls: '' });
      }
    }
  }

  // Comment part
  if (commentPart.length > 0) {
    tokens.push({ text: commentPart, cls: 'c-comment' });
  }

  return tokens;
}

// ── Color classes ────────────────────────────────────────────────────────────

const colorMap: Record<string, string> = {
  'c-keyword':   '#569CD6',   // blue (VS Code)
  'c-directive': '#569CD6',   // blue (same as keywords)
  'c-register':  '#4EC9B0',   // teal/cyan
  'c-bit':       '#DCDCAA',   // yellow-green
  'c-isr':       '#DCDCAA',   // yellow-green
  'c-number':    '#B5CEA8',   // green
  'c-string':    '#CE9178',   // orange
  'c-comment':   '#6A9955',   // green (muted)
};

// ── Component ────────────────────────────────────────────────────────────────

export default function CodeView({ code }: CodeViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  const lines = useMemo(() => {
    const src = code || '// Configure peripherals to generate code';
    return src.split('\n');
  }, [code]);

  const lineNumWidth = String(lines.length).length;

  return (
    <div className="relative flex-1 min-h-0 overflow-auto rounded-lg border border-gray-700">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 px-3 py-1 font-mono rounded
                   bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
        style={{ fontSize: '12px' }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre style={{
        margin: 0,
        padding: '1rem',
        background: '#1e1e1e',
        fontSize: CODE_FONT_SIZE,
        lineHeight: '1.6',
        minHeight: '100%',
        fontFamily: 'Consolas, "Courier New", monospace',
        color: '#D4D4D4',
        overflowX: 'auto',
      }}>
        {lines.map((line, i) => {
          const tokens = highlightLine(line);
          return (
            <div key={i} style={{ display: 'flex' }}>
              <span style={{
                display: 'inline-block',
                width: `${lineNumWidth + 1}ch`,
                minWidth: '3ch',
                textAlign: 'right',
                paddingRight: '1em',
                color: '#858585',
                userSelect: 'none',
                flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <span>
                {tokens.map((tok, j) => (
                  tok.cls ? (
                    <span key={j} style={{ color: colorMap[tok.cls] || '#D4D4D4' }}>
                      {tok.text}
                    </span>
                  ) : (
                    <span key={j}>{tok.text}</span>
                  )
                ))}
              </span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}
