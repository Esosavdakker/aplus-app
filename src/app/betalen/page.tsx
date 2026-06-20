'use client'

import { Plus_Jakarta_Sans } from 'next/font/google'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

const pakketten = [
  {
    id: 'basis',
    naam: 'Basis Pakket',
    prijs: 29,
    beschrijving: 'Ideaal als je al wat kennis hebt en gericht wilt oefenen.',
    features: ['Onbeperkt oefenexamens', 'Officieel CBR-materiaal', '30 dagen toegang'],
    populair: false,
    kleur: '#0066CC',
  },
  {
    id: 'compleet',
    naam: 'Compleet Pakket',
    prijs: 49,
    beschrijving: 'Ons meest populaire pakket met alles wat je nodig hebt.',
    features: ['Alles uit Basis', '90 dagen toegang', 'E-mail ondersteuning'],
    populair: true,
    kleur: '#f97316',
  },
]

export default function BetalenPage() {
  const router = useRouter()
  const [geselecteerd, setGeselecteerd] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
    })
  }, [router])

  async function handleBetalen() {
    if (!geselecteerd) return
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
        return
      }
      const res = await fetch('/api/betaling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ pakketId: geselecteerd }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        alert(data.error || 'Er is iets misgegaan. Probeer opnieuw.')
      }
    } catch {
      alert('Er is iets misgegaan. Probeer opnieuw.')
    }
    setLoading(false)
  }

  return (
    <main className={jakarta.className} style={{
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      {/* Navbar */}
      <nav style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #0066CC 100%)',
        padding: '0 2rem',
        height: '68px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 12px rgb(0 0 0 / 0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" width={40} height={40}>
            <circle cx="32" cy="32" r="31" fill="white"/>
            <circle cx="32" cy="32" r="29" fill="none" stroke="#0066CC" strokeWidth="4.5"/>
            <circle cx="32" cy="32" r="22" fill="none" stroke="#f97316" strokeWidth="3"/>
            <text x="29" y="44" fontFamily="'Arial Black',Arial,sans-serif" fontSize="30" fontWeight="900" fill="#0066CC" textAnchor="middle">A</text>
            <text x="47" y="35" fontFamily="'Arial Black',Arial,sans-serif" fontSize="20" fontWeight="900" fill="#f97316" textAnchor="middle">+</text>
          </svg>
          <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>A+ Theorie</span>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0066CC', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
            Kies jouw pakket
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>
            Selecteer een pakket en start direct met oefenen.
          </p>
        </div>

        {/* Pakket kaarten */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {pakketten.map((pakket) => (
            <div
              key={pakket.id}
              onClick={() => setGeselecteerd(pakket.id)}
              style={{
                background: '#ffffff',
                borderRadius: '1.25rem',
                padding: '2rem',
                cursor: 'pointer',
                border: geselecteerd === pakket.id
                  ? `2.5px solid ${pakket.kleur}`
                  : pakket.populair
                  ? '2.5px solid #f97316'
                  : '2px solid #e2e8f0',
                boxShadow: geselecteerd === pakket.id
                  ? `0 8px 24px -4px ${pakket.kleur}40`
                  : '0 4px 8px -2px rgb(0 0 0 / 0.08)',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {pakket.populair && (
                <div style={{
                  background: '#f97316',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.375rem 1rem',
                  borderRadius: '9999px',
                  display: 'inline-block',
                  marginBottom: '1rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}>
                  Meest gekozen
                </div>
              )}
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0066CC', marginBottom: '0.5rem' }}>
                {pakket.naam}
              </h2>
              <div style={{ marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0066CC', letterSpacing: '-0.03em' }}>€{pakket.prijs}</span>
                <span style={{ color: '#64748b', fontSize: '0.875rem', marginLeft: '0.25rem' }}>eenmalig</span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                {pakket.beschrijving}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pakket.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#0f172a' }}>
                    <span style={{ color: '#0066CC', fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>

              {geselecteerd === pakket.id && (
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  width: '24px',
                  height: '24px',
                  background: pakket.kleur,
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}>✓</div>
              )}
            </div>
          ))}
        </div>

        {/* Betaal knop */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleBetalen}
            disabled={!geselecteerd || loading}
            style={{
              background: geselecteerd ? 'linear-gradient(135deg, #1e3a8a 0%, #0066CC 100%)' : '#e2e8f0',
              color: geselecteerd ? '#ffffff' : '#94a3b8',
              fontWeight: 700,
              fontSize: '1rem',
              padding: '0.875rem 3rem',
              borderRadius: '0.625rem',
              border: 'none',
              cursor: geselecteerd ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              boxShadow: geselecteerd ? '0 8px 24px -4px rgb(0 102 204 / 0.35)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'Bezig...' : geselecteerd ? `Betalen met Mollie →` : 'Selecteer een pakket'}
          </button>
          <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '1rem' }}>
            🔒 Veilig betalen via Mollie
          </p>
        </div>
      </div>
    </main>
  )
}
