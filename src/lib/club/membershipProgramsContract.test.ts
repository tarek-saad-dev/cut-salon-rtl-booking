import {describe,it,expect} from 'vitest';
import {membershipProgramsResponse} from '@/lib/club/membershipProgramsContract';
const item={code:'STUDENT_01',title:'طلاب',kind:'STUDENT',programRevision:1,publicationRevision:1,minimumVisits:2,allowedBranchIds:[1,3],requiresPartner:true};
const response={ok:true,trialOnly:true,enrollmentEnabled:false,benefitsEnabled:false,items:[item]};
describe('published program website contract',()=>{
 it('accepts informational trial programs',()=>expect(membershipProgramsResponse.safeParse(response).success).toBe(true));
 it('rejects benefits, enrollment, hidden partner codes, invalid branch scope and untrusted fields',()=>{
 for(const v of [{...response,benefitsEnabled:true},{...response,enrollmentEnabled:true},{...response,items:[{...item,partnerCode:'UNI'}]},{...response,items:[{...item,allowedBranchIds:[2]}]},{...response,items:[{...item,allowedBranchIds:[1,1]}]},{...response,items:[{...item,reason:'private'}]}])expect(membershipProgramsResponse.safeParse(v).success).toBe(false);
 });
});
