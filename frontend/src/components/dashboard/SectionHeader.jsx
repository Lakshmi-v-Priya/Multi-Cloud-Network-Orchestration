
function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-1 text-xs text-slate-500">
            {subtitle}
          </p>
        )}
      </div>

      {action}
    </div>
  )
}

export default SectionHeader
