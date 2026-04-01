import {
  TWIConfig,
  TWI_SPEEDS,
  TWI_PRESCALERS,
  fmtTwiInfo,
  configSclFreq,
} from '../data/twi';

interface TwiPanelProps {
  config: TWIConfig;
  onChange: (cfg: TWIConfig) => void;
  fCpu: number;
}

export default function TwiPanel({ config, onChange, fCpu }: TwiPanelProps) {
  const update = (partial: Partial<TWIConfig>) => {
    onChange({ ...config, ...partial });
  };

  const sclFreq = configSclFreq(config);
  const twiInfo = fmtTwiInfo(sclFreq, config.prescalerIdx, fCpu);

  return (
    <div className="p-3 space-y-4 overflow-auto">
      {/* Enable */}
      <label className="flex items-center gap-2 text-base text-gray-200">
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={e => update({ enabled: e.target.checked })}
        />
        Enable TWI (I2C)
      </label>

      {config.enabled && (
        <>
          {/* Master / Slave */}
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Role</label>
            <select
              value={config.isMaster ? 'master' : 'slave'}
              onChange={e => update({ isMaster: e.target.value === 'master' })}
              className="w-full"
            >
              <option value="master">Master</option>
              <option value="slave">Slave</option>
            </select>
          </div>

          {/* Master config */}
          {config.isMaster && (
            <>
              <div className="space-y-1">
                <label className="text-sm text-gray-400">SCL Speed</label>
                <select
                  value={config.speedIdx}
                  onChange={e => update({ speedIdx: Number(e.target.value) })}
                  className="w-full"
                >
                  {TWI_SPEEDS.map(([, label], i) => (
                    <option key={i} value={i}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-gray-400">Prescaler</label>
                <select
                  value={config.prescalerIdx}
                  onChange={e => update({ prescalerIdx: Number(e.target.value) })}
                  className="w-full"
                >
                  {TWI_PRESCALERS.map((p, i) => (
                    <option key={i} value={i}>{p.label}</option>
                  ))}
                </select>
              </div>

              <p className="text-sm font-mono text-yellow-400">{twiInfo}</p>
            </>
          )}

          {/* Slave config */}
          {!config.isMaster && (
            <>
              <div className="space-y-1">
                <label className="text-sm text-gray-400">
                  Slave Address (7-bit, 0x00&ndash;0x7F)
                </label>
                <input
                  type="number"
                  min={0}
                  max={127}
                  value={config.slaveAddr}
                  onChange={e =>
                    update({
                      slaveAddr: Math.min(127, Math.max(0, Number(e.target.value))),
                    })
                  }
                  className="w-full"
                />
                <p className="text-sm font-mono text-gray-400">
                  0x{config.slaveAddr.toString(16).toUpperCase().padStart(2, '0')}
                </p>
              </div>

              <label className="flex items-center gap-2 text-base text-gray-200">
                <input
                  type="checkbox"
                  checked={config.generalCall}
                  onChange={e => update({ generalCall: e.target.checked })}
                />
                General Call Recognition (TWGCE)
              </label>
            </>
          )}

          {/* TWIE interrupt */}
          <label className="flex items-center gap-2 text-base text-gray-200">
            <input
              type="checkbox"
              checked={config.twiInt}
              onChange={e => update({ twiInt: e.target.checked })}
            />
            TWIE (TWI Interrupt)
          </label>

          {/* Pin info */}
          <div className="text-sm text-gray-400 border-t border-gray-700 pt-2 space-y-0.5">
            <p className="font-medium text-gray-300">I2C Pins:</p>
            <p>SCL &mdash; PD0 (pin 17)</p>
            <p>SDA &mdash; PD1 (pin 18)</p>
          </div>
        </>
      )}
    </div>
  );
}
