import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/get-or-create-user'
import { upgradeUserToPaid } from '@/lib/access'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-01-28.clover' })
  : null

/**
 * Verify a Stripe checkout session and upgrade user if payment succeeded
 * This is a fallback for when webhooks don't work (local dev, webhook issues)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID manquant' }, { status: 400 })
    }

    // Mock session for development without Stripe
    if (!stripe || sessionId.startsWith('mock_')) {
      console.log('Mock session detected, upgrading user directly')
      await upgradeUserToPaid(user.id, {
        customerId: `mock_customer_${user.id}`,
        subscriptionId: `mock_sub_${Date.now()}`,
        priceId: 'mock_price',
        plan: 'monthly',
        amount: 2900,
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      return NextResponse.json({ success: true, upgraded: true })
    }

    // Verify real Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    // Check if session belongs to this user
    if (session.client_reference_id !== user.id && session.metadata?.userId !== user.id) {
      return NextResponse.json({ error: 'Session invalide pour cet utilisateur' }, { status: 403 })
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json({
        success: false,
        error: 'Paiement non complété',
        status: session.payment_status
      }, { status: 400 })
    }

    // Get subscription details
    const subscription = session.subscription as Stripe.Subscription

    if (!subscription) {
      return NextResponse.json({ error: 'Pas d\'abonnement trouvé' }, { status: 400 })
    }

    // Extract plan from metadata
    const plan = session.metadata?.plan as 'monthly' | 'quarterly' || 'monthly'
    const amount = plan === 'monthly' ? 2900 : 7900

    // Get period end
    const periodEnd = (subscription as any).current_period_end
      ? new Date((subscription as any).current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    // Upgrade user
    await upgradeUserToPaid(user.id, {
      customerId: session.customer as string,
      subscriptionId: subscription.id,
      priceId: subscription.items.data[0]?.price.id || 'unknown',
      plan,
      amount,
      periodEnd,
    })

    console.log(`User ${user.id} upgraded via session verification`)

    return NextResponse.json({ success: true, upgraded: true })
  } catch (error) {
    console.error('Session verification error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    )
  }
}
