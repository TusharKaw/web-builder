import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Check if user is admin (you can implement your own admin logic here)
  // For now, we'll check if the user email is in a list of admin emails
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  const isAdmin = adminEmails.includes(session.user?.email || '')

  if (!isAdmin) {
    redirect('/dashboard')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isAdmin={true} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
