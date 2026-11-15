import { useEffect, useRef, useState } from 'react'

/** Keeps a text field editable without a refetch wiping the cursor. */
export function useDraft(value: string) {
  const [draft, setDraft] = useState(value)
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) setDraft(value)
  }, [value])

  return {
    draft,
    setDraft,
    onFocus: () => {
      focused.current = true
    },
    onBlur: () => {
      focused.current = false
    },
  }
}

export function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) return null
  return Math.max(0, Math.trunc(parsed))
}

export function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) return null
  return Math.max(0, parsed)
}
