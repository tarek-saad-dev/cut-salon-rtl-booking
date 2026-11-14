import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ClubShell } from '@/components/club/ClubShell';

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const metadata: Metadata = {
  title: 'CUT CLUB',
  description: 'مساحة CUT CLUB غير متاحة حاليًا.',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function ClubLayout({ children }: { children: ReactNode }) {
  return <ClubShell>{children}</ClubShell>;
}
