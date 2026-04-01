import {
  USARTConfig,
  BAUD_RATES,
  DATA_BITS_OPTIONS,
  PARITY_OPTIONS,
  STOP_BITS_OPTIONS,
  fmtBaudInfo,
  configBaud,
} from '../data/uart';

interface UartPanelProps {
  config: USARTConfig;
  onChange: (cfg: USARTConfig) => void;
  fCpu: number;
}

export default function UartPanel({ config, onChange, fCpu }: UartPanelProps) {
  const update = (partial: Partial<USARTConfig>) => {
    onChange({ ...config, ...partial });
  };

  const baud = configBaud(config);
  const baudInfo = fmtBaudInfo(baud, config.u2x, fCpu);

  return (
    <div className="p-3 space-y-4 overflow-auto">
      {/* Enable */}
      <label className="flex items-center gap-2 text-sm text-gray-200">
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={e => update({ enabled: e.target.checked })}
        />
        Enable USART1
      </label>

      {config.enabled && (
        <>
          {/* Baud rate */}
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Baud Rate</label>
            <select
              value={config.baudIdx}
              onChange={e => update({ baudIdx: Number(e.target.value) })}
              className="w-full"
            >
              {BAUD_RATES.map((b, i) => (
                <option key={i} value={i}>{b}</option>
              ))}
            </select>
          </div>

          {/* U2X */}
          <label className="flex items-center gap-2 text-sm text-gray-200">
            <input
              type="checkbox"
              checked={config.u2x}
              onChange={e => update({ u2x: e.target.checked })}
            />
            U2X (double speed)
          </label>

          {/* Baud info */}
          <p className="text-xs font-mono text-yellow-400">{baudInfo}</p>

          {/* Data bits */}
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Data Bits</label>
            <select
              value={config.databitsIdx}
              onChange={e => update({ databitsIdx: Number(e.target.value) })}
              className="w-full"
            >
              {DATA_BITS_OPTIONS.map((d, i) => (
                <option key={i} value={i}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Parity */}
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Parity</label>
            <select
              value={config.parityIdx}
              onChange={e => update({ parityIdx: Number(e.target.value) })}
              className="w-full"
            >
              {PARITY_OPTIONS.map((p, i) => (
                <option key={i} value={i}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Stop bits */}
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Stop Bits</label>
            <select
              value={config.stopbitsIdx}
              onChange={e => update({ stopbitsIdx: Number(e.target.value) })}
              className="w-full"
            >
              {STOP_BITS_OPTIONS.map((s, i) => (
                <option key={i} value={i}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* TX / RX enables */}
          <div className="space-y-1">
            <h4 className="text-xs text-gray-400 font-medium">Direction</h4>
            <label className="flex items-center gap-2 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={config.txEn}
                onChange={e => update({ txEn: e.target.checked })}
              />
              TX Enable (PD3, pin 20)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={config.rxEn}
                onChange={e => update({ rxEn: e.target.checked })}
              />
              RX Enable (PD2, pin 19)
            </label>
          </div>

          {/* Interrupts */}
          <div className="space-y-1 border-t border-gray-700 pt-3">
            <h4 className="text-xs text-gray-400 font-medium">Interrupts</h4>
            <label className="flex items-center gap-2 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={config.rxcie}
                onChange={e => update({ rxcie: e.target.checked })}
              />
              RXCIE (RX Complete)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={config.txcie}
                onChange={e => update({ txcie: e.target.checked })}
              />
              TXCIE (TX Complete)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={config.udrie}
                onChange={e => update({ udrie: e.target.checked })}
              />
              UDRIE (Data Register Empty)
            </label>
          </div>
        </>
      )}
    </div>
  );
}
