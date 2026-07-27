# Phase 8A — Contract Types

**Module:** `src/lib/booking-api/types.ts`  
**Contract:** `booking-public-v1`

Wire-format types only. No `any`. Do not copy internal DB models.

---

## Types and fields

### `PublicBranch`
| Field | Type |
|---|---|
| `branchCode` | `string` |
| `branchName` | `string` |
| `shortName` | `string \| null` |
| `address` | `string \| null` |
| `phone` | `string \| null` |
| `timeZone` | `string` |

### `BookingSalon`
| Field | Type |
|---|---|
| `name` | `string` |
| `logoUrl` | `string \| null` |
| `timezone` | `string` |
| `currency` | `string` |
| `bookingEnabled` | `boolean` |

### `BookingSettings`
| Field | Type |
|---|---|
| `allowSpecificBarber` | `boolean` |
| `allowNearestBarber` | `boolean` |
| `defaultMode` | `"specific" \| "nearest"` |
| `slotIntervalMinutes` | `number` |
| `maxBookingDaysAhead` | `number` |
| `minNoticeMinutes` | `number` |

### `BookingConfig`
`{ salon: BookingSalon; settings: BookingSettings }`

### `ServiceCategory`
`{ name: string; services: BookingService[] }`

### `BookingService`
| Field | Type |
|---|---|
| `id` | `number` |
| `name` | `string` |
| `price` | `number` |
| `durationMinutes` | `number` |
| `categoryName` | `string \| null` |
| `isBookableOnline` | `boolean` |

### `PublicBarber`
| Field | Type |
|---|---|
| `id` | `number` |
| `name` | `string` |
| `job` | `string \| null` |
| `photoUrl` | `string \| null` |
| `bio` | `string \| null` |
| `isBookableOnline` | `boolean` |

### `BarberCalendarDay`
`{ date: string; available: boolean; shifts?: { start: string; end: string }[] }`

### `AvailableDay`
`{ date: string; available: boolean; reason?: string \| null }`

### `AvailableSlot`
| Field | Type |
|---|---|
| `time` | `string` |
| `label` | `string \| null` (optional) |
| `available` | `boolean` |
| `dayOffset` | `number \| null` (optional) |
| `empId` | `number \| null` (optional) |
| `barberName` | `string \| null` (optional) |
| `durationMinutes` | `number \| null` (optional) |
| `durationSource` | `string \| null` (optional) |
| `reason` | `string \| null` (optional) |

### `CheckSlotRequest` / `CheckSlotResponse`
Request: `branchCode`, `date`, `time`, `serviceIds`, `mode`, optional `empId`, `dayOffset`  
Response: `{ available: boolean; reason?: string \| null }`

### `BookingCustomer`
`{ name: string; phone: string }`

### `BookingPlanRequest`
`branchCode`, `customer`, `serviceIds`, `date`, `time`, optional `dayOffset`, `mode`, optional `empId`, `notes`

### `BookingPlanItem`
| Field | Type |
|---|---|
| `serviceId` | `number` |
| `serviceName` | `string` |
| `empId` | `number` |
| `empName` | `string` |
| `date` | `string` |
| `startTime` | `string` |
| `endTime` | `string` |
| `durationMinutes` | `number` |
| `price` | `number` |
| `bookingCode` | `string` |

### `BookingPlan`
`plan`, `totalDurationMinutes`, `totalPrice`, `bookingCodes`, optional `message`, `branchCode`, `branchName`, **`planToken`**, `planFingerprint`, `evaluatedAt`

### `BookingCreateRequest`
Plan fields + **`planToken`** + **`clientRequestId`**

### `BookingCreateResponse`
`bookingCode`, optional `bookingAccessToken`, `date`, `time`, `barberName`, `services`, optional totals / message / branch fields

### `PublicBooking`
Public booking summary keyed by **`bookingCode`** (not numeric BookingID)

### `UpcomingBookingsResponse`
`{ bookings: PublicBooking[] }`

### `BookingCancelRequest`
Optional `code`, `phone`, `bookingAccessToken`, `reasonCode`, `reasonText`; required **`clientRequestId`**

### `BookingCancelResponse`
`{ cancelled: boolean; message?: string }`

### `PublicBookingErrorCode`
Union of known backend codes (see error-handling doc).

### Modes / metadata
- `BookingMode`: `"specific" \| "nearest"`
- `BookingEntryMode`: `"branch_first" \| "barber_first"`
- `RateLimitInfo`, `ResponseMetadata`, `BookingApiResponse<T>`

---

## Internal IDs **not** exposed

| Forbidden | Notes |
|---|---|
| `BookingID` / numeric booking PK | Use `bookingCode` |
| `BranchID` | Use `branchCode` only (`PublicBranch` has no `branchId`) |
| `CustomerID` | Not on public wire types |
| Internal assignment IDs | Not on plan/create responses |

Service `id` and barber/emp `id` remain public catalog identifiers required by the booking-public contract; they are not database Booking/Branch/Customer PKs.
