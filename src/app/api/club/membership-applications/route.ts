import {NextRequest,NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {casherMemberRequest,clubCookieNames,UpstreamClubError} from '@/lib/club/serverCasher';
import {applicationSubmission,applicationCreated,applicationsResponse} from '@/lib/club/membershipApplicationContract';
export const runtime='nodejs';export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store, max-age=0','X-Robots-Tag':'noindex'}});
const enabled=()=>process.env.CUT_CLUB_WEBSITE_MEMBERSHIP_TRIAL_ENABLED==='true'&&process.env.CUT_CLUB_WEBSITE_MEMBERSHIP_APPLICATION_ENABLED==='true';
const token=async()=>{const t=(await cookies()).get(clubCookieNames.session)?.value;return t&&/^[A-Za-z0-9_-]{43}$/.test(t)?t:null;};
const failure=(e:unknown)=>e instanceof UpstreamClubError&&[400,401,403,409].includes(e.status)?reply({ok:false,code:e.code},e.status):reply({ok:false,code:'APPLICATIONS_UNAVAILABLE'},503);
export async function GET(req:NextRequest){
 if(!enabled())return reply({ok:false,code:'APPLICATIONS_NOT_RELEASED'},403);
 if(req.nextUrl.search)return reply({ok:false,code:'INVALID_REQUEST'},400);
 const sessionToken=await token();if(!sessionToken)return reply({ok:false,code:'SESSION_REQUIRED'},401);
 try{const parsed=applicationsResponse.safeParse(await casherMemberRequest('/membership-applications',{sessionToken}));return parsed.success?reply(parsed.data):reply({ok:false,code:'UPSTREAM_INVALID'},502);}catch(e){return failure(e);}
}
export async function POST(req:NextRequest){
 if(!enabled())return reply({ok:false,code:'APPLICATIONS_NOT_RELEASED'},403);
 const origin=process.env.CUT_CLUB_WEBSITE_PUBLIC_ORIGIN||(process.env.NODE_ENV==='production'?'https://cutsaloon.com':req.nextUrl.origin);
 if(req.nextUrl.search||req.headers.get('origin')!==origin||!req.headers.get('content-type')?.startsWith('application/json'))return reply({ok:false,code:'INVALID_REQUEST'},403);
 const sessionToken=await token();if(!sessionToken)return reply({ok:false,code:'SESSION_REQUIRED'},401);
 const raw=await req.text().catch(()=>null);if(!raw||raw.length>2048)return reply({ok:false,code:'INVALID_APPLICATION'},400);
 let input:unknown;try{input=JSON.parse(raw);}catch{return reply({ok:false,code:'INVALID_APPLICATION'},400);}
 const checked=applicationSubmission.safeParse(input);if(!checked.success)return reply({ok:false,code:'INVALID_APPLICATION'},400);
 try{const parsed=applicationCreated.safeParse(await casherMemberRequest('/membership-applications',{method:'POST',sessionToken,body:checked.data}));return parsed.success?reply(parsed.data,201):reply({ok:false,code:'UPSTREAM_INVALID'},502);}catch(e){return failure(e);}
}
