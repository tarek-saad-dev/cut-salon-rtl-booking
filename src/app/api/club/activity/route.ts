import { NextRequest,NextResponse } from 'next/server';
import { readCutClubActivity,UpstreamClubError } from '@/lib/club/serverCasher';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const noCache={'Cache-Control':'private, no-store, max-age=0','X-Robots-Tag':'noindex'};
const response=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:noCache});

/** Read-only: coins history page of the signed-in member. ?cursor=&type=all|earn|spend */
export async function GET(req:NextRequest){
  const cursor=req.nextUrl.searchParams.get('cursor');
  const type=req.nextUrl.searchParams.get('type')||'all';
  if((cursor&&!/^[A-Za-z0-9_-]{1,120}$/.test(cursor))||!['all','earn','spend'].includes(type))
    return response({ok:false,code:'INVALID_REQUEST'},400);
  try{
    const page=await readCutClubActivity({cursor,type});
    if(!page)return response({ok:false,code:'SESSION_REQUIRED'},401);
    return response({ok:true,...page});
  }catch(error){
    if(error instanceof UpstreamClubError&&[400,401].includes(error.status))
      return response({ok:false,code:error.code},error.status);
    return response({ok:false,code:'CUT_CLUB_UNAVAILABLE'},503);
  }
}
