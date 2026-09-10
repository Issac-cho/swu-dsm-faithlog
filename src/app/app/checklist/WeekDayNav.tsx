'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export default function WeekDayNav({
  weekDays,
  selectedDate,
  todayStr,
}: {
  weekDays: string[]        // 7 items: Sun → Sat
  selectedDate: string
  todayStr: string
}) {
  return (
    <div className="flex gap-1 justify-between">
      {weekDays.map((dayStr, idx) => {
        const isFuture = dayStr > todayStr
        const isSelected = dayStr === selectedDate
        const isToday = dayStr === todayStr

        const label = DAY_LABELS[idx]
        const dayNum = parseInt(dayStr.split('-')[2])

        if (isFuture) {
          return (
            <div
              key={dayStr}
              className="flex-1 flex flex-col items-center py-2 px-1 rounded-lg opacity-30 cursor-not-allowed bg-muted"
            >
              <span className="text-[10px] font-medium">{label}</span>
              <span className="text-sm font-bold">{dayNum}</span>
            </div>
          )
        }

        return (
          <Link
            key={dayStr}
            href={`/app/checklist?date=${dayStr}`}
            className={cn(
              'flex-1 flex flex-col items-center py-2 px-1 rounded-lg transition-colors text-center',
              isSelected
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted hover:bg-muted/80',
              isToday && !isSelected && 'border-2 border-primary'
            )}
          >
            <span className="text-[10px] font-medium">{label}</span>
            <span className="text-sm font-bold">{dayNum}</span>
          </Link>
        )
      })}
    </div>
  )
}
