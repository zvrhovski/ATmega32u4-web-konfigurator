import { useConfigurator, F_CPU_OPTIONS } from './hooks/useConfigurator';
import { PIN_MAP, GpioMode } from './data/pins';
import CodeView from './components/CodeView';
import FcpuSelector from './components/FcpuSelector';
import TabBar from './components/TabBar';
import PinPanel from './components/PinPanel';
import ChipView from './components/ChipView';
import TimerPanel from './components/TimerPanel';
import AdcPanel from './components/AdcPanel';
import UartPanel from './components/UartPanel';
import SpiPanel from './components/SpiPanel';
import TwiPanel from './components/TwiPanel';
import IrqPanel from './components/IrqPanel';

function App() {
  const cfg = useConfigurator();

  const selectedPinDef = cfg.selectedPin !== null ? PIN_MAP.get(cfg.selectedPin) ?? null : null;
  const selectedPinConfig = cfg.selectedPin !== null ? cfg.getPinConfig(cfg.selectedPin) : { mode: GpioMode.UNCONFIGURED };

  const handlePinModeChange = (mode: GpioMode) => {
    if (cfg.selectedPin !== null) {
      cfg.setPinConfig(cfg.selectedPin, { mode });
    }
  };

  const renderPanel = () => {
    switch (cfg.activeTab) {
      case 'pin':
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0">
              <ChipView
                pinConfigs={cfg.pinConfigs}
                selectedPin={cfg.selectedPin}
                onPinSelect={cfg.setSelectedPin}
              />
            </div>
            <div className="flex-1 min-h-0 border-t border-gray-700 overflow-auto">
              <PinPanel
                selectedPin={selectedPinDef}
                config={selectedPinConfig}
                onModeChange={handlePinModeChange}
              />
            </div>
          </div>
        );
      case 'timers':
        return (
          <TimerPanel
            timerConfigs={cfg.timerConfigs}
            onChange={cfg.setTimerConfig}
            fCpu={cfg.fCpu}
          />
        );
      case 'adc':
        return (
          <AdcPanel
            config={cfg.adcConfig}
            onChange={cfg.setAdcConfig}
            fCpu={cfg.fCpu}
          />
        );
      case 'uart':
        return (
          <UartPanel
            config={cfg.uartConfig}
            onChange={cfg.setUartConfig}
            fCpu={cfg.fCpu}
          />
        );
      case 'spi':
        return (
          <SpiPanel
            config={cfg.spiConfig}
            onChange={cfg.setSpiConfig}
            fCpu={cfg.fCpu}
          />
        );
      case 'i2c':
        return (
          <TwiPanel
            config={cfg.twiConfig}
            onChange={cfg.setTwiConfig}
            fCpu={cfg.fCpu}
          />
        );
      case 'irq':
        return (
          <IrqPanel
            config={cfg.irqConfig}
            onChange={cfg.setIrqConfig}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      {/* Main content */}
      <div className="flex flex-1 min-h-0">
      {/* Left panel: F_CPU + Code (2/3 width) */}
      <div className="flex flex-col w-2/3 border-r border-gray-700">
        <FcpuSelector
          value={cfg.fCpu}
          onChange={cfg.setFCpu}
          options={F_CPU_OPTIONS}
        />
        <div className="flex-1 min-h-0 p-2 flex flex-col">
          <CodeView code={cfg.generatedCode} />
        </div>
      </div>

      {/* Right panel: Tabs + Panel (1/3 width) */}
      <div className="flex flex-col w-1/3 min-h-0 text-base">
        <TabBar activeTab={cfg.activeTab} onTabChange={cfg.setActiveTab} />
        <div className="flex-1 min-h-0 overflow-auto">
          {renderPanel()}
        </div>
      </div>
      </div>

      {/* Footer / Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-gray-800 border-t border-gray-700 text-sm text-gray-400">
        <span>ATmega32U4 Configurator v1.0 {" | "} © Zoran Vrhovski — <a href="https://www.vub.hr" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Veleučilište u Bjelovaru</a></span>
        <a href="https://www.vub.hr" target="_blank" rel="noopener noreferrer">
          <img src="/ATmega32u4-web-konfigurator/vub_logo.svg" alt="VUB" className="h-5 opacity-70 hover:opacity-100 transition-opacity" />
        </a>
      </div>
    </div>
  );
}

export default App;
