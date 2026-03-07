import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

// Use the edge-safe config (no Prisma imports) for middleware
export const { auth: middleware } = NextAuth(authConfig)

export default middleware

export const config = {
  matcher: ['/admin/:path*'],
}
