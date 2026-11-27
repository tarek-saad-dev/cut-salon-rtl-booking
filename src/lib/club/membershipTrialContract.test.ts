import {describe,it,expect} from 'vitest';
import {membershipTrialResponse} from '@/lib/club/membershipTrialContract';
const item={code:'STUDENT_01',title:'طلاب',kind:'STUDENT',status:'CURRENT',expiresAt:'2027-01-01T00:00:00.000Z',branchId:1,benefitsEnabled:false};
const data={ok:true,trialOnly:true,enrollmentEnabled:false,accountStatus:'ACTIVE',items:[item]};
describe('membership trial upstream contract',()=>{
 it('allows only the restricted trial response',()=>expect(membershipTrialResponse.safeParse(data).success).toBe(true));
 it('rejects financial rights, enrollment, extra private fields and non-active account items',()=>{
 for(const d of [{...data,trialOnly:false},{...data,enrollmentEnabled:true},{...data,accountStatus:'SUSPENDED'},{...data,items:[{...item,benefitsEnabled:true}]},{...data,items:[{...item,phone:'private'}]},{...data,items:[{...item,branchId:2}]}])expect(membershipTrialResponse.safeParse(d).success).toBe(false);
 expect(membershipTrialResponse.safeParse({...data,accountStatus:'SUSPENDED',items:[]}).success).toBe(true);
 });
});
