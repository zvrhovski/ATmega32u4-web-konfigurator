import {
  ADCConfig,
  ADC_REFS,
  ADC_PRESCALERS,
  SE_CHANNELS,
  DIFF_CHANNELS,
  fmtAdcClock,
  conversionTimeUs,
} from '../data/adc';

interface AdcPanelProps {
  config: ADCConfig;
  onChange: (cfg: ADCConfig) => void;
  fCpu: number;
}

export default function AdcPanel({ config, onChange, fCpu }: AdcPanelProps) {
  const update = (partial: Partial<ADCConfig>) => {
    onChange({ ...config, ...partial });
  };

  const toggleChannel = (idx: number) => {
    const next = new Set(config.enabledChannels);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    update({ enabledChannels: next });
  };

  const seCount = [...config.enabledChannels].filter(
    i => SE_CHANNELS.some(ch => ch.idx === i),
  ).length;
  const diffCount = [...config.enabledChannels].filter(
    i => DIFF_CHANNELS.some(ch => ch.idx === i),
  ).length;

  return (
    <div className="p-3 space-y-4 overflow-auto">
      {/* Enable */}
      <label className="flex items-center gap-2 text-base text-gray-200">
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={e => update({ enabled: e.target.checked })}
        />
        Enable ADC
      </label>

      {config.enabled && (
        <>
          {/* Reference */}
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Voltage Reference</label>
            <select
              value={config.refIdx}
              onChange={e => update({ refIdx: Number(e.target.value) })}
              className="w-full"
            >
              {ADC_REFS.map((r, i) => (
                <option key={i} value={i}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Prescaler */}
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Prescaler</label>
            <select
              value={config.prescalerIdx}
              onChange={e => update({ prescalerIdx: Number(e.target.value) })}
              className="w-full"
            >
              {ADC_PRESCALERS.map((p, i) => (
                <option key={i} value={i}>{p.label}</option>
              ))}
            </select>
            <p className="text-sm font-mono text-yellow-400">
              ADC clock: {fmtAdcClock(config.prescalerIdx, fCpu)} &mdash;{' '}
              Conversion: {conversionTimeUs(config.prescalerIdx, fCpu).toFixed(1)} us
            </p>
          </div>

          {/* Single-ended channels */}
          <div className="space-y-1">
            <h4 className="text-sm text-gray-400 font-medium">Single-Ended Channels</h4>
            <div className="grid grid-cols-2 gap-1">
              {SE_CHANNELS.map(ch => (
                <label
                  key={ch.idx}
                  className="flex items-center gap-1.5 text-sm text-gray-200
                             hover:bg-gray-700 rounded px-1 py-0.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={config.enabledChannels.has(ch.idx)}
                    onChange={() => toggleChannel(ch.idx)}
                  />
                  <span className="font-mono">{ch.label}</span>
                  {ch.pinName !== '\u2014' && (
                    <span className="text-gray-500">({ch.pinName})</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Differential channels */}
          <div className="space-y-1">
            <h4 className="text-sm text-gray-400 font-medium">Differential Channels</h4>
            <div className="grid grid-cols-1 gap-1 max-h-40 overflow-auto">
              {DIFF_CHANNELS.map(ch => (
                <label
                  key={ch.idx}
                  className="flex items-center gap-1.5 text-sm text-gray-200
                             hover:bg-gray-700 rounded px-1 py-0.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={config.enabledChannels.has(ch.idx)}
                    onChange={() => toggleChannel(ch.idx)}
                  />
                  <span className="font-mono">{ch.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="text-sm text-gray-400 border-t border-gray-700 pt-2">
            Selected: {seCount} single-ended, {diffCount} differential
          </div>
        </>
      )}
    </div>
  );
}
