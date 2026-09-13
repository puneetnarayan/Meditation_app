import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ToastContext, type ToastVariant } from './ToastContext'
import styles from './Toast.module.css'

interface ToastMessage {
  id: string
  message: string
  variant: ToastVariant
}

const AUTO_DISMISS_MS = 4000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'default') => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current, { id, message, variant }])
      setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id))
      }, AUTO_DISMISS_MS)
    },
    [],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className={styles.viewport} role="status" aria-live="polite">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={[
                styles.toast,
                toast.variant === 'error' ? styles.error : undefined,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {toast.message}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
