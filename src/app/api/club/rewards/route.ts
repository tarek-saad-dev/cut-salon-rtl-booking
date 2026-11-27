import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {
  casherMemberRequest,clubCookieNames,clubRewardCatalogResponse,UpstreamClubError,
} from '@/lib/club/serverCasher';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store, max-age=0','X-Robots-Tag':'noindex'};
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers});
/** Verified cookie session only. No clientId and no mutations on this endpoint. */
export async function GET(){
  const token=(await cookies()).get(clubCookieNames.session)?.value;
  if(!token||!/^[A-Za-z0-9_-]{43}$/.test(token))return reply({ok:false,code:'SESSION_REQUIRED'},401);
  try{
    const result=clubRewardCatalogResponse.safeParse(
      await casherMemberRequest('/rewards',{sessionToken:token})
    );
    if(!result.success)return reply({ok:false,code:'UPSTREAM_INVALID'},502);
    return reply(result.data);
  }catch(e){
    if(e instanceof UpstreamClubError&&[400,401,403].includes(e.status))
      return reply({ok:false,code:e.code},e.status);
    return reply({ok:false,code:'CUT_CLUB_UNAVAILABLE'},503);
  }
}
export async function POST(){return reply({ok:false,code:'REWARD_PURCHASE_NOT_RELEASED'},403);}
