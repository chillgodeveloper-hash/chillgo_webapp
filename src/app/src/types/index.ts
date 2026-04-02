export type UserRole = 'admin' | 'partner' | 'customer';

export type PartnerCategory = 'guide' | 'car_rental';

export type BookingStatus =
  | 'pending'
  | 'approved'
  | 'alternative_offered'
  | 'confirmed'
  | 'paid'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type PostStatus = 'active' | 'flagged' | 'removed';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerProfile {
  id: string;
  user_id: string;
  category: PartnerCategory;
  business_name: string;
  description: string;
  portfolio_images: string[];
  is_verified: boolean;
  rating: number;
  total_reviews: number;
  created_at: string;
}

export interface Post {
  id: string;
  partner_id: string;
  title: string;
  content: string;
  media_urls: string[];
  media_types: ('image' | 'video')[];
  category: PartnerCategory;
  price_min: number | null;
  price_max: number | null;
  location: string | null;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  partner_profile?: PartnerProfile & { profile?: Profile };
  _count?: { likes: number; comments: number };
}

export interface Booking {
  id: string;
  customer_id: string;
  partner_id: string;
  post_id: string;
  booking_date: string;
  booking_end_date: string | null;
  guests: number;
  note: string | null;
  status: BookingStatus;
  total_price: number | null;
  stripe_payment_intent_id: string | null;
  admin_note: string | null;
  alternative_post_id: string | null;
  created_at: string;
  updated_at: string;
  customer?: Profile;
  partner?: PartnerProfile & { profile?: Profile };
  post?: Post;
  alternative_post?: Post;
}

export interface ChatMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  message: string;
  media_url: string | null;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'booking' | 'chat' | 'payment' | 'system';
  is_read: boolean;
  link: string | null;
  created_at: string;
}
