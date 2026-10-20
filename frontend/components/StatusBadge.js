'use client';

export default function StatusBadge({ status }) {
  const configs = {
    PENDING: {
      label: 'Pending',
      bg: 'bg-[#F8F4FA]',
      text: 'text-[#7F5D99]',
      border: 'border-[#E8DFED]',
      dot: 'bg-[#9E7EB5]',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
    },
    SUBMITTED: {
      label: 'Submitted for Review',
      bg: 'bg-purple-50',
      text: 'text-[#4C2365]',
      border: 'border-[#C4A4DA]',
      dot: 'bg-[#7F5D99]',
    },
    CHANGES_REQUESTED: {
      label: 'Changes Requested',
      bg: 'bg-amber-50',
      text: 'text-[#A65D00]',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    COMPLETED: {
      label: 'Completed',
      bg: 'bg-emerald-50',
      text: 'text-[#237A4B]',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      border: 'border-gray-200',
      dot: 'bg-gray-400',
    },
  };

  const config = configs[status] || configs.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
