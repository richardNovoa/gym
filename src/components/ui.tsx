import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'ink' | 'ghost' | 'quiet'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink',
  ink: 'bg-ink text-bg',
  ghost: 'border border-line bg-elev text-ink',
  quiet: 'bg-transparent text-muted',
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type={type}
      className={`tap inline-flex h-14 w-full items-center justify-center rounded-2xl px-5 text-lg font-medium disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function TextField({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-muted">{label}</span>
      <input className="field mt-2" {...props} />
      {hint ? <span className="mt-2 block text-sm text-muted">{hint}</span> : null}
    </label>
  )
}

export function TextArea({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-muted">{label}</span>
      <textarea
        className="mt-2 min-h-28 w-full rounded-2xl border border-line bg-elev px-4 py-3 text-lg outline-none focus:border-transparent focus:shadow-[0_0_0_2px_var(--accent)]"
        {...props}
      />
    </label>
  )
}

export function Notice({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'info' }) {
  return (
    <p
      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        tone === 'error' ? 'bg-danger/10 text-danger' : 'bg-elev text-muted'
      }`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </p>
  )
}

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-3xl border border-line bg-bg shadow-card lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:w-[32rem] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl"
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h2 className="font-display text-2xl">{title}</h2>
          <button type="button" className="tap h-11 rounded-full px-3 text-sm text-muted" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-8">{children}</div>
      </div>
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-line ${className}`} />
}
