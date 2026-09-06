'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface DateJumpHeaderProps {
  type: 'weekly' | 'monthly' | 'yearly'
  currentYear: number
  currentMonth: number
  currentDay: number
  prevUrl: string
  nextUrl: string
  label: string
}

export default function DateJumpHeader({ 
  type, 
  currentYear, 
  currentMonth, 
  currentDay,
  prevUrl, 
  nextUrl, 
  label 
}: DateJumpHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  useEffect(() => {
    if (open) {
      setSelectedYear(currentYear)
      setSelectedMonth(currentMonth)
    }
  }, [open, currentYear, currentMonth])

  // generate years (currentYear - 5 to currentYear + 5)
  const years = Array.from({ length: 11 }).map((_, i) => currentYear - 5 + i)
  const months = Array.from({ length: 12 }).map((_, i) => i + 1)
  
  const handleJump = () => {
    setOpen(false)
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`
    
    const params = new URLSearchParams(searchParams.toString())
    params.set('date', dateStr)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-between mb-2 px-2 w-full">
      <Link href={prevUrl}>
        <Button variant="ghost" size="icon"><ChevronLeft className="h-5 w-5" /></Button>
      </Link>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="text-xl font-bold hover:bg-muted/50 px-4 py-2 h-auto">
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="center">
          <div className="flex gap-3 h-56 mb-3">
            <ScrollArea className="w-24 rounded-md border">
              <div className="p-1 space-y-1">
                {years.map(y => (
                  <Button 
                    key={y} 
                    variant={y === selectedYear ? 'default' : 'ghost'} 
                    size="sm" 
                    className="w-full"
                    onClick={() => setSelectedYear(y)}
                  >
                    {y}년
                  </Button>
                ))}
              </div>
            </ScrollArea>
            
            {type !== 'yearly' && (
              <ScrollArea className="w-24 rounded-md border">
                <div className="p-1 space-y-1">
                  {months.map(m => (
                    <Button 
                      key={m} 
                      variant={m === selectedMonth ? 'default' : 'ghost'} 
                      size="sm" 
                      className="w-full"
                      onClick={() => setSelectedMonth(m)}
                    >
                      {m}월
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          <Button className="w-full" onClick={handleJump}>이동</Button>
        </PopoverContent>
      </Popover>

      <Link href={nextUrl}>
        <Button variant="ghost" size="icon"><ChevronRight className="h-5 w-5" /></Button>
      </Link>
    </div>
  )
}
