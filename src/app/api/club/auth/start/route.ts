import { NextRequest,NextResponse } from 'next/server';
import { clubCookieNames, casherMemberRequest,UpstreamClubError } from '@/lib/club/serverCasher';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const noCache={'Cache-Control':'private, no-store, max-age=0','X-Robots-Tag':'noindex'};
const response=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:noCache});
const authOrigin=(req:NextRequest)=>{
  const origin=req.headers.get('origin');
  return origin===req.nextUrl.origin && req.headers.get('content-type')?.startsWith('application/json')===true;
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
  try{
    const body=await req.json();
    if(!body || typeof body.phone!=='string'||body.phone.length>32 ||
      (body.purpose!=='LOGIN'&&body.purpose!=='CUT_CLUB_SIGNUP'))
      return response({ok:false,code:'INVALID_REQUEST'},400);
    const result=await casherMemberRequest('/auth/start',{method:'POST',body:{phone:body.phone,purpose:body.purpose}}) as Record<string,unknown>;
    if(result?.ok!==true ||typeof result.pendingToken!=='string' || !/^[A-Za-z0-9_-]{43}$/.test(result.pendingToken))
      return response({ok:false,code:'CUT_CLUB_UNAVAILABLE'},503);
    const answer=response({ok:true,resendAfterSec:typeof result.resendAfterSec==='number'?result.resendAfterSec:60});
    answer.cookies.set(clubCookieNames.pending,result.pendingToken,{...cookieOptions,maxAge:300});
    return answer;
  }catch(err){return fail(err);}
}
