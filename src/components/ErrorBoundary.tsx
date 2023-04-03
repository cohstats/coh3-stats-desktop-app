import React from "react"

class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true }
  }

  componentDidCatch(error: any, errorInfo: any) {
    // You can also log the error to an error reporting service
    // logErrorToMyService(error, errorInfo);
  }

  render() {
    // @ts-ignore
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div>
          There was an error rendering the component. Please report this problem
          in our Discord with as many details as possible.
          <br />
          Try to provide a warnings.log C:\Users\Username\Documents\My
          Games\Company of Heroes 3\warnings.log
        </div>
      )
    }

    // @ts-ignore
    return this.props.children
  }
}

export { ErrorBoundary }
