import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private,no-store','X-Robots-Tag':'noindex'}});
export async function POST(req:NextRequest){
 if(process.env.DECEMBER_EXAM_PREVIEW!=='true'||process.env.DECEMBER_EXAM_INTERNAL_REGISTRATION_ENABLED!=='true')return reply({ok:false,code:'CAMPAIGN_UNAVAILABLE'},503);
 const origin=process.env.DECEMBER_EXAM_PUBLIC_ORIGIN||(process.env.NODE_ENV==='production'?'https://cutsaloon.com':req.nextUrl.origin);
 if(req.headers.get('origin')!==origin||!req.headers.get('content-type')?.startsWith('application/json'))return reply({ok:false,code:'INVALID_REQUEST'},403);
 const length=Number(req.headers.get('content-length'));if(!Number.isSafeInteger(length)||length<1||length>512)return reply({ok:false,code:'INVALID_REQUEST'},400);
 const raw=await req.text();if(Buffer.byteLength(raw)>512)return reply({ok:false,code:'INVALID_REQUEST'},400);
 let token:unknown;try{token=JSON.parse(raw)?.token;}catch{return reply({ok:false,code:'INVALID_REQUEST'},400);}
 if(typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(token))return reply({ok:false,code:'INVALID_REQUEST'},400);
 const key=process.env.DECEMBER_EXAM_BFF_SHARED_KEY,base=process.env.DECEMBER_EXAM_CASHER_ORIGIN;
 if(!key||key.length<32||!base)return reply({ok:false,code:'CAMPAIGN_UNAVAILABLE'},503);
 try{
 const url=new URL(base);if((url.protocol!=='https:'&&!(process.env.NODE_ENV!=='production'&&url.hostname==='localhost'))||url.username||url.password||url.search||url.hash||url.pathname!=='/')return reply({ok:false,code:'CAMPAIGN_UNAVAILABLE'},503);
 const r=await fetch(url.origin+'/api/public/offers/december/session',{headers:{Authorization:'Bearer '+key,'X-December-Session':token},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});
 if(!r.ok)return reply({ok:false,code:'RECOVERY_FAILED'},r.status===401?401:503);
 const data=await r.json();if(data?.ok!==true||data.campaignStatus!=='ACTIVE')return reply({ok:false,code:'RECOVERY_FAILED'},401);
 const response=reply({ok:true});
 response.cookies.set(process.env.NODE_ENV==='production'?'__Host-december_exam':'december_exam',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:31*86400});
 return response;
 }catch{return reply({ok:false,code:'CAMPAIGN_UNAVAILABLE'},503);}
}
