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
  const pending=req.cookies.get(clubCookieNames.pending)?.value;
  if(!pending||!/^[A-Za-z0-9_-]{43}$/.test(pending))return response({ok:false,code:'OTP_EXPIRED_OR_USED'},410);
  try{
    const body=await req.json();
    if(typeof body?.code!=='string'||!/^\d{6}$/.test(body.code))return response({ok:false,code:'INVALID_OTP'},400);
    const result=await casherMemberRequest('/auth/verify',{method:'POST',body:{pendingToken:pending,code:body.code}}) as Record<string,unknown>;
    if(result?.ok!==true || typeof result.sessionToken!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(result.sessionToken) ||
      !['ACTIVE','UNLINKED','REVIEW_REQUIRED'].includes(String(result.status)))
      return response({ok:false,code:'CUT_CLUB_UNAVAILABLE'},503);
    const answer=response({ok:true,status:result.status});
    answer.cookies.set(clubCookieNames.session,result.sessionToken,{...cookieOptions,maxAge:7200});
    answer.cookies.set(clubCookieNames.pending,'',{...cookieOptions,maxAge:0});
    return answer;
  }catch(err){return fail(err);}
}
