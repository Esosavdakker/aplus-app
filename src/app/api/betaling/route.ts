import { NextRequest, NextResponse } from 'next/server'
import { createMollieClient } from '@mollie/api-client'
import { createClient } from '@supabase/supabase-js'
import { getAdminClient } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: userData, error: userErr } = await supabase.auth.getUser(token)
  if (userErr || !userData.user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }
  const user = userData.user

  // Look up the package in the database (single source of truth for price) = match with frontend.
  const { pakketId } = await req.json()
  const admin = getAdminClient()
  const { data: course, error: courseErr } = await admin
    .from('courses')
    .select('id, slug, title, price_cents, is_active')
    .eq('slug', pakketId)
    .single()

  if (courseErr || !course || !course.is_active) {
    return NextResponse.json({ error: 'Ongeldig pakket' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  try {
    const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY! })

    const betaling = await mollie.payments.create({
      amount: { currency: 'EUR', value: (course.price_cents / 100).toFixed(2) },
      description: `A+ Theorie — ${course.title}`,
      redirectUrl: `${appUrl}/betalen/bevestiging`,
      cancelUrl: `${appUrl}/betalen/fout`,
      webhookUrl: `${appUrl}/api/webhooks/mollie`,
      metadata: { userId: user.id, courseId: course.id, courseSlug: course.slug },
    })

    await admin.from('orders').insert({
      user_id: user.id,
      course_id: course.id,
      mollie_payment_id: betaling.id,
      amount_cents: course.price_cents,
      status: 'open',
    })

    const checkoutUrl =
      typeof betaling.getCheckoutUrl === 'function'
        ? betaling.getCheckoutUrl()
        : (betaling as unknown as { _links?: { checkout?: { href?: string } } })._links?.checkout?.href

    return NextResponse.json({ checkoutUrl })
  } catch (error) {
    console.error('Mollie error:', error)
    return NextResponse.json({ error: 'Betaling kon niet worden aangemaakt' }, { status: 500 })
  }
}
