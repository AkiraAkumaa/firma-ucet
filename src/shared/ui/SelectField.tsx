import type { SelectHTMLAttributes } from 'react'

interface Option {
  value: string
  label: string
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: Option[]
}

export function SelectField({ label, options, className = '', id, ...props }: SelectFieldProps) {
  const selectId = id ?? `field-${label}`
  return (
    <label htmlFor={selectId} className={`flex flex-col gap-1 text-sm ${className}`}>
      <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <select
        id={selectId}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
