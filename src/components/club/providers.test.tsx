import { render, screen } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import { Providers } from '@/components/providers';
vi.mock('next/navigation', () => ({ usePathname: () => '/club' }));
vi.mock('@/context/BranchContext', () => ({ BranchProvider: () => { throw new Error('Public branch provider mounted'); } }));
vi.mock('@/components/BookingPrefetchBoot', () => ({ default: () => { throw new Error('Booking prefetch mounted'); } }));
it('renders club without mounting public API providers or prefetch', () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  const storageSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage unavailable'); });
  render(<Providers><p>Restricted club</p></Providers>);
  expect(screen.getByText('Restricted club')).toBeInTheDocument();
  expect(fetchSpy).not.toHaveBeenCalled();
  expect(storageSpy).not.toHaveBeenCalled();
  vi.restoreAllMocks();
});
