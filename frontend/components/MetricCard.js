'use client';

export default function MetricCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }) {
  const borderVariants = {
    default: 'border-[#E8DFED] hover:border-[#9E7EB5]',
    primary: 'border-[#C4A4DA] bg-gradient-to-br from-white to-[#FAF6FD]',
    warning: 'border-amber-200 bg-amber-50/30',
    danger: 'border-rose-200 bg-rose-50/30',
    success: 'border-emerald-200 bg-emerald-50/30',
  };

  const iconVariants = {
    default: 'bg-[#F2EDF7] text-[#4C2365]',
    primary: 'bg-[#7F5D99] text-white',
    warning: 'bg-amber-100 text-[#A65D00]',
    danger: 'bg-rose-100 text-[#B42318]',
    success: 'bg-emerald-100 text-[#237A4B]',
  };

  return (
    <div
      className={`p-5 rounded-2xl bg-white border transition-all duration-200 shadow-xs hover:shadow-md ${
        borderVariants[variant] || borderVariants.default
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#6B6172]">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl ${iconVariants[variant] || iconVariants.default}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-[#251A2D]">{value}</span>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend.isPositive ? 'text-[#237A4B]' : 'text-[#B42318]'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-[#6B6172]">{subtitle}</p>}
    </div>
  );
}
