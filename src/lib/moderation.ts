const BLOCKED_PATTERNS = [
  /line\s*(?:id|@|:)/i,
  /@line/i,
  /facebook\.com/i,
  /fb\.com/i,
  /instagram\.com/i,
  /ig\s*:/i,
  /twitter\.com/i,
  /x\.com/i,
  /tiktok\.com/i,
  /whatsapp/i,
  /wa\.me/i,
  /t\.me/i,
  /telegram/i,
  /wechat/i,
  /\b0[689]\d{7,8}\b/,
  /\+66\d{8,9}/,
  /(?:ติดต่อ|โทร|โทรศัพท์|เบอร์|มือถือ)\s*(?:ที่|ได้ที่)?\s*\d/i,
  /(?:add|แอด|ทัก|dm|inbox)\s*(?:line|ig|fb|facebook|instagram)/i,
];

export function checkContentViolation(text: string): {
  isViolation: boolean;
  reason: string | null;
} {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isViolation: true,
        reason: 'ไม่อนุญาตให้โพสต์ช่องทางการติดต่อภายนอก กรุณาติดต่อผ่านระบบ ChillGo เท่านั้น',
      };
    }
  }
  return { isViolation: false, reason: null };
}

export const FILE_LIMITS = {
  image: {
    maxSize: 5 * 1024 * 1024,
    types: ['image/jpeg', 'image/png', 'image/webp'],
    label: '5MB',
  },
  video: {
    maxSize: 50 * 1024 * 1024,
    types: ['video/mp4', 'video/webm'],
    label: '50MB',
  },
  avatar: {
    maxSize: 2 * 1024 * 1024,
    types: ['image/jpeg', 'image/png', 'image/webp'],
    label: '2MB',
  },
};

export function validateFile(
  file: File,
  type: keyof typeof FILE_LIMITS
): { valid: boolean; error: string | null } {
  const limit = FILE_LIMITS[type];
  if (!limit.types.includes(file.type)) {
    return { valid: false, error: `ไฟล์ประเภท ${file.type} ไม่รองรับ` };
  }
  if (file.size > limit.maxSize) {
    return { valid: false, error: `ขนาดไฟล์เกิน ${limit.label}` };
  }
  return { valid: true, error: null };
}
