import { NextRequest,NextResponse } from 'next/server';
import { clubCookieNames, casherMemberRequest,UpstreamClubError } from '@/lib/club/serverCasher';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const noCache={'Cache-Control':'private, no-store, max-age=0','X-Robots-Tag':'noindex'};
const response=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:noCache});
const authOrigin=(req:NextRequest)=>{
  const origin=req.headers.get('origin');
  // VPS may proxy Next on localhost: do NOT derive the public trust boundary
  // from Host/X-Forwarded-Host supplied by a remote browser.
  const expected=process.env.CUT_CLUB_PUBLIC_ORIGIN ||
    (process.env.NODE_ENV==='production'?'https://cutsaloon.com':req.nextUrl.origin);
  return origin===expected && req.headers.get('content-type')?.startsWith('application/json')===true;
};
const cookieOptions={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/'};
function fail(error:unknown){
  if(error instanceof UpstreamClubError){
    if([400,401,409,410,429].includes(error.status))
      return response({ok:false,code:error.code},error.status);
  }
  return response({ok:false,code:'CUT_CLUB_UNAVAILABLE'},503);
}

export async function POST(req:NextRequest){
  if(!authOrigin(req))return response({ok:false,code:'ORIGIN_REQUIRED'},403);
  const token=req.cookies.get(clubCookieNames.session)?.value;
  if(token&&/^[A-Za-z0-9_-]{43}$/.test(token)){
    try{await casherMemberRequest('/auth/logout',{method:'POST',body:{sessionToken:token}});}
    catch(err){return fail(err);} // Never claim logout complete while upstream token remains valid.
  }
  const answer=response({ok:true});
  answer.cookies.delete(clubCookieNames.session);
  answer.cookies.delete(clubCookieNames.pending);
  return answer;
}
