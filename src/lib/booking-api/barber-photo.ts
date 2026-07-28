/**
 * Resolve a public barber photo URL from the Public Booking API.
 * Prefer imageUrl, fall back to photoUrl (compat). Absolute https only — never prefix a site domain.
 */
export function resolveBarberPhotoUrl(
  barber: { imageUrl?: string | null; photoUrl?: string | null } | null | undefined,
): string | null {
  const raw = barber?.imageUrl?.trim() || barber?.photoUrl?.trim() || "";
  if (!raw) return null;
  // Absolute http(s) CDN / Cloudinary URLs only — reject relative local paths.
  if (/^https?:\/\//i.test(raw)) return raw;
  return null;
}
