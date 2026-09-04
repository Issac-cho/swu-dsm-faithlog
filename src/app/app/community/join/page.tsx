import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { revalidatePath } from 'next/cache'

export default async function JoinCommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user already has a membership
  const { data: membership } = await supabase
    .from('community_memberships')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (membership) {
    redirect('/app/dashboard')
  }

  // Get all available communities
  const { data: communities } = await supabase
    .from('communities')
    .select('*')
    .order('created_at', { ascending: true })

  async function joinCommunity(formData: FormData) {
    'use server'
    const communityId = formData.get('communityId') as string
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user && communityId) {
      await supabase.from('community_memberships').insert({
        community_id: communityId,
        user_id: user.id,
        role: 'member', // Default role
        // cell_id is null by default until admin assigns
      })
      revalidatePath('/app')
      redirect('/app/dashboard')
    }
  }

  async function createCommunity(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user && name) {
      // Create community
      const { data: community } = await supabase.from('communities').insert({ name }).select().single()
      if (community) {
        // Create admin membership
        await supabase.from('community_memberships').insert({
          community_id: community.id,
          user_id: user.id,
          role: 'admin',
        })
        revalidatePath('/app')
        redirect('/app/admin')
      }
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">공동체 가입</h1>
        <p className="text-muted-foreground">활동할 공동체를 선택해 주세요.</p>
        
        <div className="grid gap-4 mt-6">
          {communities?.map((community) => (
            <Card key={community.id}>
              <CardHeader>
                <CardTitle>{community.name}</CardTitle>
                <CardDescription>새로운 멤버를 기다리고 있습니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={joinCommunity}>
                  <input type="hidden" name="communityId" value={community.id} />
                  <Button type="submit">가입 신청하기</Button>
                </form>
              </CardContent>
            </Card>
          ))}
          {(!communities || communities.length === 0) && (
            <p className="text-sm text-muted-foreground">현재 가입 가능한 공동체가 없습니다.</p>
          )}
        </div>
      </div>

      <div className="pt-8 border-t">
        <h2 className="text-xl font-bold mb-4">새로운 공동체 만들기</h2>
        <Card>
          <CardHeader>
            <CardTitle>공동체 개설</CardTitle>
            <CardDescription>새로운 공동체를 만들고 관리자가 됩니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createCommunity} className="flex gap-2">
              <input 
                name="name" 
                placeholder="공동체 이름 입력" 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
                required 
              />
              <Button type="submit">만들기</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
