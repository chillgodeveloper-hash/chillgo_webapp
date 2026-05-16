import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { verifyLineIdToken } from '@/lib/line-jwt';

async function findUserByEmail(admin: any, email: string): Promise<any | null> {
  // paginate listUsers so we don't miss users past page 1
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return null;
    const users = data?.users || [];
    const found = users.find((u: any) => u.email === email);
    if (found) return found;
    if (users.length < 1000) break;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { code, redirectUri, state } = await req.json();
    if (!code || !redirectUri) {
      return NextResponse.json({ error: 'Missing code or redirectUri' }, { status: 400 });
    }

    // CSRF state validation
    const cookieStore = cookies();
    const expectedState = cookieStore.get('line_oauth_state')?.value;
    if (!expectedState || !state || expectedState !== state) {
      return NextResponse.json({ error: 'Invalid OAuth state' }, { status: 400 });
    }

    const channelId = process.env.LINE_CHANNEL_ID!;
    const channelSecret = process.env.LINE_CHANNEL_SECRET!;

    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: channelId,
        client_secret: channelSecret,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}));
      return NextResponse.json({ error: err.error_description || 'Token exchange failed' }, { status: 400 });
    }

    const tokenData = await tokenRes.json();

    // Verify id_token signature & claims
    let idPayload;
    try {
      idPayload = verifyLineIdToken(tokenData.id_token, channelId, channelSecret);
    } catch (e: any) {
      return NextResponse.json({ error: `Invalid LINE token: ${e.message}` }, { status: 400 });
    }

    const lineUserId = idPayload.sub;
    const displayName = idPayload.name || 'LINE User';
    const pictureUrl = idPayload.picture || null;
    const verifiedEmail = idPayload.email || ''; // verified by LINE if present

    const supabaseAdmin = createServiceRoleClient();

    // Match existing profile by line_user_id (the authoritative join key)
    const { data: existingProfiles } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('line_user_id', lineUserId);

    const issueMagiclinkSession = async (email: string) => {
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
      });
      if (!linkData?.properties?.hashed_token) return null;
      const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ type: 'magiclink', token_hash: linkData.properties.hashed_token }),
      });
      if (!verifyRes.ok) return null;
      return await verifyRes.json();
    };

    if (existingProfiles && existingProfiles.length > 0) {
      const existingProfile = existingProfiles[0];
      const session = await issueMagiclinkSession(existingProfile.email);
      if (!session) {
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
      }
      const res = NextResponse.json({ session, isNew: false });
      res.cookies.set('line_oauth_state', '', { maxAge: 0, path: '/' });
      return res;
    }

    // First-time LINE login
    const targetEmail = verifiedEmail || `line_${lineUserId}@chillgo.local`;

    // If email is provided by LINE and matches an existing Supabase user, we
    // require explicit linking via a logged-in session (out of scope here) to
    // prevent account takeover. For now, refuse the link.
    if (verifiedEmail) {
      const existingUser = await findUserByEmail(supabaseAdmin, verifiedEmail);
      if (existingUser) {
        return NextResponse.json({
          error: 'มีบัญชีที่ใช้อีเมลนี้แล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่าน แล้วเชื่อม LINE จากหน้าโปรไฟล์',
        }, { status: 409 });
      }
    }

    const { data: authUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: targetEmail,
      // password is set to a strong random unknown value; user cannot log in by password
      password: require('crypto').randomBytes(48).toString('hex'),
      email_confirm: true,
      user_metadata: {
        full_name: displayName,
        avatar_url: pictureUrl,
        provider: 'line',
        line_user_id: lineUserId,
      },
    });

    if (createErr || !authUser?.user) {
      return NextResponse.json({ error: createErr?.message || 'Failed to create user' }, { status: 400 });
    }

    await supabaseAdmin.from('profiles').upsert({
      id: authUser.user.id,
      email: targetEmail,
      full_name: displayName,
      avatar_url: pictureUrl,
      line_user_id: lineUserId,
      role: null,
    }, { onConflict: 'id' });

    const session = await issueMagiclinkSession(targetEmail);
    if (!session) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    const res = NextResponse.json({ session, isNew: true });
    res.cookies.set('line_oauth_state', '', { maxAge: 0, path: '/' });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
