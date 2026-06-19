import { NextRequest, NextResponse } from 'next/server'
import { createMollieClient } from '@mollie/api-client'
import { getAdminClient } from '@/lib/supabaseAdmin'

const DAY_MS = 24 * 60 * 60 * 1000

export async function POST(req: NextRequest) {
  let paymentId: string | null = null
  try {
    const form = await req.formData()
    paymentId = (form.get('id') as string) || null
  } catch {
    return new NextResponse('OK', { status: 200 })
  }
  if (!paymentId) return new NextResponse('OK', { status: 200 })

  const admin = getAdminClient()

  try {
    // 1. Verify: never trust the request body — re-fetch from Mollie.
    const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY! })
    const payment = await mollie.payments.get(paymentId)
    const meta = (payment.metadata || {}) as { userId?: string; courseId?: string }

    // Audit log (best-effort).
    await admin
      .from('webhook_events')
      .insert({
        mollie_payment_id: paymentId,
        raw: { status: payment.status },
        processed_at: new Date().toISOString(),
      })
      .then(() => {}, () => {})

    if (payment.status !== 'paid') {
      await admin.from('orders').update({ status: payment.status }).eq('mollie_payment_id', paymentId)
      return new NextResponse('OK', { status: 200 })
    }

    // Idempotency: flip the order to 'paid' only if it isn't already.
    const { data: flipped } = await admin
      .from('orders')
      .update({ status: 'paid' })
      .eq('mollie_payment_id', paymentId)
      .neq('status', 'paid')
      .select('id')
      .maybeSingle()

    if (!flipped || !meta.userId || !meta.courseId) {
      return new NextResponse('OK', { status: 200 })
    }

    //  Grant or EXTEND time-boxed access.
    const { data: course } = await admin
      .from('courses')
      .select('access_days')
      .eq('id', meta.courseId)
      .single()
    const days = course?.access_days ?? 30

    const { data: existing } = await admin
      .from('course_access')
      .select('expires_at')
      .eq('user_id', meta.userId)
      .eq('course_id', meta.courseId)
      .maybeSingle()

    const now = Date.now()
    const currentExpiry = existing ? new Date(existing.expires_at).getTime() : 0
    const base = currentExpiry > now ? currentExpiry : now
    const expiresAt = new Date(base + days * DAY_MS).toISOString()

    await admin.from('course_access').upsert(
      {
        user_id: meta.userId,
        course_id: meta.courseId,
        order_id: flipped.id,
        starts_at: new Date().toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: 'user_id,course_id' }
    )

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('mollie webhook error:', error)
    // 500 so Mollie retries transient failures.
    return new NextResponse('Error', { status: 500 })
  }
}
