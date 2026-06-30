'use client'

import { Plus_Jakarta_Sans } from 'next/font/google'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] })

type Cat = { name: string; count: number }

const META: Record<string, { icon: string; color: string }> = {
  verkeersregels: { icon: '🚦', color: '#0066CC' },
  verkeersinzicht: { icon: '🧠', color: '#8b5cf6' },
  gevaarherkenning: { icon: '⚠️', color: '#f97316' },
  voertuig: { icon: '🚗', color: '#16a34a' },
}
function metaFor(name: string) {
  const k = name.toLowerCase()
  if (k.includes('regel')) return META.verkeersregels
  if (k.includes('inzicht')) return META.verkeersinzicht
  if (k.includes('gevaar')) return META.gevaarherkenning
  if (k.includes('voertuig') || k.includes('milieu')) return META.voertuig
  return { icon: '📘', color: '#0066CC' }
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [naam, setNaam] = useState('')
  const [active, setActive] = useState(false)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [cats, setCats] = useState<Cat[]>([])

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const meta = session.user.user_metadata as { voornaam?: string } | undefined
      setNaam(meta?.voornaam ?? '')

      try {
        const res = await fetch('/api/access', { headers: { Authorization: `Bearer ${session.access_token}` } })
        const data = await res.json()
        setActive(Boolean(data.active))
        setExpiresAt(data.expiresAt ?? null)

        if (data.active) {
          const [{ data: catRows }, { data: qRows }] = await Promise.all([
            supabase.from('categories').select('name, sort_order').order('sort_order'),
            supabase.from('questions').select('categories(name)').eq('status', 'published'),
          ])
          const tally: Record<string, number> = {}
          ;((qRows ?? []) as unknown as Array<{ categories: { name: string } | null }>).forEach(r => {
            const n = r.categories?.name
            if (n) tally[n] = (tally[n] ?? 0) + 1
          })
          const list = ((catRows ?? []) as unknown as Array<{ name: string }>).map(c => ({ name: c.name, count: tally[c.name] ?? 0 }))
          setCats(list)
        }
      } catch { /* keep defaults */ }
      setLoading(false)
    })()
  }, [router])

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const daysLeft = expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)) : 0
  const totalQ = cats.reduce((s, c) => s + c.count, 0)

  return (
    <main className={jakarta.className} style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <nav style={{ background: 'linear-gradient(135deg,#1e3a8a,#0066CC)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem' }}>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem' }}>A+ Theorie</span>
        <button onClick={logout} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Uitloggen</button>
      </nav>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '2rem 1.25rem 3rem' }}>
        {loading ? (
          <p style={{ color: '#64748b' }}>Laden…</p>
        ) : !active ? (
          <div style={{ background: '#fff', borderRadius: '1.25rem', boxShadow: '0 4px 16px -4px rgb(0 0 0 / 0.1)', padding: '2rem', marginTop: '1rem' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0066CC', marginBottom: '0.25rem' }}>Welkom terug{naam ? `, ${naam}` : ''} 👋</h1>
            <span style={{ display: 'inline-block', background: '#fef2f2', color: '#dc2626', fontWeight: 700, fontSize: '0.85rem', padding: '0.35rem 0.9rem', borderRadius: 999, marginTop: '0.75rem' }}>Geen actieve toegang</span>
            <p style={{ color: '#475569', marginTop: '0.9rem' }}>Kies een pakket om te beginnen met oefenen.</p>
            <button onClick={() => router.push('/betalen')} style={{ marginTop: '1.25rem', background: '#f97316', color: '#fff', fontWeight: 700, fontSize: '1rem', padding: '0.8rem 2rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Kies een pakket →</button>
          </div>
        ) : (
          <>
            {/* Hero greeting + access */}
            <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#0066CC)', borderRadius: '1.5rem', padding: '1.75rem', color: '#fff', marginTop: '1rem', boxShadow: '0 20px 40px -16px rgb(0 102 204 / 0.5)' }}>
              <h1 style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: '0.35rem' }}>Welkom terug{naam ? `, ${naam}` : ''} 👋</h1>
              <p style={{ opacity: 0.9, fontSize: '0.95rem', marginBottom: '1.25rem' }}>Klaar om te oefenen voor je theorie-examen?</p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '0.8rem', padding: '0.75rem 1rem', minWidth: 120 }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{daysLeft}</div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>dagen toegang</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '0.8rem', padding: '0.75rem 1rem', minWidth: 120 }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{totalQ}</div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>oefenvragen</div>
                </div>
              </div>
              <p style={{ opacity: 0.85, fontSize: '0.8rem', marginTop: '1rem' }}>
                Geldig tot {expiresAt ? new Date(expiresAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
              </p>
            </div>

            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '2rem 0 1rem' }}>Oefen per categorie</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }}>
              {cats.map(c => {
                const m = metaFor(c.name)
                return (
                  <button key={c.name} onClick={() => router.push(`/oefenen?categorie=${encodeURIComponent(c.name)}`)} style={{ textAlign: 'left', background: '#fff', border: '2px solid #eef2f7', borderRadius: '1rem', padding: '1.25rem', cursor: 'pointer', fontFamily: 'inherit', borderLeft: `5px solid ${m.color}` }}>
                    <div style={{ fontSize: '1.6rem' }}>{m.icon}</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.5rem' }}>{c.name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 2 }}>{c.count} {c.count === 1 ? 'vraag' : 'vragen'}</div>
                    <div style={{ color: m.color, fontWeight: 700, fontSize: '0.9rem', marginTop: '0.75rem' }}>Oefenen →</div>
                  </button>
                )
              })}

              {/* Mock exam teaser */}
              <div style={{ background: '#f1f5f9', border: '2px dashed #cbd5e1', borderRadius: '1rem', padding: '1.25rem' }}>
                <div style={{ fontSize: '1.6rem' }}>📝</div>
                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.5rem' }}>Proefexamen</div>
                <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 2 }}>CBR-stijl, op tijd</div>
                <div style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.9rem', marginTop: '0.75rem' }}>Binnenkort</div>
              </div>
            </div>

            <button onClick={() => router.push('/oefenen')} style={{ marginTop: '1.75rem', width: '100%', background: 'linear-gradient(135deg,#1e3a8a,#0066CC)', color: '#fff', fontWeight: 700, fontSize: '1rem', padding: '0.9rem', borderRadius: '0.7rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Start met oefenen →
            </button>
          </>
        )}
      </div>
    </main>
  )
}
