import { handleMetaCallback } from '@/app/actions/meta'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return redirect(`/dashboard/settings?meta_error=${error}`)
  }

  if (!code || !state) {
    return redirect('/dashboard/settings?meta_error=missing_params')
  }

  try {
    await handleMetaCallback(code, state)
    return redirect('/dashboard/settings?meta_success=true')
  } catch (err) {
    console.error('Meta callback error:', err)
    return redirect(`/dashboard/settings?meta_error=${(err as Error).message}`)
  }
}