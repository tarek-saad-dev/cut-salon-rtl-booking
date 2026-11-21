import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import CutClubPage, { metadata } from "./page";
import CutClubMemberGateway from "@/components/club/CutClubMemberGateway";
import CutClubAuth from "@/components/club/CutClubAuth";

const mocks=vi.hoisted(()=>({read:vi.fn(),replace:vi.fn(),refresh:vi.fn()}));
vi.mock("@/lib/club/serverCasher",()=>({readCutClubMember:mocks.read}));
vi.mock("next/navigation",()=>({useRouter:()=>({replace:mocks.replace,refresh:mocks.refresh})}));

describe("CUT CLUB real WhatsApp auth gateway",()=>{
  beforeEach(()=>{
    vi.stubEnv("CUT_CLUB_WEBSITE_AUTH_ENABLED","true");
    vi.clearAllMocks();
    mocks.read.mockResolvedValue(null);
  });
  afterEach(()=>vi.unstubAllEnvs());
  it("keeps existing public wallet-first landing when the production OTP flag is off",async()=>{
    vi.stubEnv("CUT_CLUB_WEBSITE_AUTH_ENABLED","false");
    render(await CutClubMemberGateway({privateMode:false}));
    expect(screen.getByText("سجل حركة النقاط")).toBeInTheDocument();
    expect(screen.queryByRole("button",{name:"استمرار عبر واتساب"})).not.toBeInTheDocument();
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it("renders welcome/phone sign-in for anonymous visitor, no wallet data",async()=>{
    const page=await CutClubMemberGateway({privateMode:false});
    render(page);
    expect(screen.getByRole("heading",{name:/مكافآتك/})).toBeInTheDocument();
    expect(screen.getByRole("button",{name:"استمرار عبر واتساب"})).toBeInTheDocument();
    expect(screen.getByRole("button",{name:"تسجيل الدخول"})).toHaveAttribute("aria-pressed","true");
    expect(screen.queryByText("سجل حركة النقاط")).not.toBeInTheDocument();
    expect(screen.queryByText(/CUT-12345/)).not.toBeInTheDocument();
  });
  it("allows choosing signup purpose, never sends OTP from the browser",async()=>{
    const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({ok:true,resendAfterSec:60})});
    vi.stubGlobal("fetch",fetchMock);
    try{
      render(<CutClubAuth/>);
      fireEvent.click(screen.getByRole("button",{name:"حساب جديد"}));
      fireEvent.change(screen.getByLabelText("رقم الموبايل"),{target:{value:"01557994946"}});
      fireEvent.click(screen.getByRole("button",{name:"استمرار عبر واتساب"}));
      await waitFor(()=>expect(screen.getByLabelText("كود التحقق المكوّن من 6 أرقام")).toBeInTheDocument());
      expect(fetchMock).toHaveBeenCalledWith("/api/club/auth/start",expect.objectContaining({
        method:"POST",credentials:"same-origin",
        body:JSON.stringify({phone:"01557994946",purpose:"CUT_CLUB_SIGNUP"}),
      }));
      expect(screen.getByText(/إعادة الإرسال خلال/)).toBeInTheDocument();
      expect(screen.getByRole("button",{name:"إرسال كود جديد"})).toBeDisabled();
    }finally{vi.unstubAllGlobals();}
  });
  it("submits only six digits to verification, without a clientId or frontend trust flag",async()=>{
    const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({ok:true,resendAfterSec:60})});
    vi.stubGlobal("fetch",fetchMock);
    try{
      render(<CutClubAuth/>);
      fireEvent.change(screen.getByLabelText("رقم الموبايل"),{target:{value:"01557994946"}});
      fireEvent.click(screen.getByRole("button",{name:"استمرار عبر واتساب"}));
      await waitFor(()=>expect(screen.getByLabelText("كود التحقق المكوّن من 6 أرقام")).toBeInTheDocument());
      fireEvent.change(screen.getByLabelText("كود التحقق المكوّن من 6 أرقام"),{target:{value:"123456"}});
      fireEvent.click(screen.getByRole("button",{name:"تأكيد ودخول"}));
      await waitFor(()=>expect(mocks.replace).toHaveBeenCalledWith("/club"));
      const call=fetchMock.mock.calls.find(x=>x[0]==="/api/club/auth/verify");
      expect(call?.[1].body).toBe(JSON.stringify({code:"123456"}));
      expect(call?.[1].body).not.toContain("clientId");
      expect(call?.[1].body).not.toContain("verified");
    }finally{vi.unstubAllGlobals();}
  });
  it("projects actual signed-in customer wallet values, vouchers and ledger from backend DTO",async()=>{
    mocks.read.mockResolvedValue({
      displayName:"مستخدم اختبار",memberCode:"CC-000007",tier:"Gold",coins:155,
      promoCreditMinor:null,
      ownedVouchers:[{id:"inv-1",title:"حمام زيت",status:"active",expiryLabel:null}],
      movements:[{id:"l-1",title:"نقاط زيارة",occurredAtLabel:"2026-11-19",coinsDelta:20}],
      upcomingBooking:null,completedVisits:3,linkStatus:"ACTIVE",
    });
    render(await CutClubMemberGateway({}));
    expect(screen.getAllByText("مستخدم اختبار").length).toBeGreaterThan(0);
    expect(screen.getByText("حمام زيت")).toBeInTheDocument();
    expect(screen.getByText("نقاط زيارة")).toBeInTheDocument();
    expect(screen.getAllByText("١٥٥").length).toBeGreaterThan(0);
  });
  it("never exposes old wallet before staff review, even if OTP succeeded",async()=>{
    mocks.read.mockResolvedValue({
      displayName:"عضو CUT CLUB",memberCode:"حساب موثّق",tier:null,coins:null,
      promoCreditMinor:null,ownedVouchers:null,movements:null,upcomingBooking:null,
      completedVisits:null,linkStatus:"REVIEW_REQUIRED",
    });
    render(await CutClubMemberGateway({}));
    expect(screen.getByText("تأكيد ربط العضوية مطلوب")).toBeInTheDocument();
    expect(screen.getAllByText("البيانات الخاصة لا تظهر للزائر").length).toBeGreaterThan(0);
    expect(screen.queryByText("155")).not.toBeInTheDocument();
  });
  it("shows only verified member identity on the real Profile page",async()=>{
    mocks.read.mockResolvedValue({
      displayName:"مستخدم اختبار",memberCode:"CC-000007",tier:"Gold",coins:155,
      promoCreditMinor:null,ownedVouchers:[],movements:[],upcomingBooking:null,
      completedVisits:3,linkStatus:"ACTIVE",
    });
    render(await CutClubMemberGateway({area:"profile"}));
    expect(screen.getAllByText("مستخدم اختبار").length).toBeGreaterThan(0);
    expect(screen.getByText("CC-000007")).toBeInTheDocument();
    expect(screen.getByText("Gold")).toBeInTheDocument();
  });
  it("preserves public SEO metadata",()=>{
    expect(metadata.alternates).toEqual({canonical:"/cut-club"});
    expect(metadata.openGraph).toMatchObject({url:"/cut-club",title:"CUT CLUB | محفظتك وعضويتك في CUT Salon"});
  });
});
