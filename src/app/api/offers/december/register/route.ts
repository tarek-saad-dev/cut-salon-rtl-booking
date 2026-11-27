import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex'}});
const upstreamResponse=z.object({ok:z.literal(true),sessionToken:z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  referralCode:z.string().regex(/^CUT-[A-F0-9]{16}$/),identityStatus:z.literal('PENDING'),referralStatus:z.literal('PENDING').nullable()}).strict();
export async function POST(req:NextRequest){
  // Not a production launch switch: enable only in controlled integration environments.
  if(process.env.DECEMBER_EXAM_PREVIEW!=='true'||process.env.DECEMBER_EXAM_INTERNAL_REGISTRATION_ENABLED!=='true')
    return reply({ok:false,code:'CAMPAIGN_UNAVAILABLE'},503);
  const expected=process.env.DECEMBER_EXAM_PUBLIC_ORIGIN || (process.env.NODE_ENV==='production'?'https://cutsaloon.com':req.nextUrl.origin);
  if(req.headers.get('origin')!==expected||!req.headers.get('content-type')?.startsWith('application/json'))
    return reply({ok:false,code:'INVALID_REQUEST'},403);
  const length=Number(req.headers.get('content-length'));
  if(!Number.isSafeInteger(length)||length<=0||length>8192)return reply({ok:false,code:'INVALID_REQUEST'},400);
  const key=process.env.DECEMBER_EXAM_BFF_SHARED_KEY,base=process.env.DECEMBER_EXAM_CASHER_ORIGIN;
  if(!key||key.length<32||!base)return reply({ok:false,code:'CAMPAIGN_UNAVAILABLE'},503);
  try{
    const url=new URL(base);
    if((url.protocol!=='https:'&&!(process.env.NODE_ENV!=='production'&&url.hostname==='localhost'))
      ||url.username||url.password||url.search||url.hash||url.pathname!=='/')return reply({ok:false,code:'CAMPAIGN_UNAVAILABLE'},503);
    const raw=await req.text();
    if(Buffer.byteLength(raw)>8192)return reply({ok:false,code:'INVALID_REQUEST'},400);
    let body:unknown;
    try{body=JSON.parse(raw);}catch{return reply({ok:false,code:'INVALID_REQUEST'},400);}
    const upstream=await fetch(url.origin+'/api/public/offers/december/register',{
      method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify(body),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000),
    });
    const data=await upstream.json().catch(()=>null);
    if(!upstream.ok){
      const code=typeof data?.code==='string'?data.code:'CAMPAIGN_UNAVAILABLE';
      if(upstream.status===400&&['INVALID_REGISTRATION','INVALID_REFERRAL_CODE','INVALID_REQUEST'].includes(code))return reply({ok:false,code},400);
      if(upstream.status===429)return reply({ok:false,code:'REGISTRATION_BUSY'},429);
      if(upstream.status===409)return reply({ok:false,code:'REGISTRATION_REVIEW_REQUIRED'},409);
      return reply({ok:false,code:'CAMPAIGN_UNAVAILABLE'},503);
    }
    const checked=upstreamResponse.safeParse(data);
    if(!checked.success)return reply({ok:false,code:'CAMPAIGN_UNAVAILABLE'},503);
    const {sessionToken,...publicResult}=checked.data;
    const answer=reply(publicResult,201);
    answer.cookies.set(process.env.NODE_ENV==='production'?'__Host-december_exam':'december_exam',sessionToken,{
      httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*31,
    });
    return answer;
  }catch{return reply({ok:false,code:'CAMPAIGN_UNAVAILABLE'},503);}
}
