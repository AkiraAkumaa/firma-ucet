import type { InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function TextField({ label, className = '', id, ...props }: TextFieldProps) {
  const inputId = id ?? `field-${label}`
  return (
    <label htmlFor={inputId} className={`flex flex-col gap-1 text-sm ${className}`}>
      <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <input
        id={inputId}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        {...props}
      />
    </label>
  )
}
