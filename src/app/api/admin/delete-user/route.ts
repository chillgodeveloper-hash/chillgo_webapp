import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceRoleClient } from '@/lib/supabase-server';

// Admin-only: permanently delete a user account and everything tied to it.
//
// Deleting from auth.users cascades to `profiles` (FK is ON DELETE CASCADE),
// which in turn cascades to partner_profiles -> posts and notifications.
// The remaining tables (bookings, chat, reviews, receipts, work_history,
// booking_locations) reference profiles WITHOUT cascade, so we clean those
// up first with the service-role client. This works regardless of whether
// migration_user_delete_cascade.sql has been applied.

// Best-effort delete that ignores "relation does not exist" (42P01) so the
// route works even when an optional table hasn't been created.
async function tryDelete(promise: any) {
  try {
    const { error } = await promise;
    if (error && error.code !== '42P01') {
      console.error('delete-user cleanup error:', error.code, error.message);
    }
  } catch (e: any) {
    console.error('delete-user cleanup threw:', e?.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // 1. Authenticate the caller and confirm they are an admin.
    const serverSupabase = createServerSupabase();
    const { data: { user: caller } } = await serverSupabase.auth.getUser();
    if (!caller) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const { data: callerProfile } = await serverSupabase
      .from('profiles').select('role').eq('id', caller.id).single();
    if (callerProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    if (userId === caller.id) {
      return NextResponse.json({ error: 'ไม่สามารถลบบัญชีของตัวเองได้' }, { status: 400 });
    }

    const svc = createServiceRoleClient();

    // 2. Gather the user's posts (their bookings cascade via booking_id, but
    //    OTHER people's bookings of this partner's posts must go too).
    const { data: profilesOfUser } = await svc
      .from('partner_profiles').select('id').eq('user_id', userId);
    const partnerProfileIds = (profilesOfUser || []).map((p: any) => p.id);

    let postIds: string[] = [];
    if (partnerProfileIds.length > 0) {
      const { data: posts } = await svc
        .from('posts').select('id').in('partner_id', partnerProfileIds);
      postIds = (posts || []).map((p: any) => p.id);
    }

    // 3. Delete bookings involving this user (as customer or partner) and any
    //    bookings made against this user's posts. Cascades to chat_messages,
    //    receipts, reviews, work_history, booking_locations via booking_id.
    await tryDelete(svc.from('bookings').delete().eq('customer_id', userId));
    await tryDelete(svc.from('bookings').delete().eq('partner_id', userId));
    if (postIds.length > 0) {
      await tryDelete(svc.from('bookings').delete().in('post_id', postIds));
      await tryDelete(svc.from('bookings').delete().in('alternative_post_id', postIds));
    }

    // 4. Clean up rows that point at the user directly but weren't tied to a
    //    deleted booking.
    await tryDelete(svc.from('chat_messages').delete().eq('sender_id', userId));
    await tryDelete(svc.from('chat_messages').delete().eq('receiver_id', userId));
    await tryDelete(svc.from('reviews').delete().eq('customer_id', userId));
    await tryDelete(svc.from('reviews').delete().eq('partner_id', userId));
    await tryDelete(svc.from('receipts').delete().eq('customer_id', userId));
    await tryDelete(svc.from('receipts').delete().eq('partner_id', userId));
    await tryDelete(svc.from('work_history').delete().eq('partner_id', userId));
    await tryDelete(svc.from('work_history').delete().eq('customer_id', userId));
    await tryDelete(svc.from('booking_locations').delete().eq('user_id', userId));

    // 5. Posts + partner profiles + notifications (profiles cascade handles the
    //    last two too, but delete explicitly so nothing blocks).
    if (partnerProfileIds.length > 0) {
      await tryDelete(svc.from('posts').delete().in('partner_id', partnerProfileIds));
    }
    await tryDelete(svc.from('partner_profiles').delete().eq('user_id', userId));
    await tryDelete(svc.from('notifications').delete().eq('user_id', userId));

    // 6. Finally delete the auth user — cascades the profiles row.
    const { error: authErr } = await svc.auth.admin.deleteUser(userId);
    if (authErr) {
      // If the auth user is already gone, make sure the profile row is too.
      await tryDelete(svc.from('profiles').delete().eq('id', userId));
      if (!/not found/i.test(authErr.message)) {
        return NextResponse.json({ error: authErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('delete-user endpoint error:', err);
    return NextResponse.json({ error: err.message || 'delete failed' }, { status: 500 });
  }
}
