import * as React from 'react';

/**
 * Catches any render/runtime error in the app tree and shows the real error
 * instead of a blank page. Critical for a shell app: an uncaught error must
 * not blank the whole surface with no explanation. Renders inside #lk-root so
 * it is styled, and prints the message + stack so the cause is diagnosable
 * without the browser console.
 */
type State = { error: Error | null; info: string };

export class LkErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null, info: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // surface to the browser console too, tagged so it's easy to find
    // eslint-disable-next-line no-console
    console.error('[LaunchKit] render error:', error, info.componentStack);
    this.setState({ info: info.componentStack ?? '' });
  }

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;
    return (
      <div style={{ minHeight: '100vh', background: '#FAF9F6', color: '#1A1917', padding: 32 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', fontFamily: 'IBM Plex Sans, system-ui, sans-serif' }}>
          <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6862' }}>
            Launch Kit: render error
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>The app hit an error while rendering.</h1>
          <p style={{ marginTop: 8, color: '#6B6862' }}>
            This is the app failing to render, not a blank page with no cause. The error is below, reload to retry.
          </p>
          <pre style={{ marginTop: 16, overflow: 'auto', border: '1px solid #E4E1DA', background: '#F1EFE9', padding: 12, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {String(error?.stack || error?.message || error)}
            {info ? '\n\nComponent stack:' + info : ''}
          </pre>
          <button
            type="button"
            onClick={() => this.setState({ error: null, info: '' })}
            style={{ marginTop: 16, border: '1px solid #C7431D', background: '#C7431D', color: '#fff', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}
          >
            Retry render
          </button>
        </div>
      </div>
    );
  }
}
