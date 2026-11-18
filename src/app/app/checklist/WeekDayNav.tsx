'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export default function WeekDayNav({
  recentDays,
  selectedDate,
  todayStr,
}: {
  recentDays: string[]  // 7 items: oldest → today
  selectedDate: string
  todayStr: string
}) {
  return (
    <div className="flex gap-1 justify-between">
      {recentDays.map((dayStr) => {
        const dateObj = new Date(dayStr + 'T00:00:00')
        const dayOfWeek = DAY_LABELS[dateObj.getDay()]
        const dayNum = dateObj.getDate()
        const isSelected = dayStr === selectedDate
        const isToday = dayStr === todayStr

        return (
          <Link
            key={dayStr}
            aria-current={isSelected ? 'date' : undefined}
            href={`/app/checklist?date=${dayStr}`}
            className={cn(
              'flex-1 flex flex-col items-center py-2 px-1 rounded-lg transition-colors text-center',
              isSelected
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted hover:bg-muted/80',
              isToday && !isSelected && 'border-2 border-primary'
            )}
          >
            <span className="text-xs font-medium">{dayOfWeek}</span>
            <span className="text-sm font-bold">{dayNum}</span>
          </Link>
        )
      })}
    </div>
  )
}
