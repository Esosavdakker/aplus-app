'use client'

import { Plus_Jakarta_Sans } from 'next/font/google'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] })

type Option = { id: string; label: string; is_correct: boolean; sort_order: number }
type Question = {
  id: string
  stem: string
  explanation: string | null
  categorie: string
  opties: Option[]
}

export default function OefenenPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [all, setAll] = useState<Question[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [cat, setCat] = useState<string | null>(null)
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      // gate on active access
      const acc = await fetch('/api/access', { headers: { Authorization: `Bearer ${session.access_token}` } }).then(r => r.json()).catch(() => ({ active: false }))
      if (!acc.active) { router.replace('/dashboard'); return }

      const { data } = await supabase
        .from('questions')
        .select('id, stem, explanation, categories(name), question_options(id,label,is_correct,sort_order)')
        .eq('status', 'published')

      const rows = (data ?? []) as unknown as Array<{
        id: string; stem: string; explanation: string | null
        categories: { name: string } | null
        question_options: Option[]
      }>

      const qs: Question[] = rows.map(r => ({
        id: r.id,
        stem: r.stem,
        explanation: r.explanation,
        categorie: r.categories?.name ?? 'Overig',
        opties: [...(r.question_options ?? [])].sort((a, b) => a.sort_order - b.sort_order),
      }))

      setAll(qs)
      setCategories(Array.from(new Set(qs.map(q => q.categorie))).sort())
      setLoading(false)
    })()
  }, [router])

  const vragen = cat ? all.filter(q => q.categorie === cat) : []
  const vraag = vragen[idx]
  const beantwoord = picked !== null

  function kies(optieId: string) {
    if (!beantwoord) setPicked(optieId)
  }
  function volgende() {
    setPicked(null)
    setIdx(i => i + 1)
  }
  function terugNaarCategorieen() {
    setCat(null); setIdx(0); setPicked(null)
  }

  const wrap: React.CSSProperties = { minHeight: '100vh', background: '#f8fafc' }
  const nav = (
    <nav style={{ background: 'linear-gradient(135deg,#1e3a8a,#0066CC)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem' }}>
      <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem' }}>A+ Theorie</span>
      <button onClick={() => router.push('/dashboard')} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Dashboard</button>
    </nav>
  )

  if (loading) {
    return <main className={jakarta.className} style={wrap}>{nav}<p style={{ padding: '2rem', color: '#64748b' }}>Vragen laden…</p></main>
  }

  // Category picker
  if (!cat) {
    return (
      <main className={jakarta.className} style={wrap}>
        {nav}
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0066CC', marginBottom: '1.5rem' }}>Kies een categorie</h1>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {categories.map(c => {
              const n = all.filter(q => q.categorie === c).length
              return (
                <button key={c} onClick={() => { setCat(c); setIdx(0); setPicked(null) }} style={{ textAlign: 'left', background: '#fff', border: '2px solid #e2e8f0', borderRadius: '1rem', padding: '1.25rem 1.5rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem' }}>{c}</div>
                  <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 4 }}>{n} {n === 1 ? 'vraag' : 'vragen'}</div>
                </button>
              )
            })}
          </div>
        </div>
      </main>
    )
  }

  // Finished a category
  if (!vraag) {
    return (
      <main className={jakarta.className} style={wrap}>
        {nav}
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem' }}>🎉</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a', margin: '0.5rem 0' }}>Categorie afgerond!</h1>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>Je hebt alle vragen van “{cat}” gedaan.</p>
          <button onClick={terugNaarCategorieen} style={{ background: 'linear-gradient(135deg,#1e3a8a,#0066CC)', color: '#fff', fontWeight: 700, padding: '0.8rem 2rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Andere categorie kiezen</button>
        </div>
      </main>
    )
  }

  // Question view
  return (
    <main className={jakarta.className} style={wrap}>
      {nav}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          <span>{cat}</span>
          <span>Vraag {idx + 1} / {vragen.length}</span>
        </div>
        <div style={{ background: '#fff', borderRadius: '1.25rem', boxShadow: '0 4px 16px -4px rgb(0 0 0 / 0.1)', padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.5, marginBottom: '1.25rem' }}>{vraag.stem}</h2>
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            {vraag.opties.map(o => {
              let border = '2px solid #e2e8f0'; let bg = '#fff'
              if (beantwoord) {
                if (o.is_correct) { border = '2px solid #16a34a'; bg = '#f0fdf4' }
                else if (o.id === picked) { border = '2px solid #dc2626'; bg = '#fef2f2' }
              }
              return (
                <button key={o.id} onClick={() => kies(o.id)} disabled={beantwoord} style={{ textAlign: 'left', border, background: bg, borderRadius: '0.7rem', padding: '0.9rem 1.1rem', cursor: beantwoord ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: '0.95rem', color: '#0f172a' }}>
                  {o.label}
                  {beantwoord && o.is_correct && <span style={{ float: 'right', color: '#16a34a', fontWeight: 700 }}>✓</span>}
                  {beantwoord && !o.is_correct && o.id === picked && <span style={{ float: 'right', color: '#dc2626', fontWeight: 700 }}>✕</span>}
                </button>
              )
            })}
          </div>

          {beantwoord && vraag.explanation && (
            <div style={{ marginTop: '1.25rem', background: '#f8fafc', borderRadius: '0.7rem', padding: '1rem 1.1rem', color: '#475569', fontSize: '0.9rem', lineHeight: 1.6 }}>
              <strong style={{ color: '#0066CC' }}>Uitleg:</strong> {vraag.explanation}
            </div>
          )}

          {beantwoord && (
            <button onClick={volgende} style={{ marginTop: '1.5rem', width: '100%', background: 'linear-gradient(135deg,#1e3a8a,#0066CC)', color: '#fff', fontWeight: 700, fontSize: '1rem', padding: '0.85rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              {idx + 1 < vragen.length ? 'Volgende vraag →' : 'Categorie afronden →'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
