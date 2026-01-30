import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <SignIn />

      {/* Legal links */}
      <div className="mt-8 flex items-center gap-3 text-xs text-gray-500">
        <Link href="/cgv" className="hover:text-gray-700 hover:underline">
          CGV
        </Link>
        <span>·</span>
        <Link href="/mentions-legales" className="hover:text-gray-700 hover:underline">
          Mentions légales
        </Link>
      </div>
    </div>
  )
}