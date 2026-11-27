import {z} from 'zod';
export const membershipTrialResponse=z.object({
 ok:z.literal(true),trialOnly:z.literal(true),enrollmentEnabled:z.literal(false),
 accountStatus:z.enum(['ACTIVE','UNLINKED','REVIEW_REQUIRED','SUSPENDED']),
 items:z.array(z.object({code:z.string().regex(/^[A-Z0-9_-]{1,40}$/),title:z.string().min(1).max(100),
 kind:z.enum(['GENERAL','STUDENT','DOCTOR','COMPANY']),status:z.enum(['CURRENT','EXPIRED','INVALIDATED']),
 expiresAt:z.string().datetime(),branchId:z.union([z.literal(1),z.literal(3)]),benefitsEnabled:z.literal(false)}).strict()).max(100),
}).strict().refine(v=>v.accountStatus==='ACTIVE'||v.items.length===0);
export type MembershipTrialResponse=z.infer<typeof membershipTrialResponse>;
