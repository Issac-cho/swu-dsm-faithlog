const fs = require('fs');
let content = fs.readFileSync('src/app/app/admin/actions.ts', 'utf8');

content = content.replace(/const \{ data: membership \} = await supabase[\s\S]*?if \(!\['admin', 'sub_admin'\]\.includes\(membership\?\.role\)\) \{\s*return \{ error: '관리자 권한이 없습니다\.' \}\s*\}/g,
  `const { data: operatorData } = await supabase.from('system_operators').select('user_id').eq('user_id', user.id).maybeSingle();
  const isOperator = !!operatorData;
  const { data: membership } = await supabase.from('community_memberships').select('role').eq('user_id', user.id).eq('community_id', communityId).maybeSingle();
  if (!isOperator && !['admin', 'sub_admin'].includes(membership?.role)) return { error: '관리자 권한이 없습니다.' };`
);

content = content.replace(/const \{ data: myMembership \} = await supabase[\s\S]*?if \(!\['admin', 'sub_admin'\]\.includes\(myMembership\?\.role\)\) \{\s*return \{ error: '관리자 권한이 없습니다\.' \}\s*\}/g,
  `const { data: operatorData } = await supabase.from('system_operators').select('user_id').eq('user_id', user.id).maybeSingle();
  const isOperator = !!operatorData;
  const { data: myMembership } = await supabase.from('community_memberships').select('role').eq('user_id', user.id).eq('community_id', targetMembership.community_id).maybeSingle();
  if (!isOperator && !['admin', 'sub_admin'].includes(myMembership?.role)) return { error: '관리자 권한이 없습니다.' };`
);

fs.writeFileSync('src/app/app/admin/actions.ts', content);
