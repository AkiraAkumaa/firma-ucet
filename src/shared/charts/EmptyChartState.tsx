export function EmptyChartState({ text }: { text: string }) {
  return (
    <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-400 dark:border-gray-800">
      {text}
    </div>
  )
}
