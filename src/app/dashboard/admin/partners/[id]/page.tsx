'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import AppLayout from '@/components/layout/AppLayout';
import {
  ArrowLeft, Star, UserCheck, Ban, Mail, Phone, MapPin, CreditCard,
  Calendar, Globe, ImageIcon, FileText, Briefcase, Car, Award, Loader2,
} from 'lucide-react';

function Field({ label, value }: { label: string; value: any }) {
  const display = value === null || value === undefined || value === '' ? '—' : value;
  return (
    <div className="bg-primary-light rounded-xl p-3">
      <p className="text-[11px] text-tmuted uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-tmain mt-0.5 break-words">{String(display)}</p>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-primary-dark/20 overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-primary-dark/10">
        <Icon size={18} className="text-secondary" />
        <h2 className="font-bold text-tmain">{title}</h2>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

export default function AdminPartnerDetail() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('partner_profiles')
        .select('*, profile:profiles(*)')
        .eq('id', id)
        .single();
      setPartner(data);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const toggleVerify = async () => {
    if (!partner) return;
    await supabase.from('partner_profiles').update({ is_verified: !partner.is_verified }).eq('id', partner.id);
    setPartner({ ...partner, is_verified: !partner.is_verified });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-12 flex items-center justify-center">
          <Loader2 size={32} className="text-secondary animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!partner) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-5xl mb-4">😕</p>
          <p className="text-tmain font-medium">ไม่พบพาร์ทเนอร์</p>
        </div>
      </AppLayout>
    );
  }

  const cat = partner.category;
  const catLabel = cat === 'driver' ? '🚗 คนขับรถ' : '🗺️ ไกด์';
  const profile = partner.profile;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8 animate-blur-in">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-tmuted hover:bg-primary/20 px-3 py-2 rounded-xl transition mb-4">
          <ArrowLeft size={16} /> กลับรายการพาร์ทเนอร์
        </button>

        <div className="bg-white rounded-2xl border border-primary-dark/20 p-5 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary-text font-bold text-2xl flex-shrink-0 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                profile?.full_name?.charAt(0) || 'P'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-tmain">{partner.business_name}</h1>
                {partner.is_verified && <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">✓ ยืนยันแล้ว</span>}
              </div>
              <p className="text-sm text-tmuted mt-0.5">{profile?.full_name} · {profile?.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full ${cat === 'guide' ? 'bg-secondary/10 text-secondary' : 'bg-info/10 text-info'}`}>{catLabel}</span>
                {partner.rating > 0 && (
                  <span className="text-xs text-tmuted flex items-center gap-0.5">
                    <Star size={10} className="text-amber-500 fill-amber-500" /> {partner.rating.toFixed(1)} ({partner.total_reviews || 0} รีวิว)
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={toggleVerify}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition flex-shrink-0 ${partner.is_verified ? 'bg-primary/20 text-tmuted hover:bg-primary-dark/30' : 'bg-success/20 text-tmain hover:bg-success/30'}`}
            >
              {partner.is_verified ? <><Ban size={14} /> ยกเลิกยืนยัน</> : <><UserCheck size={14} /> ยืนยัน</>}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <Section icon={Award} title="ข้อมูลพื้นฐาน">
            <div className="grid grid-cols-2 gap-3">
              <Field label="ชื่อ-นามสกุล (ไทย)" value={partner.full_name_th} />
              <Field label="Name (English)" value={partner.full_name_en} />
              <Field label="ชื่อเล่น" value={partner.nickname} />
              <Field label="อายุ" value={partner.age} />
              <Field label="เลขบัตรประชาชน" value={partner.id_number} />
              <Field label="วันเกิด" value={partner.date_of_birth} />
              <Field label="สัญชาติ" value={partner.nationality} />
              <Field label="สถานภาพ" value={partner.marital_status} />
            </div>
            {partner.description && (
              <div className="bg-primary-light rounded-xl p-3">
                <p className="text-[11px] text-tmuted uppercase tracking-wide mb-1">คำอธิบาย / แนะนำตัว</p>
                <p className="text-sm text-tmain whitespace-pre-wrap">{partner.description}</p>
              </div>
            )}
          </Section>

          <Section icon={Phone} title="ข้อมูลติดต่อ">
            <div className="grid grid-cols-2 gap-3">
              <Field label="เบอร์โทร" value={partner.phone} />
              <Field label="LINE ID" value={partner.line_id} />
              <Field label="WeChat ID" value={partner.wechat_id} />
              <Field label="Email ติดต่อ" value={partner.contact_email} />
            </div>
            <Field label="ที่อยู่" value={partner.address} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="จังหวัด" value={partner.province} />
              <Field label="รหัสไปรษณีย์" value={partner.postcode} />
            </div>
          </Section>

          <Section icon={Globe} title="ภาษาและทักษะ">
            {partner.languages && Object.keys(partner.languages).length > 0 && (
              <div>
                <p className="text-[11px] text-tmuted uppercase tracking-wide mb-2">ภาษา</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(partner.languages).map(([lang, level]) => (
                    <span key={lang} className="text-xs bg-primary/20 text-tmain px-2.5 py-1 rounded-full">{lang}: {String(level)}</span>
                  ))}
                </div>
              </div>
            )}
            {partner.skills?.length > 0 && (
              <div>
                <p className="text-[11px] text-tmuted uppercase tracking-wide mb-2">ทักษะ</p>
                <div className="flex flex-wrap gap-2">
                  {partner.skills.map((s: string, i: number) => <span key={i} className="text-xs bg-secondary/15 text-tmain px-2.5 py-1 rounded-full">{s}</span>)}
                </div>
              </div>
            )}
            {partner.service_styles?.length > 0 && (
              <div>
                <p className="text-[11px] text-tmuted uppercase tracking-wide mb-2">สไตล์การบริการ</p>
                <div className="flex flex-wrap gap-2">
                  {partner.service_styles.map((s: string, i: number) => <span key={i} className="text-xs bg-info/15 text-tmain px-2.5 py-1 rounded-full">{s}</span>)}
                </div>
              </div>
            )}
            {partner.special_routes && (
              <Field label="เส้นทาง / พื้นที่ให้บริการ" value={partner.special_routes} />
            )}
          </Section>

          {cat === 'guide' && (
            <Section icon={FileText} title="ใบอนุญาตและการศึกษา">
              <div className="grid grid-cols-2 gap-3">
                <Field label="เลขใบอนุญาตไกด์" value={partner.guide_license_no} />
                <Field label="ประเภทใบอนุญาต" value={partner.guide_license_type} />
              </div>
              {partner.certifications?.length > 0 && (
                <div>
                  <p className="text-[11px] text-tmuted uppercase tracking-wide mb-2">ใบรับรอง</p>
                  <div className="flex flex-wrap gap-2">
                    {partner.certifications.map((c: string, i: number) => <span key={i} className="text-xs bg-success/15 text-tmain px-2.5 py-1 rounded-full">{c}</span>)}
                  </div>
                </div>
              )}
              {partner.education?.length > 0 && (
                <div>
                  <p className="text-[11px] text-tmuted uppercase tracking-wide mb-2">การศึกษา</p>
                  <div className="space-y-2">
                    {partner.education.map((e: any, i: number) => (
                      <div key={i} className="bg-primary-light rounded-xl p-3 text-sm">
                        <p className="font-medium text-tmain">{e.level} · {e.institution}</p>
                        <p className="text-tmuted text-xs">{e.major} {e.year && `· ${e.year}`}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {partner.work_experience?.length > 0 && (
                <div>
                  <p className="text-[11px] text-tmuted uppercase tracking-wide mb-2">ประสบการณ์ทำงาน</p>
                  <div className="space-y-2">
                    {partner.work_experience.map((w: any, i: number) => (
                      <div key={i} className="bg-primary-light rounded-xl p-3 text-sm">
                        <p className="font-medium text-tmain">{w.position} · {w.company}</p>
                        <p className="text-tmuted text-xs">{w.period} {w.reason_left && `· ${w.reason_left}`}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}

          {cat === 'driver' && (
            <Section icon={Car} title="ใบขับขี่และยานพาหนะ">
              <div className="grid grid-cols-2 gap-3">
                <Field label="ประเภทใบขับขี่" value={partner.driving_license_type} />
                <Field label="เลขที่ใบขับขี่" value={partner.driving_license_no} />
                <Field label="วันหมดอายุ" value={partner.driving_license_expiry} />
                <Field label="ยี่ห้อ/รุ่นรถ" value={partner.vehicle_brand} />
                <Field label="สีรถ" value={partner.vehicle_color} />
                <Field label="ทะเบียนรถ" value={partner.vehicle_plate} />
                <Field label="จังหวัด (ทะเบียน)" value={partner.vehicle_plate_province} />
                <Field label="ปีจดทะเบียน" value={partner.vehicle_year} />
                <Field label="จำนวนที่นั่ง" value={partner.vehicle_seats} />
                <Field label="ประเภทป้ายทะเบียน" value={partner.vehicle_plate_type} />
                <Field label="สถานะ พ.ร.บ." value={partner.vehicle_insurance_compulsory} />
                <Field label="วันสิ้นสุด พ.ร.บ." value={partner.vehicle_insurance_compulsory_expiry} />
                <Field label="ประกันภัยภาคสมัครใจ" value={partner.vehicle_insurance_voluntary} />
              </div>
            </Section>
          )}

          <Section icon={CreditCard} title="ข้อมูลบัญชีธนาคาร">
            <div className="grid grid-cols-2 gap-3">
              <Field label="ชื่อธนาคาร" value={partner.bank_name} />
              <Field label="สาขา" value={partner.bank_branch} />
              <Field label="ชื่อบัญชี" value={partner.account_name} />
              <Field label="เลขที่บัญชี" value={partner.account_number} />
              <Field label="ประเภทบัญชี" value={partner.account_type} />
              <Field label="PromptPay" value={partner.promptpay} />
            </div>
          </Section>

          {partner.portfolio_images?.length > 0 && (
            <Section icon={ImageIcon} title={`ผลงาน (${partner.portfolio_images.length})`}>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {partner.portfolio_images.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-xl overflow-hidden bg-primary/10 hover:opacity-80 transition">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </Section>
          )}

          <Section icon={Calendar} title="ข้อมูลระบบ">
            <div className="grid grid-cols-2 gap-3">
              <Field label="ลงทะเบียนเมื่อ" value={partner.created_at && new Date(partner.created_at).toLocaleString('th-TH')} />
              <Field label="ยอมรับเงื่อนไข" value={partner.terms_accepted ? 'ยอมรับแล้ว' : 'ยังไม่ยอมรับ'} />
              {partner.terms_accepted_at && <Field label="ยอมรับเมื่อ" value={new Date(partner.terms_accepted_at).toLocaleString('th-TH')} />}
              <Field label="Partner ID" value={partner.id} />
            </div>
          </Section>
        </div>
      </div>
    </AppLayout>
  );
}
