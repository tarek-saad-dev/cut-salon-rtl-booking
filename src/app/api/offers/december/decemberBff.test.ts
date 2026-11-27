// @vitest-environment node
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
import {POST as register} from './register/route';
import {GET as session} from './session/route';
import {POST as recover} from './recover/route';
const origin='https://cutsaloon.example', upstream='https://casher.example', key='integration-test-only-key-12345678901234567890',token='A'.repeat(43);
function post(path:string,body:unknown,source=origin){
 const raw=JSON.stringify(body);
 return new NextRequest(origin+path,{method:'POST',headers:{origin:source,'content-type':'application/json','content-length':String(Buffer.byteLength(raw))},body:raw});
}
const user={name:'Test student',phone:'01000000101',student:true,education:{type:'UNIVERSITY',university:'Test university',faculty:'Test faculty'}};
const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
describe('December BFF HTTP contract',()=>{
 beforeEach(()=>{
  vi.stubEnv('DECEMBER_EXAM_PREVIEW','true');vi.stubEnv('DECEMBER_EXAM_INTERNAL_REGISTRATION_ENABLED','true');
  vi.stubEnv('DECEMBER_EXAM_PUBLIC_ORIGIN',origin);vi.stubEnv('DECEMBER_EXAM_CASHER_ORIGIN',upstream);vi.stubEnv('DECEMBER_EXAM_BFF_SHARED_KEY',key);
 });
 afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
 it('sets HttpOnly campaign session without leaking token or shared key to the browser response',async()=>{
  const fetcher=vi.fn().mockResolvedValue(response({ok:true,sessionToken:token,referralCode:'CUT-ABCDEF1234567890',identityStatus:'PENDING',referralStatus:null},201));vi.stubGlobal('fetch',fetcher);
  const r=await register(post('/api/offers/december/register',user));expect(r.status).toBe(201);
  expect(await r.json()).toEqual({ok:true,referralCode:'CUT-ABCDEF1234567890',identityStatus:'PENDING',referralStatus:null});
  expect(r.headers.get('set-cookie')).toContain('HttpOnly');expect(r.headers.get('cache-control')).toContain('no-store');
  const [url,options]=fetcher.mock.calls[0];expect(url).toBe(upstream+'/api/public/offers/december/register');expect(options.headers.Authorization).toBe('Bearer '+key);
  expect(options.redirect).toBe('error');expect(JSON.parse(options.body)).toEqual(user);
 });
 it('rejects cross-origin and disabled registration before any upstream request',async()=>{
  const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
  expect((await register(post('/api/offers/december/register',user,'https://untrusted.example'))).status).toBe(403);
  vi.stubEnv('DECEMBER_EXAM_PREVIEW','false');expect((await register(post('/api/offers/december/register',user))).status).toBe(503);
  expect(fetcher).not.toHaveBeenCalled();
 });
 it('does not mint a cookie on an invalid referral, quota, or malformed successful response',async()=>{
  const fetcher=vi.fn().mockResolvedValueOnce(response({ok:false,code:'INVALID_REFERRAL_CODE'},400)).mockResolvedValueOnce(response({ok:false,code:'REGISTRATION_BUSY'},429)).mockResolvedValueOnce(response({ok:true,sessionToken:token,referralCode:'bad'},201));vi.stubGlobal('fetch',fetcher);
  for(const expected of [400,429,503]){const r=await register(post('/api/offers/december/register',user));expect(r.status).toBe(expected);expect(r.headers.get('set-cookie')).toBeNull();}
 });
 it('returns campaign consumption only and rejects unexpected personal fields',async()=>{
  const value={ok:true,referralCode:'CUT-ABCDEF1234567890',campaignStatus:'ACTIVE',redeemed:true,counts:{confirmed:1,pending:0,rejected:0}};
  const fetcher=vi.fn().mockResolvedValueOnce(response(value)).mockResolvedValueOnce(response({...value,phone:user.phone}));vi.stubGlobal('fetch',fetcher);
  const request=()=>new NextRequest(origin+'/api/offers/december/session',{headers:{cookie:'december_exam='+token}});
  const r=await session(request());expect(r.status).toBe(200);expect(await r.json()).toEqual(value);
  expect((await session(request())).status).toBe(503);
 });
 it('recovers only with a valid active session and never returns the replacement token in JSON',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(response({ok:false},401)).mockResolvedValueOnce(response({ok:true,campaignStatus:'ACTIVE'})));
  const bad=await recover(post('/api/offers/december/recover',{token}));expect(bad.status).toBe(401);expect(bad.headers.get('set-cookie')).toBeNull();
  const good=await recover(post('/api/offers/december/recover',{token}));expect(good.status).toBe(200);expect(await good.json()).toEqual({ok:true});expect(good.headers.get('set-cookie')).toContain('HttpOnly');
 });
});
