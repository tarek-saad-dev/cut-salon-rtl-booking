import {describe,it,expect} from 'vitest';
import {applicationSubmission,applicationCreated,applicationsResponse} from '@/lib/club/membershipApplicationContract';
describe('membership request boundary',()=>{
 it('rejects caller ownership and benefit fields',()=>{
 const body={code:'STUDENT_01',publicationRevision:1,branchId:1};
 expect(applicationSubmission.safeParse(body).success).toBe(true);
 expect(applicationSubmission.safeParse({...body,clientId:7}).success).toBe(false);
 expect(applicationSubmission.safeParse({...body,branchId:2}).success).toBe(false);
 expect(applicationCreated.safeParse({ok:true,trialOnly:true,benefitsEnabled:true,id:'22222222-2222-4222-8222-222222222222',replayed:false}).success).toBe(false);
 expect(applicationsResponse.safeParse({ok:true,trialOnly:true,benefitsEnabled:false,items:[]}).success).toBe(true);
 });
});
