# ChillGo — Sweeping Security & Bug Fix Pass

สรุปการแก้ทั้งหมด — ดูรายละเอียดแบบตาราง Excel ได้ที่ `CHANGELOG_FIXES.csv`

## ขั้นตอน Deploy

1. **รัน migration ใหม่บน Supabase**: `supabase/migration_security_fixes.sql` (ครอบ RLS / triggers / enum / stripe_events / รีวิว trigger)
2. ตั้งค่า ENV เพิ่ม (ไม่มีใหม่ — ใช้ตัวเดิม `LINE_CHANNEL_SECRET` แต่ตอนนี้ใช้ verify id_token ด้วย)
3. Deploy code

## สรุปสถิติ

| Severity | จำนวน |
|----------|-------|
| Critical | 11 |
| High | 9 |
| Medium | 14 |
| Low | 13 |
| **รวม** | **47 fixes** |

## ไฟล์ใหม่

- `supabase/migration_security_fixes.sql` — DB migration รวมทุก policy/trigger/enum fix
- `src/lib/line-jwt.ts` — Verify LINE id_token HMAC-SHA256 + claims
- `src/lib/auth-guard.ts` — Helper `requireAdmin()` / `requireAuth()` สำหรับ API routes
- `src/components/layout/AdminGuard.tsx` — Client guard ใช้กับ `/dashboard/admin/*`
- `src/app/dashboard/admin/layout.tsx` — Wrap admin pages ด้วย AdminGuard
- `src/app/api/auth/line/start/route.ts` — เริ่ม LINE OAuth + ตั้ง CSRF state cookie

## ไฟล์ที่ลบ

- `src/app/page.tsx` (เดิม) — duplicate ของ `feed/page.tsx`; แทนด้วย server redirect → `/feed`

## Highlights ที่ต้องระวังหลัง deploy

### 1. DB Triggers ที่บังคับ booking state machine
หลังรัน migration:
- Customer ไม่สามารถ update `bookings.status` เป็น `paid`/`in_progress`/`completed` ได้แล้ว
- Customer cancel ได้เฉพาะ status `pending`/`approved`/`confirmed`/`alternative_offered`
- Partner ทำได้แค่ `paid → in_progress → completed`
- `total_price` และ `post_id` เปลี่ยนได้แค่ admin / service role (ยกเว้น customer ยอมรับ alternative)
- ใครก็เปลี่ยน status เป็น `paid` ฝั่ง client ไม่ได้แล้ว — มีแต่ webhook (service role) ทำได้

### 2. LINE Login ตอนนี้ปฏิเสธ link account อัตโนมัติ
ถ้า LINE ส่ง verified email มาแล้ว email นั้นมี Supabase user อยู่แล้ว → ตอบ 409 ให้ user เข้าสู่ระบบด้วยรหัสผ่านก่อนแล้วค่อยเชื่อม LINE (ป้องกัน account takeover)

### 3. partner_category enum ถูก drop+recreate
ค่า `'car_rental'` ที่มีอยู่จะถูก map เป็น `'driver'` อัตโนมัติ — รัน migration บน production ต้องระวัง downtime

### 4. partner_profiles.rating recompute โดย trigger
ตอนนี้ submit รีวิว rating + total_reviews อัปเดตอัตโนมัติฝั่ง DB — ไม่มี race อีก

### 5. Stripe webhook idempotency
ใช้ตาราง `stripe_events` (PK = event.id) ดู INSERT 23505 = dedupe; ถ้า handler error ลบ event ออกให้ Stripe retry ใหม่ได้

### 6. Upload ใช้ allowlist `uploads/posts/avatars/portfolio/chat` เท่านั้น
ถ้าโค้ดเดิมส่ง folder อื่น ๆ จะ 400 — ตรวจ caller ทั้งหมดด้วย

## ที่ยังไม่ได้ทำ (intentional / scope)

- **Stripe refund flow แบบ admin trigger** — ตอนนี้รับแค่ `charge.refunded` webhook event แต่ไม่มี UI ให้ admin issue refund (ต้อง refund จาก Stripe Dashboard); customer cancel paid booking ก็ยังไม่ได้
- **Email/SMS notification beyond in-app** — ยังไม่มี
- **`@chillgo.local` synthetic email** — ยังใช้อยู่; ลูกค้าจดอีเมลนี้ไม่ได้แต่ในระยะยาวควรย้ายไป provider OAuth จริง ๆ
- **`useEffect deps exhaustive`** — แก้บาง hook แต่ไม่ครบทุกที่
- **Footer about/terms placeholder** — ยังเป็น `<span>` ไม่ใช่ link จริง

## วิธีรัน

```bash
# 1. รัน migration ใน Supabase SQL Editor (หรือ supabase cli):
#    supabase/migration_security_fixes.sql

# 2. ติดตั้ง deps (ไม่มี dep ใหม่)
npm install

# 3. รัน dev server
npm run dev

# 4. ทดสอบเส้นทาง critical:
#    - /auth/login (password + LINE)
#    - /feed search + filter
#    - /booking/[id]/pay end-to-end (test card 4242 4242 4242 4242)
#    - /chat/[bookingId] โพสต์ "line: @test" → ต้องโดน block
#    - /dashboard/admin (login ด้วย non-admin → redirect)
```
