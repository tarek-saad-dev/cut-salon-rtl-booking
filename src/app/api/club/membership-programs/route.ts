import {NextRequest,NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {casherMemberRequest,clubCookieNames,UpstreamClubError} from '@/lib/club/serverCasher';
import {membershipProgramsResponse} from '@/lib/club/membershipProgramsContract';
export const runtime='nodejs';export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store, max-age=0','X-Robots-Tag':'noindex'}});
export async function GET(req:NextRequest){
 if(process.env.CUT_CLUB_WEBSITE_MEMBERSHIP_TRIAL_ENABLED!=='true')return reply({ok:false,code:'PUBLICATION_NOT_RELEASED'},403);
 if(req.nextUrl.search)return reply({ok:false,code:'INVALID_REQUEST'},400);
 const token=(await cookies()).get(clubCookieNames.session)?.value;
 if(!token||!/^[A-Za-z0-9_-]{43}$/.test(token))return reply({ok:false,code:'SESSION_REQUIRED'},401);
 try{
 const parsed=membershipProgramsResponse.safeParse(await casherMemberRequest('/membership-programs'));
 if(!parsed.success)return reply({ok:false,code:'UPSTREAM_INVALID'},502);
 return reply(parsed.data);
 }catch(e){if(e instanceof UpstreamClubError&&e.status===403)return reply({ok:false,code:'PUBLICATION_NOT_RELEASED'},403);
 return reply({ok:false,code:'PUBLICATION_UNAVAILABLE'},503);}
}
export async function POST(){return reply({ok:false,code:'ENROLLMENT_NOT_RELEASED'},403);}
