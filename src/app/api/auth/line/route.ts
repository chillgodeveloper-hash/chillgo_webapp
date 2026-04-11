import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { code, redirectUri } = await req.json();

    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: process.env.LINE_CHANNEL_ID!,
        client_secret: process.env.LINE_CHANNEL_SECRET!,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json();
      return NextResponse.json({ error: err.error_description || 'Token exchange failed' }, { status: 400 });
    }

    const tokenData = await tokenRes.json();

    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) {
      return NextResponse.json({ error: 'Failed to get LINE profile' }, { status: 400 });
    }

    const profile = await profileRes.json();
    const lineUserId = profile.userId;
    const displayName = profile.displayName;
    const pictureUrl = profile.pictureUrl;

    let email = '';
    if (tokenData.id_token) {
      try {
        const payload = JSON.parse(Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString());
        email = payload.email || '';
      } catch {}
    }

    const { data: existingProfiles } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('line_user_id', lineUserId);

    if (existingProfiles && existingProfiles.length > 0) {
      const existingProfile = existingProfiles[0];
      const { data: authData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: existingProfile.email,
      });

      if (authData?.properties?.hashed_token) {
        const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify({
            type: 'magiclink',
            token_hash: authData.properties.hashed_token,
          }),
        });

        if (verifyRes.ok) {
          const session = await verifyRes.json();
          return NextResponse.json({ session, isNew: false });
        }
      }

      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    const tempEmail = email || `line_${lineUserId}@chillgo.local`;

    const { data: authUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: tempEmail,
      password: `line_${lineUserId}_${Date.now()}`,
      email_confirm: true,
      user_metadata: {
        full_name: displayName,
        avatar_url: pictureUrl,
        provider: 'line',
        line_user_id: lineUserId,
      },
    });

    if (createErr) {
      if (createErr.message.includes('already been registered')) {
        const { data: existingAuth } = await supabaseAdmin.auth.admin.listUsers();
        const found = existingAuth?.users?.find((u: any) => u.email === tempEmail);
        if (found) {
          await supabaseAdmin.from('profiles').update({ line_user_id: lineUserId }).eq('id', found.id);

          const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: tempEmail,
          });

          if (linkData?.properties?.hashed_token) {
            const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              },
              body: JSON.stringify({
                type: 'magiclink',
                token_hash: linkData.properties.hashed_token,
              }),
            });

            if (verifyRes.ok) {
              const session = await verifyRes.json();
              return NextResponse.json({ session, isNew: false });
            }
          }
        }
      }
      return NextResponse.json({ error: createErr.message }, { status: 400 });
    }

    if (authUser?.user) {
      await supabaseAdmin.from('profiles').upsert({
        id: authUser.user.id,
        email: tempEmail,
        full_name: displayName,
        avatar_url: pictureUrl,
        line_user_id: lineUserId,
        role: null,
      }, { onConflict: 'id' });

      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: tempEmail,
      });

      if (linkData?.properties?.hashed_token) {
        const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify({
            type: 'magiclink',
            token_hash: linkData.properties.hashed_token,
          }),
        });

        if (verifyRes.ok) {
          const session = await verifyRes.json();
          return NextResponse.json({ session, isNew: true });
        }
      }
    }

    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
