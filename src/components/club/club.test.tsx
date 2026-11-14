import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import ClubPage from '@/app/club/page';
import { metadata, dynamic, revalidate, fetchCache } from '@/app/club/layout';
import { ClubNavigation, ClubModule } from './ClubShell';
import { getClubGate, clubModules } from '@/lib/club/registry';
import sitemap from '@/app/sitemap';

afterEach(() => vi.unstubAllEnvs());
it('fails closed by default and even when the shell flag is enabled', () => {
  for (const value of ['', 'false', 'true', '1']) {
    vi.stubEnv('CUT_CLUB_SHELL_ENABLED', value);
    expect(getClubGate()).toBe(value === 'true' ? 'authentication-unavailable' : 'disabled');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const html = renderToStaticMarkup(<ClubPage />);
    expect(html).toContain('الحجز العام');
    expect(html).not.toMatch(/clientId|balance|localStorage|<form|type="tel"/i);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  }
});
it('keeps private metadata and dynamic policy separate from public sitemap', () => {
  expect(metadata.robots).toMatchObject({ index: false, follow: false });
  expect(dynamic).toBe('force-dynamic');
  expect(revalidate).toBe(0);
  expect(fetchCache).toBe('force-no-store');
  const urls = sitemap().map(entry => new URL(entry.url).pathname);
  expect(urls).toEqual(expect.arrayContaining(['/', '/book']));
  expect(urls.some(path => path === '/club' || path.startsWith('/club/'))).toBe(false);
});
it('uses one accessible five-item navigation across responsive layouts', () => {
  render(<ClubNavigation />);
  expect(screen.getByRole('navigation', { name: 'CUT CLUB' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Home/ })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: /Book/ })).toHaveAttribute('href', '/book');
  for (const label of ['Explore', 'Wallet', 'Me']) {
    expect(screen.getByRole('button', { name: label })).toBeDisabled();
  }
  expect(screen.getAllByRole('link')).toHaveLength(2);
});
it.each(['loading', 'empty', 'unavailable'] as const)('renders only safe %s module states', state => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  render(<>{clubModules.map(module => <ClubModule key={module.id} module={module} state={state} />)}</>);
  expect(screen.getAllByRole('article')).toHaveLength(5);
  expect(fetchSpy).not.toHaveBeenCalled();
  fetchSpy.mockRestore();
});

it('sets no-store and noindex headers on every private route', async () => {
  const { default: config } = await import('../../../next.config');
  const headers = await config.headers!();
  expect(headers.find(rule => rule.source === '/club/:path*')?.headers).toEqual(expect.arrayContaining([
    { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
    { key: 'Cache-Control', value: 'private, no-store, max-age=0, must-revalidate' },
  ]));
});
