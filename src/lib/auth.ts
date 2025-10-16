import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  // Use adapter for OAuth providers, but handle credentials manually
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' }
      },
      async authorize(credentials) {
        console.log('🔐 Authorize called with:', { 
          email: credentials?.email, 
          hasPassword: !!credentials?.password,
          hasName: !!credentials?.name 
        })

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing email or password')
          return null
        }

        try {
          // Check if user exists
          let user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          console.log('👤 User lookup result:', user ? 'Found' : 'Not found')

          // If user doesn't exist and we have a name, create new user (signup)
          if (!user && credentials.name) {
            console.log('🆕 Creating new user...')
            const hashedPassword = await bcrypt.hash(credentials.password, 12)
            
            user = await prisma.user.create({
              data: {
                email: credentials.email,
                name: credentials.name,
                password: hashedPassword,
              }
            })
            console.log('✅ New user created:', user.id)
          }

          if (!user) {
            console.log('❌ No user found and no name provided for signup')
            return null
          }

          // Check password
          const isPasswordValid = user.password 
            ? await bcrypt.compare(credentials.password, user.password)
            : false

          console.log('🔑 Password validation:', isPasswordValid ? 'Valid' : 'Invalid')

          if (!isPasswordValid) {
            return null
          }

          console.log('✅ Authentication successful for:', user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error) {
          console.error('❌ Auth error:', error)
          return null
        }
      }
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id
      }
      return token
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
