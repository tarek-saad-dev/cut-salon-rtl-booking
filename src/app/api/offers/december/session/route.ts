import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex'}});
const count=z.number().int().nonnegative().safe();
const result=z.object({ok:z.literal(true),referralCode:z.string().regex(/^CUT-[A-F0-9]{16}$/),
 campaignStatus:z.enum(['ACTIVE','UNAVAILABLE']),counts:z.object({pending:count,confirmed:count,rejected:count}).strict()}).strict();
export async function GET(req:NextRequest){
 if(process.env.DECEMBER_EXAM_PREVIEW!=='true'||process.env.DECEMBER_EXAM_INTERNAL_REGISTRATION_ENABLED!=='true')
  return reply({ok:false,code:'CAMPAIGN_UNAVAILABLE'},503);
 const token=req.cookies.get(process.env.NODE_ENV==='production'?'__Host-december_exam':'december_exam')?.value;
 if(!token||!/^[A-Za-z0-9_-]{43}$/.test(token))return reply({ok:false,code:'SESSION_REQUIRED'},401);
 const key=process.env.DECEMBER_EXAM_BFF_SHARED_KEY,base=process.env.DECEMBER_EXAM_CASHER_ORIGIN;
 if(!key||key.length<32||!base)return reply({ok:false,code:'CAMPAIGN_UNAVAILABLE'},503);
 try{
  const url=new URL(base);
  if((url.protocol!=='https:'&&!(process.env.NODE_ENV!=='production'&&url.hostname==='localhost'))
    ||url.username||url.password||url.search||url.hash||url.pathname!=='/')return reply({ok:false,code:'CAMPAIGN_UNAVAILABLE'},503);
  const upstream=await fetch(url.origin+'/api/public/offers/december/session',{
   headers:{Authorization:'Bearer '+key,'X-December-Session':token,Accept:'application/json'},
   cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
  if(upstream.status===401)return reply({ok:false,code:'SESSION_REQUIRED'},401);
  if(!upstream.ok)return reply({ok:false,code:'CAMPAIGN_UNAVAILABLE'},503);
  const data=result.safeParse(await upstream.json());
  return data.success?reply(data.data):reply({ok:false,code:'CAMPAIGN_UNAVAILABLE'},503);
 }catch{return reply({ok:false,code:'CAMPAIGN_UNAVAILABLE'},503);}
}
