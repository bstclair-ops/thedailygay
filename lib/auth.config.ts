import GitHub from 'next-auth/providers/github'
import type { NextAuthConfig } from 'next-auth'

/**
 * Edge-safe auth config — NO Prisma imports.
 * Used by middleware and extended by lib/auth.ts with the Prisma adapter.
 */
export const authConfig: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user
      const pathname = nextUrl.pathname

      if (pathname === '/admin/login') return true

      if (pathname.startsWith('/admin')) {
        if (!isLoggedIn) return false
        const role = (session as any)?.user?.role
        if (role !== 'ADMIN' && role !== 'EDITOR') {
          return Response.redirect(new URL('/', nextUrl))
        }
        return true
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    session({ session, token }: any) {
      session.user.id = token.id as string
      session.user.role = token.role
      return session
    },
  },
  pages: {
    signIn: '/admin/login',
  },
}
