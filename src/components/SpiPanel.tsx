import {
  SPIConfig,
  SPI_MODES,
  SPI_PRESCALERS,
  fmtSpiClock,
} from '../data/spi';

interface SpiPanelProps {
  config: SPIConfig;
  onChange: (cfg: SPIConfig) => void;
  fCpu: number;
}

export default function SpiPanel({ config, onChange, fCpu }: SpiPanelProps) {
  const update = (partial: Partial<SPIConfig>) => {
    onChange({ ...config, ...partial });
  };

  return (
    <div className="p-3 space-y-4 overflow-auto">
      {/* Enable */}
      <label className="flex items-center gap-2 text-base text-gray-200">
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={e => update({ enabled: e.target.checked })}
        />
        Enable SPI
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

          {/* SPI Mode */}
          <div className="space-y-1">
            <label className="text-sm text-gray-400">SPI Mode</label>
            <select
              value={config.modeIdx}
              onChange={e => update({ modeIdx: Number(e.target.value) })}
              className="w-full"
            >
              {SPI_MODES.map((m, i) => (
                <option key={i} value={i}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Prescaler (Master only) */}
          {config.isMaster && (
            <div className="space-y-1">
              <label className="text-sm text-gray-400">Prescaler</label>
              <select
                value={config.prescalerIdx}
                onChange={e => update({ prescalerIdx: Number(e.target.value) })}
                className="w-full"
              >
                {SPI_PRESCALERS.map((p, i) => (
                  <option key={i} value={i}>{p.label}</option>
                ))}
              </select>
              <p className="text-sm font-mono text-yellow-400">
                SCK: {fmtSpiClock(config.prescalerIdx, fCpu)}
              </p>
            </div>
          )}

          {/* Data order */}
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Data Order</label>
            <select
              value={config.lsbFirst ? 'lsb' : 'msb'}
              onChange={e => update({ lsbFirst: e.target.value === 'lsb' })}
              className="w-full"
            >
              <option value="msb">MSB First</option>
              <option value="lsb">LSB First</option>
            </select>
          </div>

          {/* SPIE interrupt */}
          <label className="flex items-center gap-2 text-base text-gray-200">
            <input
              type="checkbox"
              checked={config.spiInt}
              onChange={e => update({ spiInt: e.target.checked })}
            />
            SPIE (SPI Interrupt)
          </label>

          {/* Pin info */}
          <div className="text-sm text-gray-400 border-t border-gray-700 pt-2 space-y-0.5">
            <p className="font-medium text-gray-300">SPI Pins:</p>
            <p>SS &mdash; PB0 (pin 7){config.isMaster ? ' [output recommended]' : ' [input]'}</p>
            <p>SCK &mdash; PB1 (pin 8){config.isMaster ? ' [output]' : ' [input]'}</p>
            <p>MOSI &mdash; PB2 (pin 9){config.isMaster ? ' [output]' : ' [input]'}</p>
            <p>MISO &mdash; PB3 (pin 10){config.isMaster ? ' [input]' : ' [output]'}</p>
          </div>
        </>
      )}
    </div>
  );
}
