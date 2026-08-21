import type {
  BookingConfig,
  BookingService,
  BookingServiceCategory,
  PublicBarber,
  PublicBranch,
} from "@/lib/booking-api/types";
import type { BookingV2Bootstrap, BookingV2Barber, BookingV2Service } from "./types";

export function mapBootstrapBranches(boot: BookingV2Bootstrap): PublicBranch[] {
  return boot.branches.map((b) => ({
    branchCode: b.branchCode,
    branchName: b.branchName,
    shortName: b.shortName ?? null,
    address: b.address ?? null,
    phone: b.phone ?? null,
    timeZone: b.timeZone || boot.salon.timezone || "Africa/Cairo",
  }));
}

export function mapBootstrapConfig(boot: BookingV2Bootstrap): BookingConfig {
  return {
    salon: {
      name: boot.salon.name,
      logoUrl: boot.salon.logoUrl,
      timezone: boot.salon.timezone,
      currency: boot.salon.currency,
      bookingEnabled: boot.salon.bookingEnabled,
    },
    settings: {
      allowSpecificBarber: boot.settings.allowSpecificBarber,
      allowNearestBarber: boot.settings.allowNearestBarber,
      defaultMode: boot.settings.defaultMode,
      slotIntervalMinutes: boot.settings.slotIntervalMinutes,
      maxBookingDaysAhead: boot.settings.maxBookingDaysAhead,
      minNoticeMinutes: boot.settings.minNoticeMinutes,
    },
  };
}

export function mapBootstrapService(s: BookingV2Service): BookingService {
  return {
    id: s.id,
    name: s.name,
    nameAr: s.nameAr ?? null,
    nameEn: s.nameEn ?? null,
    price: s.price,
    durationMinutes: s.durationMinutes,
    categoryName: s.categoryName,
    isBookableOnline: s.isBookableOnline,
    imageUrl: s.imageUrl ?? null,
    photoUrl: s.imageUrl ?? null,
  };
}

export function mapBootstrapServices(boot: BookingV2Bootstrap): {
  services: BookingService[];
  categories: BookingServiceCategory[];
} {
  const services = boot.services.map(mapBootstrapService);
  const byCat = new Map<string, BookingService[]>();
  for (const s of services) {
    const key = s.categoryName || "other";
    const list = byCat.get(key) ?? [];
    list.push(s);
    byCat.set(key, list);
  }
  const categories: BookingServiceCategory[] = [...byCat.entries()].map(([name, list], i) => ({
    id: `cat-${i}-${name}`,
    name,
    nameAr: name,
    nameEn: name,
    sortOrder: i,
    serviceCount: list.length,
    services: list,
  }));
  return { services, categories };
}

export function mapBootstrapBarber(b: BookingV2Barber): PublicBarber {
  return {
    id: b.empId,
    name: b.name,
    nameAr: b.nameAr ?? null,
    nameEn: b.nameEn ?? null,
    job: b.job ?? null,
    imageUrl: b.photoUrl ?? null,
    photoUrl: b.photoUrl ?? null,
    bio: b.bio ?? null,
    isBookableOnline: b.isBookableOnline,
    serviceIds: b.serviceIds,
    branches: b.branches.map((br) => ({
      branchCode: br.branchCode,
      branchName: br.branchName,
    })),
  };
}

export function mapBootstrapBarbers(boot: BookingV2Bootstrap): PublicBarber[] {
  return boot.barbers.filter((b) => b.isBookableOnline).map(mapBootstrapBarber);
}

export function findBootstrapBarber(
  boot: BookingV2Bootstrap | null | undefined,
  empId: number | null | undefined,
): BookingV2Barber | null {
  if (!boot || empId == null) return null;
  return boot.barbers.find((b) => b.empId === empId || b.id === empId) ?? null;
}
