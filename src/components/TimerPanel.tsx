import { useState } from 'react';
import {
  TimerConfig,
  TimerDef,
  ALL_TIMERS,
  PLL_TM_OPTIONS,
  calcFreq,
  calcOverflowTime,
  calcDuty,
  fmtFreq,
  fmtPeriod,
  effectiveTop,
  getChannelConfig,
  ChannelConfig,
} from '../data/timers';

interface TimerPanelProps {
  timerConfigs: Record<number, TimerConfig>;
  onChange: (timerN: number, cfg: TimerConfig) => void;
  fCpu: number;
}

const COM_LABELS_NON_PWM = ['Disconnected', 'Toggle on match', 'Clear on match', 'Set on match'];
const COM_LABELS_PWM = ['Disconnected', 'Toggle (WGM-dependent)', 'Non-inverting', 'Inverting'];

function TimerTab({
  tdef,
  cfg,
  onChange,
  fCpu,
}: {
  tdef: TimerDef;
  cfg: TimerConfig;
  onChange: (cfg: TimerConfig) => void;
  fCpu: number;
}) {
  const mode = tdef.modes[cfg.modeIdx];
  const cs = tdef.prescalers[cfg.prescalerIdx];
  const top = effectiveTop(tdef, cfg);
  const maxTop = (1 << tdef.bits) - 1;
  const freq = cfg.enabled ? calcFreq(tdef, cfg, fCpu) : null;
  const comLabels = mode.isPwm ? COM_LABELS_PWM : COM_LABELS_NON_PWM;

  const update = (partial: Partial<TimerConfig>) => {
    onChange({ ...cfg, ...partial });
  };

  const updateChannel = (letter: string, partial: Partial<ChannelConfig>) => {
    const existing = getChannelConfig(cfg, letter);
    const updated = { ...existing, ...partial };
    onChange({ ...cfg, channels: { ...cfg.channels, [letter]: updated } });
  };

  return (
    <div className="space-y-4">
      {/* Enable */}
      <label className="flex items-center gap-2 text-base text-gray-200">
        <input
          type="checkbox"
          checked={cfg.enabled}
          onChange={e => update({ enabled: e.target.checked })}
        />
        Enable {tdef.label}
      </label>

      {cfg.enabled && (
        <>
          {/* Mode */}
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Mode</label>
            <select
              value={cfg.modeIdx}
              onChange={e => update({ modeIdx: Number(e.target.value) })}
              className="w-full"
            >
              {tdef.modes.map((m, i) => (
                <option key={i} value={i}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Prescaler */}
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Prescaler</label>
            <select
              value={cfg.prescalerIdx}
              onChange={e => update({ prescalerIdx: Number(e.target.value) })}
              className="w-full"
            >
              {tdef.prescalers.map((p, i) => (
                <option key={i} value={i}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* TOP (if user-configurable) */}
          {mode.topFixed === null && (
            <div className="space-y-1">
              <label className="text-sm text-gray-400">
                TOP (0 &ndash; {maxTop})
              </label>
              <input
                type="number"
                min={0}
                max={maxTop}
                value={cfg.top}
                onChange={e => update({ top: Math.min(Math.max(0, Number(e.target.value)), maxTop) })}
                className="w-full"
              />
            </div>
          )}

          {/* Frequency / Period display */}
          <div className="text-sm font-mono space-y-0.5">
            <p className="text-yellow-400">
              Freq: {fmtFreq(freq)}
            </p>
            <p className="text-yellow-400">
              Period: {fmtPeriod(freq !== null ? 1 / freq : null)}
            </p>
          </div>

          {/* Normal mode: TCNT preload + TOIE */}
          {!mode.isPwm && mode.wgm === 0 && (
            <div className="space-y-2 border-t border-gray-700 pt-3">
              <h4 className="text-sm text-gray-400">Normal Mode</h4>
              <div className="space-y-1">
                <label className="text-sm text-gray-400">
                  TCNT preload (0 &ndash; {maxTop})
                </label>
                <input
                  type="range"
                  min={0}
                  max={maxTop}
                  value={cfg.tcnt}
                  onChange={e => update({ tcnt: Number(e.target.value) })}
                  className="w-full accent-blue-500"
                />
                <span className="text-sm font-mono text-gray-300">{cfg.tcnt}</span>
              </div>
              <p className="text-sm font-mono text-yellow-400">
                Overflow: {fmtPeriod(calcOverflowTime(tdef, cfg, fCpu))}
              </p>
              <label className="flex items-center gap-2 text-base text-gray-200">
                <input
                  type="checkbox"
                  checked={cfg.toie}
                  onChange={e => update({ toie: e.target.checked })}
                />
                TOIE (Overflow Interrupt)
              </label>
            </div>
          )}

          {/* CTC mode: OCIE + toggle freq */}
          {!mode.isPwm && mode.wgm !== 0 && (
            <div className="space-y-2 border-t border-gray-700 pt-3">
              <h4 className="text-sm text-gray-400">CTC Mode</h4>
              <label className="flex items-center gap-2 text-base text-gray-200">
                <input
                  type="checkbox"
                  checked={cfg.ocie}
                  onChange={e => update({ ocie: e.target.checked })}
                />
                OCIE (Compare Match Interrupt)
              </label>
              {freq !== null && (
                <p className="text-sm font-mono text-yellow-400">
                  OC Toggle freq: {fmtFreq(freq / 2)}
                </p>
              )}
            </div>
          )}

          {/* OC channels — visible in PWM and CTC modes (not Normal) */}
          {(mode.isPwm || (mode.wgm !== 0)) && (
            <div className="space-y-3 border-t border-gray-700 pt-3">
              <h4 className="text-sm text-gray-400">
                {mode.isPwm ? 'PWM Channels' : 'OC Channels'}
              </h4>
              {tdef.channels.map(ch => {
                const chCfg = getChannelConfig(cfg, ch.letter);
                const isCTC = !mode.isPwm && mode.wgm !== 0;
                const duty = top !== null ? calcDuty(chCfg.ocr, top) : 0;
                return (
                  <div key={ch.letter} className="space-y-1 bg-gray-800 rounded p-2">
                    <label className="flex items-center gap-2 text-base text-gray-200">
                      <input
                        type="checkbox"
                        checked={chCfg.enabled}
                        onChange={e => updateChannel(ch.letter, { enabled: e.target.checked })}
                      />
                      Channel {ch.letter} (OC{tdef.n}{ch.letter} → {ch.pinName}, pin {ch.pinNum})
                    </label>
                    {chCfg.enabled && (
                      <div className="ml-6 space-y-1">
                        <div>
                          <label className="text-sm text-gray-400">Output mode</label>
                          <select
                            value={chCfg.com}
                            onChange={e => updateChannel(ch.letter, { com: Number(e.target.value) })}
                            className="w-full"
                          >
                            {comLabels.map((l, i) => (
                              <option key={i} value={i}>{l}</option>
                            ))}
                          </select>
                        </div>
                        {/* OCR + Duty only for PWM, not CTC */}
                        {!isCTC && (
                          <>
                            <div>
                              <label className="text-sm text-gray-400">
                                OCR{tdef.n}{ch.letter} (0–{top ?? maxTop})
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={top ?? maxTop}
                                value={chCfg.ocr}
                                onChange={e =>
                                  updateChannel(ch.letter, {
                                    ocr: Math.min(
                                      Math.max(0, Number(e.target.value)),
                                      top ?? maxTop,
                                    ),
                                  })
                                }
                                className="w-full"
                              />
                            </div>
                            <p className="text-sm font-mono text-yellow-400">
                              Duty: {duty.toFixed(1)}%
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Timer 4 PLL */}
          {tdef.n === 4 && (
            <div className="space-y-2 border-t border-gray-700 pt-3">
              <h4 className="text-sm text-gray-400">PLL (Timer 4)</h4>
              <label className="flex items-center gap-2 text-base text-gray-200">
                <input
                  type="checkbox"
                  checked={cfg.pllEnabled}
                  onChange={e => update({ pllEnabled: e.target.checked })}
                />
                Enable PLL clock source
              </label>
              {cfg.pllEnabled && (
                <div className="space-y-1">
                  <label className="text-sm text-gray-400">PLLTM</label>
                  <select
                    value={cfg.pllTmIdx}
                    onChange={e => update({ pllTmIdx: Number(e.target.value) })}
                    className="w-full"
                  >
                    {PLL_TM_OPTIONS.map((o, i) => (
                      <option key={i} value={i}>{o.label}</option>
                    ))}
                  </select>
                  <p className="text-sm font-mono text-yellow-400">
                    T4 clock: {PLL_TM_OPTIONS[cfg.pllTmIdx].clockHz > 0
                      ? fmtFreq(PLL_TM_OPTIONS[cfg.pllTmIdx].clockHz)
                      : `F_CPU (${fmtFreq(fCpu)})`}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function TimerPanel({ timerConfigs, onChange, fCpu }: TimerPanelProps) {
  const [activeTimer, setActiveTimer] = useState(0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Timer sub-tabs */}
      <div className="flex border-b border-gray-700 bg-gray-800 shrink-0">
        {ALL_TIMERS.map(t => (
          <button
            key={t.n}
            onClick={() => setActiveTimer(t.n)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors border-b-2 ${
              activeTimer === t.n
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            T{t.n}
          </button>
        ))}
      </div>

      {/* Active timer content */}
      <div className="flex-1 overflow-auto p-3">
        {ALL_TIMERS.filter(t => t.n === activeTimer).map(t => (
          <TimerTab
            key={t.n}
            tdef={t}
            cfg={timerConfigs[t.n]}
            onChange={cfg => onChange(t.n, cfg)}
            fCpu={fCpu}
          />
        ))}
      </div>
    </div>
  );
}
