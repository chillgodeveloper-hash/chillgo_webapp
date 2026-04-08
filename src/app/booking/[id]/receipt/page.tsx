'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, Download, CheckCircle, Printer } from 'lucide-react';

export default function ReceiptPage() {
  const { id } = useParams();
  const router = useRouter();
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('receipts')
        .select('*')
        .eq('booking_id', id)
        .single();
      setReceipt(data);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleDownloadPDF = () => {
    if (!receiptRef.current || !receipt) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>ใบเสร็จ ${receipt.receipt_number}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Prompt', sans-serif; background: #fff; color: #333; padding: 40px; }
          .receipt { max-width: 600px; margin: 0 auto; }
          .header { text-align: center; padding-bottom: 24px; border-bottom: 3px solid #FF9800; margin-bottom: 24px; }
          .logo { font-size: 28px; font-weight: 800; color: #FF9800; margin-bottom: 4px; }
          .subtitle { font-size: 12px; color: #757575; }
          .receipt-number { text-align: center; margin-bottom: 24px; }
          .receipt-number span { background: #FFF4D1; padding: 6px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; color: #333; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 11px; font-weight: 600; color: #757575; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
          .row .label { color: #757575; }
          .row .value { font-weight: 500; color: #333; text-align: right; max-width: 60%; }
          .divider { border: none; border-top: 2px dashed #FFD035; margin: 20px 0; }
          .total { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; }
          .total .label { font-size: 18px; font-weight: 700; }
          .total .value { font-size: 28px; font-weight: 700; color: #FF9800; }
          .status { text-align: center; margin-top: 20px; padding: 12px; background: #E8F5E9; border-radius: 12px; color: #2E7D32; font-weight: 600; font-size: 14px; }
          .footer { text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #eee; }
          .footer p { font-size: 11px; color: #999; line-height: 1.6; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo">#ChillGo</div>
            <div class="subtitle">ใบเสร็จรับเงิน / Receipt</div>
          </div>
          <div class="receipt-number">
            <span>${receipt.receipt_number}</span>
          </div>
          <div class="section">
            <div class="section-title">ข้อมูลบริการ</div>
            <div class="row"><span class="label">บริการ</span><span class="value">${receipt.service_title}</span></div>
            <div class="row"><span class="label">วันที่ใช้บริการ</span><span class="value">${new Date(receipt.booking_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}${receipt.booking_end_date ? ' — ' + new Date(receipt.booking_end_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span></div>
            <div class="row"><span class="label">จำนวนคน</span><span class="value">${receipt.guests} คน</span></div>
          </div>
          <div class="section">
            <div class="section-title">ข้อมูลการชำระเงิน</div>
            <div class="row"><span class="label">ลูกค้า</span><span class="value">${receipt.customer_name}</span></div>
            <div class="row"><span class="label">อีเมล</span><span class="value">${receipt.customer_email}</span></div>
            <div class="row"><span class="label">พาร์ทเนอร์</span><span class="value">${receipt.partner_name}</span></div>
            <div class="row"><span class="label">ช่องทางชำระ</span><span class="value">${receipt.payment_method === 'promptpay' ? 'PromptPay' : receipt.payment_method === 'card' ? 'บัตรเครดิต/เดบิต' : receipt.payment_method}</span></div>
            <div class="row"><span class="label">วันที่ชำระ</span><span class="value">${new Date(receipt.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
          </div>
          <hr class="divider">
          <div class="total">
            <span class="label">ยอดรวมทั้งสิ้น</span>
            <span class="value">฿${Number(receipt.amount).toLocaleString()}</span>
          </div>
          <div class="status">✓ ชำระเงินเรียบร้อยแล้ว</div>
          <div class="footer">
            <p>#ChillGo — จัดทริปง่าย ๆ สไตล์คุณ</p>
            <p>support@chillgo.com | Line: @chillgo</p>
            <p>เอกสารนี้ออกโดยระบบอัตโนมัติ</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-tmuted mb-4 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition">
          <ArrowLeft size={18} /> กลับ
        </button>

        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary-dark/30 border-t-secondary rounded-full animate-spin mx-auto" />
          </div>
        ) : !receipt ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-primary-dark/20">
            <p className="text-tmuted">ไม่พบใบเสร็จ</p>
          </div>
        ) : (
          <div ref={receiptRef}>
            <div className="bg-white rounded-2xl border border-primary-dark/20 overflow-hidden">
              <div className="bg-gradient-to-r from-primary via-primary-dark to-secondary p-6 text-center">
                <h1 className="font-display text-2xl font-extrabold text-tmain">#ChillGo</h1>
                <p className="text-sm text-tmain/70">ใบเสร็จรับเงิน</p>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-center mb-5">
                  <span className="bg-primary-light text-tmain font-mono font-bold text-sm px-4 py-2 rounded-lg">
                    {receipt.receipt_number}
                  </span>
                </div>

                <div className="mb-5">
                  <p className="text-[11px] text-tmuted uppercase tracking-wider font-semibold mb-3">ข้อมูลบริการ</p>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-tmuted">บริการ</span>
                      <span className="font-medium text-tmain text-right max-w-[60%]">{receipt.service_title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tmuted">วันที่ใช้บริการ</span>
                      <span className="font-medium text-tmain">
                        {new Date(receipt.booking_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                        {receipt.booking_end_date && ` — ${new Date(receipt.booking_end_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tmuted">จำนวนคน</span>
                      <span className="font-medium text-tmain">{receipt.guests} คน</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-dashed border-primary-dark/20 my-5" />

                <div className="mb-5">
                  <p className="text-[11px] text-tmuted uppercase tracking-wider font-semibold mb-3">ข้อมูลการชำระเงิน</p>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-tmuted">ลูกค้า</span>
                      <span className="font-medium text-tmain">{receipt.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tmuted">อีเมล</span>
                      <span className="font-medium text-tmain">{receipt.customer_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tmuted">พาร์ทเนอร์</span>
                      <span className="font-medium text-tmain">{receipt.partner_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tmuted">ช่องทางชำระ</span>
                      <span className="font-medium text-tmain">
                        {receipt.payment_method === 'promptpay' ? 'PromptPay' : receipt.payment_method === 'card' ? 'บัตรเครดิต/เดบิต' : receipt.payment_method}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tmuted">วันที่ชำระ</span>
                      <span className="font-medium text-tmain">
                        {new Date(receipt.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-dashed border-primary-dark/20 my-5" />

                <div className="flex justify-between items-center mb-5">
                  <span className="font-bold text-tmain text-lg">ยอดรวมทั้งสิ้น</span>
                  <span className="font-bold text-secondary text-2xl">฿{Number(receipt.amount).toLocaleString()}</span>
                </div>

                <div className="bg-success/10 rounded-xl p-3 flex items-center gap-2 mb-6">
                  <CheckCircle size={16} className="text-success" />
                  <span className="text-sm text-tmain font-medium">ชำระเงินเรียบร้อยแล้ว</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadPDF}
                    className="flex-1 bg-primary hover:bg-primary-dark text-tmain font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <Download size={18} /> ดาวน์โหลด PDF
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 bg-white border border-primary-dark/30 text-tmain font-medium py-3 rounded-xl transition hover:bg-primary/20"
                  >
                    <Printer size={18} />
                  </button>
                </div>

                <p className="text-center text-[11px] text-tmuted mt-4">
                  #ChillGo — จัดทริปง่าย ๆ สไตล์คุณ | support@chillgo.com
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
