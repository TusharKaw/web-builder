'use client'

import { useEffect, useState } from 'react'
import { Clock, Globe, PlusCircle, User } from 'lucide-react'

interface RecentChange {
  type: string
  ns?: number
  title: string
  revid?: number
  old_revid?: number
  rcid?: number
  timestamp: string
  user: string
  comment?: string
  logtype?: string
  logaction?: string
}

interface CreateWikiLog {
  title: string
  timestamp: string
  user: string
  comment?: string
  logtype: string
  action: string
}

export default function RecentChangesPage() {
  const [recentChanges, setRecentChanges] = useState<RecentChange[]>([])
  const [createLogs, setCreateLogs] = useState<CreateWikiLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/recent-changes?limit=100')
        const data = await res.json()
        setRecentChanges(data.recentChanges || [])
        setCreateLogs(data.createWikiLogs || [])
      } catch (e) {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const formatDate = (ts: string) => new Date(ts).toLocaleString()

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Recent Changes</h1>
        <p className="text-gray-600 mb-8">Live feed of edits and newly created websites from the MediaWiki backend.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CreateWiki / ManageWiki logs */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <PlusCircle className="w-5 h-5 text-green-600 mr-2" /> New Websites
                </h2>
                <p className="text-sm text-gray-500">CreateWiki/ManageWiki logs</p>
              </div>
              <div className="max-h-[28rem] overflow-y-auto divide-y">
                {loading ? (
                  <div className="p-4 text-gray-500">Loading...</div>
                ) : createLogs.length === 0 ? (
                  <div className="p-4 text-gray-500">No recent site creation logs.</div>
                ) : (
                  createLogs.map((log, i) => (
                    <div key={i} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900">{log.title || 'New wiki'}</div>
                        <span className="text-xs text-gray-500">{log.logtype}/{log.action}</span>
                      </div>
                      {log.comment && (
                        <div className="text-sm text-gray-600 mt-1">{log.comment}</div>
                      )}
                      <div className="flex items-center text-xs text-gray-500 mt-2">
                        <User className="w-3 h-3 mr-1" /> {log.user}
                        <span className="mx-2">•</span>
                        <Clock className="w-3 h-3 mr-1" /> {formatDate(log.timestamp)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recent changes feed */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Globe className="w-5 h-5 text-blue-600 mr-2" /> Edits & Activity
                </h2>
                <p className="text-sm text-gray-500">MediaWiki recent changes</p>
              </div>
              <div className="max-h-[36rem] overflow-y-auto divide-y">
                {loading ? (
                  <div className="p-4 text-gray-500">Loading...</div>
                ) : recentChanges.length === 0 ? (
                  <div className="p-4 text-gray-500">No recent changes.</div>
                ) : (
                  recentChanges.map((rc, i) => (
                    <div key={i} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-blue-700">{rc.title}</div>
                        <span className="text-xs text-gray-500 uppercase">{rc.type}{rc.logtype ? ` / ${rc.logtype}` : ''}</span>
                      </div>
                      {rc.comment && (
                        <div className="text-sm text-gray-700 mt-1">{rc.comment}</div>
                      )}
                      <div className="flex items-center text-xs text-gray-500 mt-2">
                        <User className="w-3 h-3 mr-1" /> {rc.user}
                        <span className="mx-2">•</span>
                        <Clock className="w-3 h-3 mr-1" /> {formatDate(rc.timestamp)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


