import { NextRequest, NextResponse } from 'next/server'
import { getAccess } from '@/lib/access'
import { getOrCreateUser } from '@/lib/get-or-create-user'
import Stripe from 'stripe'

// Force Node.js runtime (not Edge) for Stripe SDK compatibility
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Initialize Stripe (will be undefined if STRIPE_SECRET_KEY not set)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-01-28.clover' })
  : null

// Price IDs from Stripe Dashboard
const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || 'price_monthly_placeholder',
  quarterly: process.env.STRIPE_PRICE_QUARTERLY || 'price_quarterly_placeholder',
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const access = await getAccess()
    if (!access) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Already paid
    if (access.isPaid) {
      return NextResponse.json({ error: 'Déjà abonné' }, { status: 400 })
    }

    // Get user
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Get plan from request
    const { plan } = await request.json()
    if (!plan || !['monthly', 'quarterly'].includes(plan)) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    // If Stripe not configured, return mock URL (for development)
    if (!stripe) {
      console.warn('Stripe not configured, returning mock checkout URL')
      return NextResponse.json({
        url: `/payment/success?session_id=mock_${Date.now()}`,
      })
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_IDS[plan as keyof typeof PRICE_IDS],
          quantity: 1,
        },
      ],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        plan,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: {
        metadata: {
          userId: user.id,
          plan,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session' },
      { status: 500 }
    )
  }
}
