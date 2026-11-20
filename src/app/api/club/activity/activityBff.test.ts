import { describe,it,expect,vi,beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mocks=vi.hoisted(()=>({read:vi.fn()}));
vi.mock('@/lib/club/serverCasher',()=>({
  readCutClubActivity:mocks.read,
  UpstreamClubError:class UpstreamClubError extends Error {constructor(public status:number,public code:string){super(code);}},
}));
import { GET } from '@/app/api/club/activity/route';
import { UpstreamClubError } from '@/lib/club/serverCasher';

const get=(q='')=>GET(new NextRequest('https://cutsaloon.com/api/club/activity'+q));
describe('CUT CLUB activity BFF',()=>{
  beforeEach(()=>mocks.read.mockReset());
  it('rejects malformed cursor or type without calling Casher',async()=>{
    expect((await get('?cursor=../../x')).status).toBe(400);
    expect((await get('?type=drop')).status).toBe(400);
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it('requires a member session',async()=>{
    mocks.read.mockResolvedValueOnce(null);
    expect((await get()).status).toBe(401);
  });
  it('returns a private, non-cached page and forwards cursor/type',async()=>{
    mocks.read.mockResolvedValueOnce({items:[{id:'5',type:'EARN_SALE',title:'نقاط من زيارة',occurredAt:'2026-11-01T10:00:05.000Z',coinsDelta:10}],nextCursor:'abc_DEF-1'});
    const res=await get('?cursor=abc_DEF-0&type=earn');
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('no-store');
    expect(await res.json()).toMatchObject({ok:true,nextCursor:'abc_DEF-1',items:[{id:'5'}]});
    expect(mocks.read).toHaveBeenCalledWith({cursor:'abc_DEF-0',type:'earn'});
  });
  it('hides upstream failures behind a generic code',async()=>{
    mocks.read.mockRejectedValueOnce(new UpstreamClubError(500,'SQL_LEAK'));
    const res=await get();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ok:false,code:'CUT_CLUB_UNAVAILABLE'});
  });
});
