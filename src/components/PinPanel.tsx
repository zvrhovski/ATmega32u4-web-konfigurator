import { PinDef, PinConfig, GpioMode, PinType } from '../data/pins';

const GPIO_MODES = [
  GpioMode.UNCONFIGURED,
  GpioMode.INPUT,
  GpioMode.INPUT_PULLUP,
  GpioMode.OUTPUT_LOW,
  GpioMode.OUTPUT_HIGH,
] as const;

interface PinPanelProps {
  selectedPin: PinDef | null;
  config: PinConfig;
  onModeChange: (mode: GpioMode) => void;
}

export default function PinPanel({ selectedPin, config, onModeChange }: PinPanelProps) {
  if (!selectedPin) {
    return (
      <div className="p-4 text-gray-500 text-sm italic">
        Click a GPIO pin on the chip to configure it.
      </div>
    );
  }

  const isGpio = selectedPin.pinType === PinType.GPIO;

  return (
    <div className="p-4 space-y-4 overflow-auto">
      {/* Pin info */}
      <div className="space-y-1">
        <h3 className="text-blue-400 font-medium text-sm">
          Pin {selectedPin.number} &mdash; {selectedPin.name}
        </h3>
        {selectedPin.port && (
          <p className="text-xs text-gray-400">
            Port {selectedPin.port}, bit {selectedPin.bit}
          </p>
        )}
        <p className="text-xs text-gray-400">
          Type: <span className="text-gray-200">{selectedPin.pinType}</span>
        </p>
        {selectedPin.altFunctions.length > 0 && (
          <div className="text-xs text-gray-400">
            Alt functions:{' '}
            <span className="text-yellow-400 font-mono">
              {selectedPin.altFunctions.join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* GPIO mode selection */}
      {isGpio ? (
        <div className="space-y-2">
          <h4 className="text-sm text-gray-300 font-medium">GPIO Mode</h4>
          <div className="space-y-1">
            {GPIO_MODES.map(mode => (
              <label
                key={mode}
                className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer
                           hover:bg-gray-700 rounded px-2 py-1 transition-colors"
              >
                <input
                  type="radio"
                  name="gpio-mode"
                  checked={config.mode === mode}
                  onChange={() => onModeChange(mode)}
                  className="w-3.5 h-3.5 accent-blue-500"
                />
                {mode}
              </label>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-500 italic">
          This is a {selectedPin.pinType} pin and cannot be configured as GPIO.
        </p>
      )}
    </div>
  );
}
