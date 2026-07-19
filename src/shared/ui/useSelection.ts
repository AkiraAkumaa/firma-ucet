import { useMemo, useState } from 'react'

export interface Selection {
  isSelected: (id: number) => boolean
  toggle: (id: number) => void
  toggleAll: () => void
  clear: () => void
  selectedIds: number[]
  selectedCount: number
  allSelected: boolean
  someSelected: boolean
}

/** Výběr řádků pro hromadné akce — sada ID se resetuje při každém novém poli `ids` (jiná stránka/navigace). */
export function useSelection(ids: number[]): Selection {
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const validIds = useMemo(() => new Set(ids), [ids])
  const activeSelection = useMemo(() => new Set([...selected].filter((id) => validIds.has(id))), [selected, validIds])

  const toggle = (id: number) => {
    const next = new Set(activeSelection)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const toggleAll = () => {
    setSelected(activeSelection.size === ids.length ? new Set() : new Set(ids))
  }

  const clear = () => setSelected(new Set())

  return {
    isSelected: (id) => activeSelection.has(id),
    toggle,
    toggleAll,
    clear,
    selectedIds: [...activeSelection],
    selectedCount: activeSelection.size,
    allSelected: ids.length > 0 && activeSelection.size === ids.length,
    someSelected: activeSelection.size > 0 && activeSelection.size < ids.length,
  }
}
