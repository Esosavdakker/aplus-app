'use client'
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html><body style={{ padding: 20, fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: 13 }}>
      <h2>App error (debug)</h2>
      <p><b>message:</b> {String(error?.message)}</p>
      <p><b>name:</b> {String(error?.name)}</p>
      <p><b>digest:</b> {String(error?.digest)}</p>
      <pre>{String(error?.stack)}</pre>
    </body></html>
  )
}
