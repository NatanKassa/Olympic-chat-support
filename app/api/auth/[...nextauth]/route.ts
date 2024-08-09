import { NextAuthOptions } from "next-auth"
import GoogleProvider from 'next-auth/providers/google'
import NextAuth from "next-auth"
import { PrismaClient } from "@prisma/client"

// Initialize Prisma Client
const prisma = new PrismaClient()

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

const authOption: NextAuthOptions = {
  session: {
    strategy: 'jwt'
  },
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET
    })
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (!profile?.email) {
        throw new Error('No email found in profile')
      }

      await prisma.user.upsert({
        where: { email: profile.email },
        create: {
          email: profile.email,
          name: profile.name,
        },
        update: {
          name: profile.name,
        }
      })

      return true // Allow sign-in
    },
  }
}

const handler = NextAuth(authOption)
export {handler as GET, handler as POST}
