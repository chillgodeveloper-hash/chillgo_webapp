import RoleGuard from '@/components/layout/RoleGuard';

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allow={['partner']}>{children}</RoleGuard>;
}
