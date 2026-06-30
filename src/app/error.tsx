'use client'
export default function Error({ error }: { error: Error & { digest?: string } }) {
  return (
    <div style={{ padding: 20, fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: 13 }}>
      <h2>Page error (debug)</h2>
      <p><b>message:</b> {String(error?.message)}</p>
      <p><b>name:</b> {String(error?.name)}</p>
      <p><b>digest:</b> {String(error?.digest)}</p>
      <pre>{String(error?.stack)}</pre>
    </div>
  )
}
