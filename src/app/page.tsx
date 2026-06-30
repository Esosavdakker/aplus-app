'use client'

import { Plus_Jakarta_Sans } from 'next/font/google'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] })

export default function Home() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard')
      else setReady(true)
    })
  }, [router])

  if (!ready) return null

  return (
    <main className={jakarta.className} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg,#1e3a8a 0%,#0055aa 50%,#0066CC 100%)', padding: '1.5rem' }}>
      <div style={{ background: '#fff', borderRadius: '1.75rem', boxShadow: '0 40px 64px -12px rgb(0 0 0 / 0.18)', padding: '3rem 2.5rem', maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <svg viewBox="0 0 64 64" width={56} height={56} style={{ margin: '0 auto 1rem', display: 'block' }}>
          <circle cx="32" cy="32" r="31" fill="#fff" stroke="#0066CC" strokeWidth="4.5" />
          <circle cx="32" cy="32" r="22" fill="none" stroke="#f97316" strokeWidth="3" />
          <text x="29" y="44" fontFamily="Arial Black,Arial" fontSize="30" fontWeight="900" fill="#0066CC" textAnchor="middle">A</text>
          <text x="47" y="35" fontFamily="Arial Black,Arial" fontSize="20" fontWeight="900" fill="#f97316" textAnchor="middle">+</text>
        </svg>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0066CC', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
          Welkom bij A+ Theorie
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          Oefen voor je CBR theorie-examen: oefenvragen, uitleg en proefexamens — waar en wanneer je wilt.
        </p>
        <button onClick={() => router.push('/signup')} style={{ width: '100%', background: 'linear-gradient(135deg,#1e3a8a,#0066CC)', color: '#fff', fontWeight: 700, fontSize: '1rem', padding: '0.85rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '0.75rem' }}>
          Account aanmaken
        </button>
        <button onClick={() => router.push('/login')} style={{ width: '100%', background: '#fff', color: '#0066CC', fontWeight: 700, fontSize: '1rem', padding: '0.85rem', borderRadius: '0.625rem', border: '2px solid #e2e8f0', cursor: 'pointer', fontFamily: 'inherit' }}>
          Inloggen
        </button>
      </div>
    </main>
  )
}
