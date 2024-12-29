import React from "react"
import { error as TauriError } from "tauri-plugin-log-api"
import { Stack, Text, Title } from "@mantine/core"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallbackMessage?: string
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
    TauriError(error.toString())
  }

  render() {
    if (this.state.hasError) {
      return (
        <Stack align="center" justify="center" style={{ minHeight: "100vh" }}>
          <Title order={2}>Oops! Something went wrong.</Title>
          <Text>
            {this.props.fallbackMessage ||
              "There was an error rendering this component. "}
          </Text>
          Please report this problem in our Discord with as many details as
          possible.
          <Text></Text>
          <Text size="sm">
            Try to provide a warnings.log file located at:
            <br />
            C:\Users\Username\Documents\My Games\Company of Heroes
            3\warnings.log
          </Text>
          <Text>
            You can also provide the logs from the COH3 Stats Desktop app which
            are located here:
            <br />
            C:\Users\Username\AppData\Roaming\com.coh3stats.desktop\logs
          </Text>
        </Stack>
      )
    }

    return this.props.children
  }
}

export const GameErrorBoundary: React.FC<React.PropsWithChildren> = ({
  children,
}) => (
  <ErrorBoundary fallbackMessage="Error in Game view. Please try refreshing.">
    {children}
  </ErrorBoundary>
)

export const SettingsErrorBoundary: React.FC<React.PropsWithChildren> = ({
  children,
}) => (
  <ErrorBoundary fallbackMessage="Error in Settings view. Please try again later.">
    {children}
  </ErrorBoundary>
)

export const ReplaysErrorBoundary: React.FC<React.PropsWithChildren> = ({
  children,
}) => (
  <ErrorBoundary fallbackMessage="Error loading Replays. Please check your connection.">
    {children}
  </ErrorBoundary>
)

export const AboutErrorBoundary: React.FC<React.PropsWithChildren> = ({
  children,
}) => (
  <ErrorBoundary fallbackMessage="Error loading About page. Please try again.">
    {children}
  </ErrorBoundary>
)

export { ErrorBoundary }
