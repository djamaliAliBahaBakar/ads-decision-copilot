import { NextResponse } from 'next/server'
import { getAccess } from '@/lib/access'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/get-or-create-user'
import Stripe from 'stripe'

// Force Node.js runtime (not Edge) for Stripe SDK compatibility
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-01-28.clover' })
  : null

export async function POST() {
  try {
    // Check authentication
    const access = await getAccess()
    if (!access) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Must be a paid user
    if (!access.isPaid) {
      return NextResponse.json({ error: 'Aucun abonnement actif' }, { status: 400 })
    }

    // Get user
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Get subscription with Stripe customer ID
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    })

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Aucun identifiant client Stripe trouvé' },
        { status: 400 }
      )
    }

    // If Stripe not configured, return error
    if (!stripe) {
      console.error('Stripe not configured')
      return NextResponse.json(
        { error: 'Stripe non configuré' },
        { status: 500 }
      )
    }

    // Create Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session' },
      { status: 500 }
    )
  }
}
