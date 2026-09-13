import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './Button'
import styles from './ErrorBoundary.module.css'

export interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/** Catches rendering errors anywhere below it so a bug in one screen
 * shows a calm recovery message instead of a blank page or a raw
 * stack trace. Class component because React only supports error
 * boundaries via getDerivedStateFromError/componentDidCatch. */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Devtools-only — never shown to the user.
    console.error('Unhandled error in the app tree', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className={styles.wrapper} role="alert">
        <p className={styles.title}>Something went wrong</p>
        <p className={styles.description}>
          Sorry about that — please reload the page to keep going.
        </p>
        <Button onClick={this.handleReload}>Reload</Button>
      </div>
    )
  }
}
