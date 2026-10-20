'use client';

export default function PriorityBadge({ priority }) {
  const configs = {
    LOW: {
      label: 'Low',
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-200',
    },
    NORMAL: {
      label: 'Normal',
      bg: 'bg-[#F2EDF7]',
      text: 'text-[#4C2365]',
      border: 'border-[#C4A4DA]',
    },
    HIGH: {
      label: 'High',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
    },
    URGENT: {
      label: 'Urgent',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-300',
    },
  };

  const config = configs[priority] || configs.NORMAL;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border}`}
    >
      {config.label}
    </span>
  );
}
