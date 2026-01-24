import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { upgradeUserToPaid, downgradeUser } from '@/lib/access'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
  : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    console.error('Stripe not configured')
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId || session.client_reference_id

        if (!userId) {
          console.error('No userId in session metadata')
          break
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        const plan = session.metadata?.plan as 'monthly' | 'quarterly' || 'monthly'
        const amount = plan === 'monthly' ? 2900 : 7900

        await upgradeUserToPaid(userId, {
          customerId: session.customer as string,
          subscriptionId: subscription.id,
          priceId: subscription.items.data[0].price.id,
          plan,
          amount,
          periodEnd: new Date(subscription.current_period_end * 1000),
        })

        console.log(`User ${userId} upgraded to PAID`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) break

        // Check if subscription is active
        if (subscription.status === 'active') {
          // Update period end
          await upgradeUserToPaid(userId, {
            customerId: subscription.customer as string,
            subscriptionId: subscription.id,
            priceId: subscription.items.data[0].price.id,
            plan: subscription.metadata?.plan as 'monthly' | 'quarterly' || 'monthly',
            amount: subscription.items.data[0].price.unit_amount || 2900,
            periodEnd: new Date(subscription.current_period_end * 1000),
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) break

        await downgradeUser(userId)
        console.log(`User ${userId} downgraded to FREE_PREVIEW`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        // Handle failed payment - could send notification
        console.warn('Payment failed for invoice:', invoice.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
