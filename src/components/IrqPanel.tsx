import {
  InterruptConfig,
  ExtIntConfig,
  EXT_INTS,
  PCINT_PINS,
  SENSE_OPTIONS,
} from '../data/interrupts';

interface IrqPanelProps {
  config: InterruptConfig;
  onChange: (cfg: InterruptConfig) => void;
}

export default function IrqPanel({ config, onChange }: IrqPanelProps) {
  const updateExt = (n: number, partial: Partial<ExtIntConfig>) => {
    const prev = config.ext[n];
    onChange({
      ...config,
      ext: {
        ...config.ext,
        [n]: { ...prev, ...partial },
      },
    });
  };

  const updatePcintPin = (pcintN: number, val: boolean) => {
    onChange({
      ...config,
      pcint: {
        ...config.pcint,
        pins: { ...config.pcint.pins, [pcintN]: val },
      },
    });
  };

  return (
    <div className="p-3 space-y-4 overflow-auto">
      {/* External Interrupts */}
      <div className="space-y-3">
        <h3 className="text-base text-gray-300 font-medium">External Interrupts</h3>
        {EXT_INTS.map(ei => {
          const extCfg = config.ext[ei.n];
          return (
            <div key={ei.n} className="space-y-1 bg-gray-800 rounded p-2">
              <label className="flex items-center gap-2 text-base text-gray-200">
                <input
                  type="checkbox"
                  checked={extCfg.enabled}
                  onChange={e => updateExt(ei.n, { enabled: e.target.checked })}
                />
                INT{ei.n} ({ei.pinName}, pin {ei.pinNum})
              </label>
              {extCfg.enabled && (
                <div className="ml-6">
                  <label className="text-sm text-gray-400">Sense</label>
                  <select
                    value={extCfg.sense}
                    onChange={e => updateExt(ei.n, { sense: Number(e.target.value) })}
                    className="w-full"
                  >
                    {SENSE_OPTIONS.map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pin Change Interrupts */}
      <div className="space-y-2 border-t border-gray-700 pt-3">
        <h3 className="text-base text-gray-300 font-medium">Pin Change Interrupts (Port B)</h3>
        <label className="flex items-center gap-2 text-base text-gray-200">
          <input
            type="checkbox"
            checked={config.pcint.groupEnabled}
            onChange={e =>
              onChange({
                ...config,
                pcint: { ...config.pcint, groupEnabled: e.target.checked },
              })
            }
          />
          PCIE0 (Enable PCINT group)
        </label>
        {config.pcint.groupEnabled && (
          <div className="grid grid-cols-2 gap-1 ml-4">
            {PCINT_PINS.map(p => (
              <label
                key={p.pcintN}
                className="flex items-center gap-1.5 text-sm text-gray-200
                           hover:bg-gray-700 rounded px-1 py-0.5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={config.pcint.pins[p.pcintN] ?? false}
                  onChange={e => updatePcintPin(p.pcintN, e.target.checked)}
                />
                PCINT{p.pcintN} ({p.pinName})
              </label>
            ))}
          </div>
        )}
      </div>

      {/* SEI */}
      <div className="border-t border-gray-700 pt-3">
        <label className="flex items-center gap-2 text-base text-gray-200">
          <input
            type="checkbox"
            checked={config.sei}
            onChange={e => onChange({ ...config, sei: e.target.checked })}
          />
          sei() &mdash; Global Interrupt Enable
        </label>
      </div>
    </div>
  );
}
