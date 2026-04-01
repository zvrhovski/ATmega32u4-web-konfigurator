// ATmega32U4 pin definitions — ported from pins.py

export enum PinType {
  GPIO  = 'gpio',
  POWER = 'power',
  USB   = 'usb',
  CLOCK = 'clock',
  RESET = 'reset',
  REF   = 'reference',
}

export enum GpioMode {
  UNCONFIGURED = 'Unconfigured',
  INPUT        = 'Input',
  INPUT_PULLUP = 'Input + Pull-up',
  OUTPUT_LOW   = 'Output LOW',
  OUTPUT_HIGH  = 'Output HIGH',
}

export interface PinDef {
  readonly number: number;
  readonly name: string;
  readonly port: string | null;    // 'B','C','D','E','F' or null
  readonly bit: number | null;     // 0-7 or null
  readonly altFunctions: readonly string[];
  readonly pinType: PinType;
}

export interface PinConfig {
  mode: GpioMode;
}

/** Get the physical side of the TQFP-44 package. */
export function pinSide(p: PinDef): 'left' | 'bottom' | 'right' | 'top' {
  if (p.number >= 1  && p.number <= 11) return 'left';
  if (p.number >= 12 && p.number <= 22) return 'bottom';
  if (p.number >= 23 && p.number <= 33) return 'right';
  return 'top';
}

/** Physical position index 0-10 along the side. */
export function pinSideIndex(p: PinDef): number {
  const side = pinSide(p);
  if (side === 'left')   return p.number - 1;        // 0=top,   10=bottom
  if (side === 'bottom') return p.number - 12;       // 0=left,  10=right
  if (side === 'right')  return p.number - 23;       // 0=bottom,10=top
  return                        p.number - 34;       // 0=right, 10=left (top)
}

export function makePinConfig(): PinConfig {
  return { mode: GpioMode.UNCONFIGURED };
}

// Shorthand aliases used in the table below
const G   = PinType.GPIO;
const P   = PinType.POWER;
const U   = PinType.USB;
const C   = PinType.CLOCK;
const R   = PinType.RESET;
const REF = PinType.REF;

function _p(
  num: number, name: string,
  port: string | null, bit: number | null,
  alts: string[], ptype: PinType,
): PinDef {
  return { number: num, name, port, bit, altFunctions: alts, pinType: ptype };
}

// ATmega32U4 TQFP-44 pinout
// Counter-clockwise from top-left:
// Left 1-11 (top->bottom), Bottom 12-22 (left->right),
// Right 23-33 (bottom->top), Top 34-44 (right->left)
export const ALL_PINS: readonly PinDef[] = [
  // -- Left side (1-11) --
  _p(1,  'PE6',    'E', 6, ['INT6', 'AIN0'],                        G),
  _p(2,  'UVCC',   null, null, [],                                   P),
  _p(3,  'D-',     null, null, [],                                   U),
  _p(4,  'D+',     null, null, [],                                   U),
  _p(5,  'UCAP',   null, null, [],                                   U),
  _p(6,  'VBUS',   null, null, [],                                   U),
  _p(7,  'PB0',    'B', 0, ['SS',   'PCINT0'],                      G),
  _p(8,  'PB1',    'B', 1, ['SCK',  'PCINT1'],                      G),
  _p(9,  'PB2',    'B', 2, ['PDI',  'MOSI', 'PCINT2'],              G),
  _p(10, 'PB3',    'B', 3, ['PDO',  'MISO', 'PCINT3'],              G),
  _p(11, 'PB7',    'B', 7, ['OC0A', 'OC1C', 'PCINT7', 'RTS'],      G),
  // -- Bottom side (12-22) --
  _p(12, '/RESET', null, null, [],                                   R),
  _p(13, 'VCC',    null, null, [],                                   P),
  _p(14, 'GND',    null, null, [],                                   P),
  _p(15, 'XTAL2',  null, null, [],                                   C),
  _p(16, 'XTAL1',  null, null, [],                                   C),
  _p(17, 'PD0',    'D', 0, ['OC0B', 'SCL',  'INT0'],                G),
  _p(18, 'PD1',    'D', 1, ['SDA',  'INT1'],                        G),
  _p(19, 'PD2',    'D', 2, ['RXD1', 'INT2'],                        G),
  _p(20, 'PD3',    'D', 3, ['TXD1', 'INT3'],                        G),
  _p(21, 'PD5',    'D', 5, ['XCK1', 'CTS'],                         G),
  _p(22, 'GND',    null, null, [],                                   P),
  // -- Right side (23-33, physical bottom->top) --
  _p(23, 'AVCC',   null, null, [],                                   P),
  _p(24, 'PD4',    'D', 4, ['ICP1', 'ADC8'],                        G),
  _p(25, 'PD6',    'D', 6, ['T1',   'OC4D', 'ADC9'],                G),
  _p(26, 'PD7',    'D', 7, ['T0',   'OC4D', 'ADC10'],               G),
  _p(27, 'PB4',    'B', 4, ['PCINT4','ADC11'],                      G),
  _p(28, 'PB5',    'B', 5, ['PCINT5','OC1A','OC4B','ADC12'],        G),
  _p(29, 'PB6',    'B', 6, ['PCINT6','OC1B','OC4B','ADC13'],        G),
  _p(30, 'PC6',    'C', 6, ['OC3A', 'UVcon'],                       G),
  _p(31, 'PC7',    'C', 7, ['ICP3', 'CLK0', 'OC4A'],                G),
  _p(32, 'PE2',    'E', 2, ['HWB'],                                  G),
  _p(33, 'VCC',    null, null, [],                                   P),
  // -- Top side (34-44, physical right->left) --
  _p(34, 'GND',    null, null, [],                                   P),
  _p(35, 'PF7',    'F', 7, ['ADC7', 'TDI'],                         G),
  _p(36, 'PF6',    'F', 6, ['ADC6', 'TDO'],                         G),
  _p(37, 'PF5',    'F', 5, ['ADC5', 'TMS'],                         G),
  _p(38, 'PF4',    'F', 4, ['ADC4', 'TCK'],                         G),
  _p(39, 'PF1',    'F', 1, ['ADC1'],                                 G),
  _p(40, 'PF0',    'F', 0, ['ADC0'],                                 G),
  _p(41, 'AREF',   null, null, [],                                   REF),
  _p(42, 'GND',    null, null, [],                                   P),
  _p(43, 'AVCC',   null, null, [],                                   P),
  _p(44, 'VCC',    null, null, [],                                   P),
];

export const PIN_MAP: ReadonlyMap<number, PinDef> = new Map(
  ALL_PINS.map(p => [p.number, p]),
);
