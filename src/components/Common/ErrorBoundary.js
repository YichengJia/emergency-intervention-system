import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(/* error */) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You could log the error to an error reporting service
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <h2 className="text-xl font-semibold">Something went wrong.</h2>
          <p className="text-gray-700">Please try refreshing the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}