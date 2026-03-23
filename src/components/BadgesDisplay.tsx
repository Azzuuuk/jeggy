'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  rarity: string
}

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'text-gray-300 border-gray-500/50 from-gray-500/10'
    case 'rare': return 'text-blue-400 border-blue-500/50 from-blue-500/10'
    case 'epic': return 'text-purple-400 border-purple-500/50 from-purple-500/10'
    case 'legendary': return 'text-yellow-400 border-yellow-500/50 from-yellow-500/10'
    default: return 'text-gray-400 border-gray-600/50 from-gray-500/10'
  }
}

export function BadgesDisplay({ userBadges }: { userBadges: string[] }) {
  const [allBadges, setAllBadges] = useState<Badge[]>([])

  useEffect(() => {
    const fetchBadges = async () => {
      const { data } = await supabase
        .from('badges')
        .select('id, name, description, icon, rarity, requirement_type, requirement_value')
        .order('requirement_value', { ascending: true })

      if (data) setAllBadges(data)
    }
    fetchBadges()
  }, [])

  if (allBadges.length === 0) return null

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {allBadges.map(badge => {
        const earned = userBadges.includes(badge.id)
        const colors = getRarityColor(badge.rarity)

        return (
          <div
            key={badge.id}
            className={`border rounded-sm p-3 text-center transition-all ${
              earned
                ? `${colors} bg-gradient-to-br to-transparent`
                : 'border-border opacity-25 grayscale'
            }`}
            title={badge.description}
          >
            <div className="text-3xl mb-1.5">{badge.icon}</div>
            <div className="font-semibold text-xs leading-tight">{badge.name}</div>
            {earned && (
              <div className="text-[9px] text-text-muted uppercase tracking-wider mt-1">{badge.rarity}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
