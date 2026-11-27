// Local UX review only. No production API, SQL, or WhatsApp connections.
import { createServer } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

if (process.env.NODE_ENV === 'production' || ['.env','.env.local','.env.development','.env.development.local','.env.production','.env.production.local'].some(existsSync)) {
  throw Error('Use a fresh checkout without any .env files; local synthetic preview only.');
}
const rawPort=process.env.CUT_CLUB_PREVIEW_PORT||'3105';
if(!/^\d{4,5}$/.test(rawPort)||Number(rawPort)<1024||Number(rawPort)>65535)throw Error('Invalid CUT_CLUB_PREVIEW_PORT');
const port=Number(rawPort);
const origin='http://127.0.0.1:'+port;
const next = resolve('node_modules/next/dist/bin/next');
if (!existsSync(next)) throw Error('Run npm ci first.');
const key = randomBytes(32).toString('hex');
const pending = new Map(), sessions = new Map(), requests = [];
const token = () => randomBytes(32).toString('base64url');
const phones = new Map([['01000000000','ACTIVE'],['01000000001','REVIEW_REQUIRED'],['01000000002','SUSPENDED'],['01000000003','UNLINKED']]);
const programs = [
 {code:'DEMO_STUDENT',title:'عضوية الطلاب — مثال تجريبي',kind:'STUDENT',programRevision:1,publicationRevision:1,minimumVisits:0,allowedBranchIds:[1,3],requiresPartner:false},
 {code:'DEMO_DOCTOR',title:'عضوية الأطباء — مثال تجريبي',kind:'DOCTOR',programRevision:1,publicationRevision:1,minimumVisits:0,allowedBranchIds:[3],requiresPartner:false},
 {code:'DEMO_COMPANY',title:'عضوية الشركات — مثال تجريبي',kind:'COMPANY',programRevision:1,publicationRevision:1,minimumVisits:0,allowedBranchIds:[1,3],requiresPartner:true},
];
const rewards = [[15,'ماسك وجه','Face Mask',30,39],[16,'حمام زيت','Oil Bath',50,22],[17,'العناية بالبشرة','Basic SkinCare',90,11],[18,'حلاقة شعر','Hair Cut',220,9]].map(([id,nameAr,nameEn,priceCoins,serviceId])=>({id,nameAr,nameEn,description:'بيانات معاينة وهمية فقط',priceCoins,serviceId,stockState:'available',expiresAfterDays:30,canAfford:priceCoins<=155,serviceMappingReady:true,purchaseAvailable:false}));
const send=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
const fail=(res,status,code)=>send(res,status,{ok:false,code});
async function body(req){let s='';for await(const chunk of req){s+=chunk;if(s.length>2048)throw Error('BODY_LIMIT');}return JSON.parse(s||'{}');}
const server=createServer(async(req,res)=>{
 try {
  if(req.headers.authorization!=='Bearer '+key)return fail(res,403,'NOT_LOCAL_PREVIEW');
  const u=new URL(req.url,'http://localhost');
  const path=u.pathname.replace(/^\/api\/public\/cut-club/,'');
  if(!u.pathname.startsWith('/api/public/cut-club/'))return fail(res,404,'NOT_FOUND');
  const post=req.method==='POST', get=req.method==='GET';
  if(post&&path==='/auth/start'){
    const b=await body(req);const status=phones.get(b.phone);
    if(!status||!['LOGIN','CUT_CLUB_SIGNUP'].includes(b.purpose))return fail(res,400,'INVALID_PHONE');
    const pendingToken=token();pending.set(pendingToken,{status,expires:Date.now()+300000});
    return send(res,200,{ok:true,pendingToken,resendAfterSec:60});
  }
  if(post&&path==='/auth/verify'){
    const b=await body(req),p=pending.get(b.pendingToken);
    if(!p||p.expires<Date.now())return fail(res,410,'OTP_EXPIRED_OR_USED');
    if(b.code!=='123456')return fail(res,401,'INVALID_OTP');
    pending.delete(b.pendingToken);const sessionToken=token();sessions.set(sessionToken,{status:p.status,expires:Date.now()+7200000});
    return send(res,200,{ok:true,sessionToken,status:p.status});
  }
  if(post&&path==='/auth/logout'){const b=await body(req);sessions.delete(b.sessionToken);return send(res,200,{ok:true});}
  if(get&&path==='/membership-programs')return send(res,200,{ok:true,trialOnly:true,enrollmentEnabled:false,benefitsEnabled:false,items:programs});
  const session=sessions.get(req.headers['x-cut-club-session']);
  if(!session||session.expires<Date.now())return fail(res,401,'SESSION_REQUIRED');
  const active=session.status==='ACTIVE';
  if(get&&path==='/wallet')return send(res,200,{ok:true,member:{displayName:active?'عميل تجريبي':'',memberCode:active?'DEMO-001':'',tier:active?'Gold':null,coins:active?155:null,promoCreditMinor:null,ownedVouchers:active?[{id:'demo-1',title:'قسيمة تجريبية',status:'active',expiryLabel:'معاينة فقط'}]:null,movements:active?[{id:'demo-2',title:'زيارة تجريبية',occurredAtLabel:'2026-11-27',coinsDelta:25}]:null,upcomingBooking:null,completedVisits:active?3:null,linkStatus:session.status}});
  if(get&&path==='/memberships')return send(res,200,{ok:true,trialOnly:true,enrollmentEnabled:false,accountStatus:session.status,items:[]});
  if(!active)return fail(res,403,'ACCOUNT_NOT_ELIGIBLE');
  if(get&&path==='/rewards')return send(res,200,{ok:true,balance:155,purchaseEnabled:false,items:rewards});
  if(get&&path==='/wallet/activity')return send(res,200,{ok:true,items:[{id:'demo-2',type:'EARN',title:'زيارة تجريبية',occurredAt:'2026-11-27T10:00:00Z',coinsDelta:25}],nextCursor:null});
  if(get&&path==='/membership-applications')return send(res,200,{ok:true,trialOnly:true,benefitsEnabled:false,items:requests});
  if(post&&path==='/membership-applications'){
    const b=await body(req),p=programs.find(p=>p.code===b.code&&p.publicationRevision===b.publicationRevision&&p.allowedBranchIds.includes(b.branchId));
    if(!p)return fail(res,409,'PROGRAM_CHANGED');
    const old=requests.find(r=>r.code===p.code&&r.publicationRevision===p.publicationRevision);
    if(old&&old.branchId!==b.branchId)return fail(res,409,'APPLICATION_ALREADY_EXISTS');
    if(old)return send(res,200,{ok:true,trialOnly:true,benefitsEnabled:false,id:old.id,replayed:true});
    const r={id:randomUUID(),code:p.code,title:p.title,publicationRevision:p.publicationRevision,branchId:b.branchId,status:'PENDING',createdAt:new Date().toISOString()};requests.push(r);
    return send(res,201,{ok:true,trialOnly:true,benefitsEnabled:false,id:r.id,replayed:false});
  }
  return fail(res,403,'NOT_RELEASED');
 }catch{return fail(res,400,'INVALID_REQUEST');}
});
server.listen(0,'localhost',()=>{
 const addr=server.address();
 if(!addr||typeof addr==='string')throw Error('LOCAL_LISTENER_FAILED');
 const env={};
 for(const k of ['PATH','Path','HOME','USERPROFILE','SystemRoot','SYSTEMROOT','TEMP','TMP','APPDATA','LOCALAPPDATA','ComSpec','PATHEXT','LANG','TERM'])if(process.env[k])env[k]=process.env[k];
 Object.assign(env,{NODE_ENV:'development',NEXT_TELEMETRY_DISABLED:'1',CUT_CLUB_WEBSITE_AUTH_ENABLED:'true',CUT_CLUB_WEBSITE_MEMBERSHIP_TRIAL_ENABLED:'true',CUT_CLUB_WEBSITE_MEMBERSHIP_APPLICATION_ENABLED:'true',CUT_CLUB_CASHER_ORIGIN:'http://localhost:'+addr.port,CUT_CLUB_BFF_SHARED_KEY:key,CUT_CLUB_PUBLIC_ORIGIN:origin,CUT_CLUB_WEBSITE_PUBLIC_ORIGIN:origin});
 console.log('SYNTHETIC PREVIEW ONLY — '+origin+'/club');
 console.log('Local fake phones: 01000000000 active, 01000000001 review, 01000000002 suspended, 01000000003 unlinked. Local fixture code: 123456. No WhatsApp is sent.');
 const child=spawn(process.execPath,[next,'dev','--hostname','127.0.0.1','--port',String(port)],{env,stdio:'inherit'});
 let stopping=false;
 const stop=()=>{if(stopping)return;stopping=true;child.kill();server.close();};
 process.on('SIGINT',stop);process.on('SIGTERM',stop);
 child.on('error',e=>{console.error(e.message);stop();process.exitCode=1;});
 child.on('exit',code=>{server.close();process.exitCode=code??0;});
});
