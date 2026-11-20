
import { ArrowUpRight } from 'lucide-react'

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color = 'blue',
  trend,
}) {
  const styles = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles[color]}`}>
          <Icon size={22} />
        </div>

        <ArrowUpRight size={18} className="text-slate-300" />
      </div>

      <p className="mt-5 text-sm text-slate-500">{title}</p>

      <h3 className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </h3>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-slate-400">{description}</p>

        {trend && (
          <span className="text-xs font-medium text-emerald-600">
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}

export default StatCard
