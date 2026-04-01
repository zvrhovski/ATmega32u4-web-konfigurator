import { useState, useCallback, useMemo, useEffect } from 'react';
import { PinConfig, makePinConfig } from '../data/pins';
import {
  TimerConfig,
  makeTimerConfigs,
} from '../data/timers';
import { ADCConfig, makeAdcConfig } from '../data/adc';
import { USARTConfig, makeUartConfig } from '../data/uart';
import { SPIConfig, makeSpiConfig } from '../data/spi';
import { TWIConfig, makeTwiConfig } from '../data/twi';
import { InterruptConfig, makeInterruptConfig } from '../data/interrupts';
import { generateCode } from '../codegen';

export const F_CPU_OPTIONS = [
  { value: 1_000_000, label: '1 MHz (internal RC)' },
  { value: 2_000_000, label: '2 MHz' },
  { value: 4_000_000, label: '4 MHz' },
  { value: 7_372_800, label: '7.3728 MHz (UART)' },
  { value: 8_000_000, label: '8 MHz' },
  { value: 11_059_200, label: '11.0592 MHz (UART)' },
  { value: 12_000_000, label: '12 MHz' },
  { value: 14_745_600, label: '14.7456 MHz (UART)' },
  { value: 16_000_000, label: '16 MHz (default)' },
  { value: 18_432_000, label: '18.432 MHz (UART)' },
  { value: 20_000_000, label: '20 MHz' },
];

export interface ConfiguratorState {
  fCpu: number;
  pinConfigs: Record<number, PinConfig>;
  timerConfigs: Record<number, TimerConfig>;
  adcConfig: ADCConfig;
  uartConfig: USARTConfig;
  spiConfig: SPIConfig;
  twiConfig: TWIConfig;
  irqConfig: InterruptConfig;
  generatedCode: string;
  selectedPin: number | null;
  activeTab: string;

  setFCpu: (v: number) => void;
  setPinConfig: (pinNum: number, cfg: PinConfig) => void;
  setTimerConfig: (timerN: number, cfg: TimerConfig) => void;
  setAdcConfig: (cfg: ADCConfig) => void;
  setUartConfig: (cfg: USARTConfig) => void;
  setSpiConfig: (cfg: SPIConfig) => void;
  setTwiConfig: (cfg: TWIConfig) => void;
  setIrqConfig: (cfg: InterruptConfig) => void;
  setSelectedPin: (pin: number | null) => void;
  setActiveTab: (tab: string) => void;
  getPinConfig: (pinNum: number) => PinConfig;
}

export function useConfigurator(): ConfiguratorState {
  const [fCpu, setFCpu] = useState(16_000_000);
  const [pinConfigs, setPinConfigs] = useState<Record<number, PinConfig>>({});
  const [timerConfigs, setTimerConfigs] = useState<Record<number, TimerConfig>>(makeTimerConfigs);
  const [adcConfig, setAdcConfig] = useState<ADCConfig>(makeAdcConfig);
  const [uartConfig, setUartConfig] = useState<USARTConfig>(makeUartConfig);
  const [spiConfig, setSpiConfig] = useState<SPIConfig>(makeSpiConfig);
  const [twiConfig, setTwiConfig] = useState<TWIConfig>(makeTwiConfig);
  const [irqConfig, setIrqConfig] = useState<InterruptConfig>(makeInterruptConfig);
  const [generatedCode, setGeneratedCode] = useState('');
  const [selectedPin, setSelectedPin] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('pin');

  const setPinConfig = useCallback((pinNum: number, cfg: PinConfig) => {
    setPinConfigs(prev => ({ ...prev, [pinNum]: cfg }));
  }, []);

  const setTimerConfig = useCallback((timerN: number, cfg: TimerConfig) => {
    setTimerConfigs(prev => ({ ...prev, [timerN]: cfg }));
  }, []);

  const getPinConfig = useCallback(
    (pinNum: number): PinConfig => pinConfigs[pinNum] ?? makePinConfig(),
    [pinConfigs],
  );

  // Regenerate code on any config change
  useEffect(() => {
    try {
      const code = generateCode(
        pinConfigs,
        timerConfigs,
        irqConfig,
        adcConfig,
        uartConfig,
        spiConfig,
        twiConfig,
        fCpu,
      );
      setGeneratedCode(code);
    } catch {
      setGeneratedCode('// Error generating code');
    }
  }, [fCpu, pinConfigs, timerConfigs, adcConfig, uartConfig, spiConfig, twiConfig, irqConfig]);

  return useMemo(
    () => ({
      fCpu,
      pinConfigs,
      timerConfigs,
      adcConfig,
      uartConfig,
      spiConfig,
      twiConfig,
      irqConfig,
      generatedCode,
      selectedPin,
      activeTab,
      setFCpu,
      setPinConfig,
      setTimerConfig,
      setAdcConfig,
      setUartConfig,
      setSpiConfig,
      setTwiConfig,
      setIrqConfig,
      setSelectedPin,
      setActiveTab,
      getPinConfig,
    }),
    [
      fCpu, pinConfigs, timerConfigs, adcConfig, uartConfig,
      spiConfig, twiConfig, irqConfig, generatedCode,
      selectedPin, activeTab,
      setPinConfig, setTimerConfig, getPinConfig,
    ],
  );
}
