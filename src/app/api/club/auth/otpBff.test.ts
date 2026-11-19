import { describe,it,expect,vi,beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mocks=vi.hoisted(()=>({casher:vi.fn()}));
vi.mock('@/lib/club/serverCasher',()=>({
  clubCookieNames:{pending:'cutclub_pending',session:'cutclub_session'},
  casherMemberRequest:mocks.casher,
  UpstreamClubError:class UpstreamClubError extends Error {constructor(public status:number,public code:string){super(code);}},
}));
import { POST as start } from '@/app/api/club/auth/start/route';
import { POST as verify } from '@/app/api/club/auth/verify/route';
import { POST as logout } from '@/app/api/club/auth/logout/route';

const pending='A'.repeat(43),session='B'.repeat(43);
function req(path:string,body:unknown,origin='https://cutsaloon.com',cookie=''){
  return new NextRequest('https://cutsaloon.com'+path,{
    method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},
    body:JSON.stringify(body),
  });
}
describe('CUT CLUB frontend OTP BFF security',()=>{
  beforeEach(()=>mocks.casher.mockReset());
  it('rejects CSRF and never forwards untrusted origin to Casher',async()=>{
    const response=await start(req('/api/club/auth/start',{phone:'01557994946',purpose:'LOGIN'},'https://evil.example'));
    expect(response.status).toBe(403);
    expect(mocks.casher).not.toHaveBeenCalled();
  });
  it('puts pending token ONLY in HttpOnly cookie, not JSON, for LOGIN purpose',async()=>{
    mocks.casher.mockResolvedValueOnce({ok:true,pendingToken:pending,resendAfterSec:60});
    const response=await start(req('/api/club/auth/start',{phone:'01557994946',purpose:'LOGIN'}));
    const json=await response.json();
    expect(json).toEqual({ok:true,resendAfterSec:60});
    expect(JSON.stringify(json)).not.toContain(pending);
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(response.headers.get('set-cookie')).toContain('SameSite=lax');
    expect(mocks.casher).toHaveBeenCalledWith('/auth/start',{method:'POST',body:{phone:'01557994946',purpose:'LOGIN'}});
  });
  it('verifies code using cookie-bound pending capability without phone/clientId',async()=>{
    mocks.casher.mockResolvedValueOnce({ok:true,sessionToken:session,status:'ACTIVE'});
    const response=await verify(req('/api/club/auth/verify',{code:'123456'},undefined,'cutclub_pending='+pending));
    const json=await response.json();
    expect(json).toEqual({ok:true,status:'ACTIVE'});
    expect(JSON.stringify(json)).not.toContain(session);
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(mocks.casher).toHaveBeenCalledWith('/auth/verify',{method:'POST',body:{pendingToken:pending,code:'123456'}});
  });
  it('does not accept verified true or clientId from browser as OTP proof',async()=>{
    const response=await verify(req('/api/club/auth/verify',{verified:true,clientId:12},undefined,'cutclub_pending='+pending));
    expect(response.status).toBe(400);
    expect(mocks.casher).not.toHaveBeenCalled();
  });
  it('rejects missing pending browser session and double-submit shape',async()=>{
    const response=await verify(req('/api/club/auth/verify',{code:'123456'}));
    expect(response.status).toBe(410);
    expect(mocks.casher).not.toHaveBeenCalled();
  });
  it('revokes session upstream and clears both cookies on logout',async()=>{
    mocks.casher.mockResolvedValueOnce({ok:true});
    const response=await logout(req('/api/club/auth/logout',{},undefined,'cutclub_session='+session));
    expect((await response.json()).ok).toBe(true);
    expect(mocks.casher).toHaveBeenCalledWith('/auth/logout',{method:'POST',body:{sessionToken:session}});
    expect(response.headers.get('set-cookie')).toMatch(/Max-Age=0|Expires=/);
  });
});
