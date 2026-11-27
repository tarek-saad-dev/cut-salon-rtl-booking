import {z} from 'zod';
export const applicationSubmission=z.object({code:z.string().regex(/^[A-Z0-9_-]{1,40}$/),publicationRevision:z.number().int().positive().max(2147483647),branchId:z.union([z.literal(1),z.literal(3)])}).strict();
const id=z.string().uuid();
export const applicationsResponse=z.object({ok:z.literal(true),trialOnly:z.literal(true),benefitsEnabled:z.literal(false),items:z.array(z.object({id,code:z.string().regex(/^[A-Z0-9_-]{1,40}$/),title:z.string().min(1).max(100),publicationRevision:z.number().int().positive(),branchId:z.union([z.literal(1),z.literal(3)]),status:z.enum(['PENDING','ACCEPTED_FOR_REVIEW','REJECTED','PROGRAM_CHANGED']),createdAt:z.string().datetime()}).strict()).max(100)}).strict();
export const applicationCreated=z.object({ok:z.literal(true),trialOnly:z.literal(true),benefitsEnabled:z.literal(false),id,replayed:z.boolean()}).strict();
export type MemberApplication=z.infer<typeof applicationsResponse>['items'][number];
