const { createClient } = require('@supabase/supabase-js')
const supabaseUrl = 'https://ohpqmvorgyhmhwukpkrg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ocHFtdm9yZ3lobWh3dWtwa3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MDQ4NTYsImV4cCI6MjEwNDA4MDg1Nn0.UXiNDV1V6KEzG0U6dAao3h146CHGHUmXyWhOua_o7tY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.from('weekly_reflections').select('*')
  console.log('Error:', error)
  console.log('Data:', JSON.stringify(data, null, 2))
}
run()
