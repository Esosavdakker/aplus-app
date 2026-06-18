import { NextRequest, NextResponse } from 'next/server'
import { createMollieClient } from '@mollie/api-client'

const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY! })

const pakketten: Record<string, { naam: string; prijs: string }> = {
  basis: { naam: 'Basis Pakket', prijs: '29.00' },
  compleet: { naam: 'Compleet Pakket', prijs: '49.00' },
}

export async function POST(req: NextRequest) {
  try {
    const { pakketId } = await req.json()

    const pakket = pakketten[pakketId]
    if (!pakket) {
      return NextResponse.json({ error: 'Ongeldig pakket' }, { status: 400 })
    }

    const betaling = await mollie.payments.create({
      amount: {
        currency: 'EUR',
        value: pakket.prijs,
      },
      description: `A+ Theorie — ${pakket.naam}`,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/betalen/bevestiging`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/betalen/fout`,
      metadata: {
        pakketId,
      },
    })

    return NextResponse.json({ checkoutUrl: betaling.getCheckoutUrl() })
  } catch (error) {
    console.error('Mollie error:', error)
    return NextResponse.json({ error: 'Betaling kon niet worden aangemaakt' }, { status: 500 })
  }
}
