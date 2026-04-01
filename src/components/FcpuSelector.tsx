interface FcpuOption {
  value: number;
  label: string;
}

interface FcpuSelectorProps {
  value: number;
  onChange: (v: number) => void;
  options: readonly FcpuOption[];
}

export default function FcpuSelector({ value, onChange, options }: FcpuSelectorProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-800 border-b border-gray-700">
      <label className="text-base text-gray-400 whitespace-nowrap">F_CPU:</label>
      <select
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 max-w-xs bg-gray-900 border border-gray-600 text-gray-100
                   rounded px-2 py-1 text-base font-mono"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
