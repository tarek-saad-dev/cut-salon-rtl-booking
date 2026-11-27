import 'server-only';
import {z} from 'zod';
const schema=z.object({ok:z.literal(true),items:z.array(z.object({type:z.enum(['UNIVERSITY','SCHOOL','INSTITUTE']),institution:z.string().min(1).max(120),faculty:z.string().max(120)})).max(1000)}).strict();
export type EducationSuggestion=z.infer<typeof schema>['items'][number];
export async function readEducationSuggestions():Promise<EducationSuggestion[]>{
 const key=process.env.DECEMBER_EXAM_BFF_SHARED_KEY,base=process.env.DECEMBER_EXAM_CASHER_ORIGIN;
 if(process.env.DECEMBER_EXAM_PREVIEW!=='true'||process.env.DECEMBER_EXAM_INTERNAL_REGISTRATION_ENABLED!=='true'||!key||key.length<32||!base)return [];
 try{
 const u=new URL(base);
 if((u.protocol!=='https:'&&!(process.env.NODE_ENV!=='production'&&u.hostname==='localhost'))||u.username||u.password||u.search||u.hash||u.pathname!=='/')return [];
 const r=await fetch(u.origin+'/api/public/offers/december/education',{headers:{Authorization:'Bearer '+key},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)});
 if(!r.ok)return [];const data=schema.safeParse(await r.json());return data.success?data.data.items:[];
 }catch{return [];}
}
