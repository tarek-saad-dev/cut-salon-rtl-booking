import 'server-only';
import { cookies } from 'next/headers';
import { z } from 'zod';

const voucher=z.object({
  id:z.string().max(60),title:z.string().max(200),
  status:z.enum(['active','used','expired']),expiryLabel:z.string().nullable(),
}).strict();
const movement=z.object({
  id:z.string().max(60),title:z.string().max(200),
  occurredAtLabel:z.string().max(64),coinsDelta:z.number().finite(),
}).strict();
export const clubWalletResponse=z.object({
  ok:z.literal(true),
  member:z.object({
    displayName:z.string().max(100),
    memberCode:z.string().max(80),
    tier:z.string().nullable(),
    coins:z.number().finite().nonnegative().max(Number.MAX_SAFE_INTEGER).nullable(),
    promoCreditMinor:z.number().int().nonnegative().safe().nullable(),
    ownedVouchers:z.array(voucher).max(50).nullable(),
    movements:z.array(movement).max(30).nullable(),
    upcomingBooking:z.object({service:z.string(),date:z.string(),branch:z.string()}).nullable(),
    completedVisits:z.number().int().nonnegative().safe().nullable(),
    linkStatus:z.enum(['ACTIVE','UNLINKED','REVIEW_REQUIRED','SUSPENDED']),
  }).strict(),
}).strict();
export type CasherMember = z.infer<typeof clubWalletResponse>['member'];
export const clubActivityResponse=z.object({
  ok:z.literal(true),
  items:z.array(z.object({
    id:z.string().max(60),type:z.string().max(50),title:z.string().max(200),
    occurredAt:z.string().max(40),coinsDelta:z.number().finite(),
  }).strict()).max(50),
  nextCursor:z.string().max(120).nullable(),
}).strict();
export type CasherActivityPage = Omit<z.infer<typeof clubActivityResponse>,'ok'>;
export const clubRewardCatalogResponse=z.object({
  ok:z.literal(true),balance:z.number().finite().nonnegative().nullable(),
  purchaseEnabled:z.literal(false),
  items:z.array(z.object({
    id:z.number().int().positive(),
    nameAr:z.string().max(100),nameEn:z.string().max(100),
    description:z.string().max(350),
    priceCoins:z.number().finite().nonnegative(),
    serviceId:z.number().int().positive().nullable(),
    stockState:z.enum(['available','out_of_stock']),
    expiresAfterDays:z.number().int().positive().nullable(),
    canAfford:z.boolean().nullable(),serviceMappingReady:z.boolean(),
    purchaseAvailable:z.literal(false),
  }).strict()).max(4),
}).strict();
export type CasherRewardCatalog=Omit<z.infer<typeof clubRewardCatalogResponse>,'ok'>;


const cookiesByEnv=()=>process.env.NODE_ENV==='production'
  ? {pending:'__Host-cutclub_pending',session:'__Host-cutclub_session'}
  : {pending:'cutclub_pending',session:'cutclub_session'};
export const clubCookieNames=cookiesByEnv();

export class UpstreamClubError extends Error {
  constructor(public status:number,public code:string){super(code);}
}
function config() {
  if (process.env.CUT_CLUB_WEBSITE_AUTH_ENABLED !== "true")
    throw new UpstreamClubError(503,"CUT_CLUB_NOT_ENABLED");
  const base=process.env.CUT_CLUB_CASHER_ORIGIN?.trim();
  const key=process.env.CUT_CLUB_BFF_SHARED_KEY;
  if(!base||!key||key.length<32)throw new UpstreamClubError(503,'CUT_CLUB_NOT_CONFIGURED');
  const url=new URL(base);
  if(url.protocol!=='https:' && !(process.env.NODE_ENV!=='production' && url.hostname==='localhost'))
    throw new UpstreamClubError(503,'CUT_CLUB_NOT_CONFIGURED');
  if(url.username||url.password||url.search||url.hash)throw new UpstreamClubError(503,'CUT_CLUB_NOT_CONFIGURED');
  return {url:url.origin,key};
}
export async function casherMemberRequest(
  path:'/auth/start'|'/auth/verify'|'/auth/logout'|'/wallet'|'/rewards'|'/memberships'|'/membership-programs'|'/membership-applications'|`/wallet/activity?${string}`,
  options:{method?:'GET'|'POST';body?:unknown;sessionToken?:string}={},
):Promise<unknown>{
  const {url,key}=config();
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15_000);
  try{
    const response=await fetch(url+'/api/public/cut-club'+path,{
      method:options.method??'GET',
      headers:{
        Authorization:'Bearer '+key,
        Accept:'application/json',
        ...(options.body===undefined?{}:{'Content-Type':'application/json'}),
        ...(options.sessionToken?{'X-Cut-Club-Session':options.sessionToken}:{})
      },
      body:options.body===undefined?undefined:JSON.stringify(options.body),
      cache:'no-store',signal:controller.signal,
      redirect:'error',
    });
    const raw=await response.json().catch(()=>null) as Record<string,unknown>|null;
    if(!response.ok) {
      const code=typeof raw?.code==='string'?raw.code:'UPSTREAM_UNAVAILABLE';
      throw new UpstreamClubError(response.status,code);
    }
    return raw;
  }finally{clearTimeout(timer);}
}
export async function readCutClubMember():Promise<CasherMember|null> {
  const token=(await cookies()).get(clubCookieNames.session)?.value;
  if(!token||!/^[A-Za-z0-9_-]{43}$/.test(token))return null;
  try{
    const raw=await casherMemberRequest('/wallet',{sessionToken:token});
    const checked=clubWalletResponse.safeParse(raw);
    return checked.success?checked.data.member:null;
  }catch{return null;}
}

/** Paginated coins history for the cookie session owner. null = no/invalid session. */
export async function readCutClubActivity(opts:{cursor?:string|null;type?:string|null}):Promise<CasherActivityPage|null>{
  const token=(await cookies()).get(clubCookieNames.session)?.value;
  if(!token||!/^[A-Za-z0-9_-]{43}$/.test(token))return null;
  const q=new URLSearchParams({limit:'20'});
  if(opts.cursor)q.set('cursor',opts.cursor);
  if(opts.type)q.set('type',opts.type);
  const raw=await casherMemberRequest(`/wallet/activity?${q.toString()}`,{sessionToken:token});
  const checked=clubActivityResponse.safeParse(raw);
  if(!checked.success)throw new UpstreamClubError(502,'UPSTREAM_INVALID');
  return {items:checked.data.items,nextCursor:checked.data.nextCursor};
}
