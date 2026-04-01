const TABS = [
  { id: 'pin',    label: 'Pin' },
  { id: 'timers', label: 'Timers' },
  { id: 'adc',    label: 'ADC' },
  { id: 'uart',   label: 'UART' },
  { id: 'spi',    label: 'SPI' },
  { id: 'i2c',    label: 'I2C' },
  { id: 'irq',    label: 'IRQ' },
] as const;

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex border-b border-gray-700 bg-gray-800">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === tab.id
              ? 'text-blue-400 border-blue-400 bg-gray-900'
              : 'text-gray-400 border-transparent hover:text-gray-200 hover:bg-gray-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
