import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET in .env.local')
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error: Verification failed', { status: 400 })
  }

  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses } = evt.data

    try {
      // Créer l'user
      const user = await prisma.user.create({
        data: {
          clerkId: id,
          email: email_addresses[0].email_address,
        },
      })

      // ✅ Créer les 3 règles par défaut
      await prisma.userRule.createMany({
        data: [
          {
            userId: user.id,
            ruleType: 'kill_if_cpl',
            threshold: 12,
            days: 3,
            isActive: true,
          },
          {
            userId: user.id,
            ruleType: 'scale_if_roas',
            threshold: 3,
            days: 2,
            isActive: true,
          },
          {
            userId: user.id,
            ruleType: 'kill_if_ctr_down',
            threshold: 0.8,
            days: 3,
            isActive: true,
          },
        ],
      })

      console.log(`✅ User created with default rules: ${email_addresses[0].email_address}`)
    } catch (error) {
      console.error('Error creating user or rules:', error)
      return new Response('Error creating user', { status: 500 })
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    try {
      await prisma.user.delete({
        where: { clerkId: id as string },
      })
      console.log(`✅ User deleted: ${id}`)
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  return new Response('Webhook received', { status: 200 })
}