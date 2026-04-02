# #ChillGo - จัดทริปง่าย ๆ สไตล์คุณ

แพลตฟอร์มจองไกด์และรถเช่าสำหรับทริปในฝัน

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase (Auth, Database, Storage, Realtime)
- **Payment:** Stripe
- **Hosting:** Vercel
- **Source Control:** GitHub

## ขั้นตอนการติดตั้ง

### 1. Clone และติดตั้ง Dependencies

```bash
git clone https://github.com/YOUR_USERNAME/chillgo.git
cd chillgo
npm install
```

### 2. ตั้งค่า Supabase

1. สร้างโปรเจกต์ใหม่ที่ [supabase.com](https://supabase.com)
2. ไปที่ **SQL Editor** แล้วรันไฟล์ตามลำดับ:
   - `supabase/schema.sql` - สร้างตาราง, RLS policies, triggers
   - `supabase/storage.sql` - สร้าง storage bucket
3. ไปที่ **Authentication > Settings**:
   - เปิดใช้ Email provider
   - ตั้งค่า Site URL เป็น `http://localhost:3000`
   - เพิ่ม Redirect URLs: `http://localhost:3000/auth/verify`
4. คัดลอก Project URL และ Anon Key จาก **Settings > API**

### 3. ตั้งค่า Stripe

1. สมัครที่ [stripe.com](https://stripe.com)
2. คัดลอก Publishable Key และ Secret Key จาก Dashboard > Developers > API Keys

### 4. ตั้งค่า Environment Variables

```bash
cp .env.local.example .env.local
```

แก้ไขค่าใน `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx

STRIPE_SECRET_KEY=sk_test_xxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxx

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. ตั้งค่า Admin User

1. รันแอพแล้วสมัครสมาชิกผ่านหน้า Register
2. ยืนยันอีเมล
3. ไปที่ Supabase SQL Editor แล้วรัน:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'YOUR_ADMIN_EMAIL';
```

### 6. รัน Development Server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## โครงสร้างโปรเจกต์

```
src/
├── app/
│   ├── auth/           # Login, Register, Verify, Role Select
│   ├── feed/           # หน้า Feed หลัก
│   ├── booking/        # รายการจอง + ชำระเงิน
│   ├── chat/           # ระบบแชท
│   ├── dashboard/
│   │   ├── admin/      # Admin Dashboard + จัดการพาร์ทเนอร์/ลูกค้า/จอง
│   │   ├── partner/    # Partner Dashboard + Setup
│   │   └── customer/   # Customer Profile
│   └── api/            # API Routes (payments, upload)
├── components/
│   ├── layout/         # AppLayout, Sidebar, BottomNav, TopHeader
│   ├── feed/           # PostCard, CreatePostForm
│   ├── booking/        # BookingModal
│   └── ...
├── hooks/              # useAuth, useAuthStore
├── lib/                # Supabase client/server, Stripe, Moderation
├── types/              # TypeScript types
└── styles/             # Global CSS
```

## ฟีเจอร์หลัก

- **Auth:** สมัครสมาชิก + ยืนยันอีเมล + เข้าสู่ระบบ
- **Role System:** Admin / Partner / Customer
- **Feed:** ดูโพสต์ + ค้นหา + กรองตามหมวดหมู่ (ไกด์/รถเช่า)
- **Partner Post:** สร้างโพสต์ + อัปโหลดรูป/คลิป + ระบบดักช่องทางติดต่อภายนอก
- **Booking Flow:** จอง → Admin อนุมัติ/เสนอทางเลือก → ชำระเงิน → แชท
- **Chat:** Realtime chat ระหว่าง Customer กับ Partner
- **Admin Dashboard:** สถิติ + อนุมัติการจอง + จัดการพาร์ทเนอร์/ลูกค้า
- **Content Moderation:** บล็อกเบอร์โทร, LINE, Facebook, IG ฯลฯ
- **File Upload Limits:** รูป 5MB, คลิป 50MB, อวาตาร์ 2MB
- **Responsive:** Mobile-first + Desktop sidebar layout

## Deploy to Vercel

1. Push code ไป GitHub
2. ไปที่ [vercel.com](https://vercel.com) > Import Project
3. เพิ่ม Environment Variables ทั้งหมดใน Vercel Dashboard
4. Deploy!

อย่าลืมอัพเดท:
- Supabase: Site URL และ Redirect URLs ให้ตรงกับ domain ของ Vercel
- Stripe: Webhook endpoint (ถ้าต้องการ)
