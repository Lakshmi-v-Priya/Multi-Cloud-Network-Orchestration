
import { Construction } from 'lucide-react'

function PagePlaceholder({ title, description }) {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-3xl flex-col items-center justify-center text-center">

      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Construction size={30} />
      </div>

      <h1 className="mt-6 text-2xl font-bold text-slate-900">
        {title}
      </h1>

      <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">
        {description}
      </p>

      <span className="mt-6 rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
        Module development pending
      </span>

    </div>
  )
}

export default PagePlaceholder
