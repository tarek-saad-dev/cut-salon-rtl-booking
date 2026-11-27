import 'server-only';
import {z} from 'zod';
const pct=z.number().int().min(0).max(100);
const schema=z.object({ok:z.literal(true),rates:z.object({firstVisit:pct,student:pct,club:pct,multiService:pct,friends:z.tuple([pct,pct,pct])}).strict()}).strict();
export type DecemberRates=z.infer<typeof schema>['rates'];
export async function readDecemberRates():Promise<DecemberRates|null>{
 if(process.env.DECEMBER_EXAM_PREVIEW!=='true'||process.env.DECEMBER_EXAM_INTERNAL_REGISTRATION_ENABLED!=='true')return null;
 const key=process.env.DECEMBER_EXAM_BFF_SHARED_KEY,base=process.env.DECEMBER_EXAM_CASHER_ORIGIN;
 if(!key||key.length<32||!base)return null;
 try{
  const url=new URL(base);
  if((url.protocol!=='https:'&&!(process.env.NODE_ENV!=='production'&&url.hostname==='localhost'))||url.username||url.password||url.search||url.hash||url.pathname!=='/')return null;
  const r=await fetch(url.origin+'/api/public/offers/december/rates',{headers:{Authorization:'Bearer '+key},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});
  if(!r.ok)return null;
  const d=schema.safeParse(await r.json());
  if(!d.success)return null;
  const f=d.data.rates.friends;
  return f[0]<=f[1]&&f[1]<=f[2]?d.data.rates:null;
 }catch{return null;}
}
