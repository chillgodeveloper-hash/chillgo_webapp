import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';

export default async function Home() {
  const supabase = createServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role === 'partner') {
      redirect('/dashboard/partner');
    } else if (profile?.role === 'admin') {
      redirect('/dashboard/admin');
    } else {
      redirect('/feed');
    }
  } else {
    redirect('/auth/login');
  }
}
