'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function HistoryTabs({ currentTab }: { currentTab: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`?${params.toString()}`)
  }

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="weekly">주간</TabsTrigger>
        <TabsTrigger value="monthly">월간</TabsTrigger>
        <TabsTrigger value="yearly">연간</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
