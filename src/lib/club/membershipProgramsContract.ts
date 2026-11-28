import {z} from 'zod';
export const membershipProgramsResponse=z.object({
 ok:z.literal(true),trialOnly:z.literal(true),enrollmentEnabled:z.literal(false),benefitsEnabled:z.literal(false),
 items:z.array(z.object({
 code:z.string().regex(/^[A-Z0-9_-]{1,40}$/),title:z.string().min(1).max(100),kind:z.enum(['GENERAL','STUDENT','DOCTOR','COMPANY']),
 programRevision:z.number().int().positive(),publicationRevision:z.number().int().positive(),minimumVisits:z.number().int().min(0).max(100000),
 allowedBranchIds:z.array(z.union([z.literal(1),z.literal(3)])).min(1).max(2).refine(x=>new Set(x).size===x.length),requiresPartner:z.boolean(),
 }).strict()).max(100)
}).strict();
export type MembershipProgramsResponse=z.infer<typeof membershipProgramsResponse>;
