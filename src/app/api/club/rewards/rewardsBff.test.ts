import {beforeEach,describe,expect,it,vi} from 'vitest';
const fake=vi.hoisted(()=>({get:vi.fn(),upstream:vi.fn()}));
vi.mock('next/headers',()=>({cookies:async()=>({get:fake.get})}));
vi.mock('@/lib/club/serverCasher',()=>({
  clubCookieNames:{session:'cutclub_session'},
  casherMemberRequest:fake.upstream,
  clubRewardCatalogResponse:{
    safeParse:(value:unknown)=>({success:!!value&&typeof value==='object'&&(value as any).ok===true
      &&(value as any).purchaseEnabled===false&&Array.isArray((value as any).items),data:value})
  },
  UpstreamClubError:class UpstreamClubError extends Error{
    constructor(public status:number,public code:string){super(code);}
  },
}));
import {GET,POST} from '@/app/api/club/rewards/route';
describe('private reward storefront BFF',()=>{
  beforeEach(()=>{fake.get.mockReset();fake.upstream.mockReset();fake.get.mockReturnValue({value:'A'.repeat(43)});});
  it('rejects unverified users with no upstream call',async()=>{
    fake.get.mockReturnValueOnce(undefined);
    const r=await GET();
    expect(r.status).toBe(401);
    expect(fake.upstream).not.toHaveBeenCalled();
  });
  it('forwards only opaque member session and returns no-store catalog',async()=>{
    fake.upstream.mockResolvedValueOnce({ok:true,balance:120,purchaseEnabled:false,items:[]});
    const r=await GET();
    expect(r.status).toBe(200);
    expect(r.headers.get('cache-control')).toContain('no-store');
    expect(fake.upstream).toHaveBeenCalledWith('/rewards',{sessionToken:'A'.repeat(43)});
    expect((await r.json()).items).toEqual([]);
  });
  it('never permits a browser purchase write',async()=>{
    const r=await POST();
    expect(r.status).toBe(403);
    expect(await r.json()).toMatchObject({code:'REWARD_PURCHASE_NOT_RELEASED'});
    expect(fake.upstream).not.toHaveBeenCalled();
  });
});
