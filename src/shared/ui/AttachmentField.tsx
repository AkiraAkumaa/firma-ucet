import type { ChangeEvent } from 'react'
import { useT } from '../../i18n/I18nContext'
import type { Attachment } from '../../domain/attachments/types'
import { Button } from './Button'

interface AttachmentFieldProps {
  label: string
  value?: Attachment
  onChange: (attachment: Attachment | undefined) => void
  className?: string
}

export function AttachmentField({ label, value, onChange, className = '' }: AttachmentFieldProps) {
  const t = useT()

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onChange({ fileName: file.name, mimeType: file.type, blob: file })
    e.target.value = ''
  }

  const view = () => {
    if (!value) return
    const url = URL.createObjectURL(value.blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  return (
    <div className={`flex flex-col gap-1 text-sm ${className}`}>
      <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
      {value ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={view}
            className="truncate text-left text-blue-600 underline dark:text-blue-400"
          >
            {value.fileName}
          </button>
          <Button variant="ghost" onClick={() => onChange(undefined)}>
            {t.common.delete}
          </Button>
        </div>
      ) : (
        <input
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          onChange={handleFile}
          className="text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 dark:text-gray-400 dark:file:bg-gray-800 dark:file:text-gray-200"
        />
      )}
    </div>
  )
}
