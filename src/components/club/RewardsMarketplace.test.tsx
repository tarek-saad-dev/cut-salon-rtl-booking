import {act,fireEvent,render,screen,waitFor} from "@testing-library/react";
import {afterEach,describe,expect,it,vi} from "vitest";
import RewardsMarketplace from "./RewardsMarketplace";

const reward={id:15,nameAr:"ماسك وجه",nameEn:"Face Mask",description:"خدمة",priceCoins:30,
  serviceId:39,stockState:"available",expiresAfterDays:30,canAfford:true,serviceMappingReady:true,purchaseAvailable:false};
const response=(balance:number)=>({ok:true,status:200,json:async()=>({ok:true,balance,purchaseEnabled:false,items:[reward]})});

describe("CUT CLUB read-only reward storefront",()=>{
  afterEach(()=>vi.unstubAllGlobals());
  it("shows the real catalog but never enables checkout",async()=>{
    vi.stubGlobal("fetch",vi.fn().mockResolvedValue(response(250)));
    render(<RewardsMarketplace/>);
    expect(await screen.findByRole("heading",{name:"ماسك وجه"})).toBeInTheDocument();
    expect(screen.getByRole("button",{name:"شراء ماسك وجه غير متاح حاليًا"})).toBeDisabled();
    expect(screen.getByText("٢٥٠ CC")).toBeInTheDocument();
  });
  it("ignores an older response when a newer refresh has completed",async()=>{
    let finishOld!:(value:unknown)=>void;
    const old=new Promise(resolve=>{finishOld=resolve;});
    const fetchMock=vi.fn().mockReturnValueOnce(old).mockResolvedValueOnce(response(50));
    vi.stubGlobal("fetch",fetchMock);
    render(<RewardsMarketplace/>);
    await waitFor(()=>expect(fetchMock).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button",{name:"تحديث"}));
    expect(await screen.findByText("٥٠ CC")).toBeInTheDocument();
    await act(async()=>{finishOld(response(250));await old;});
    expect(screen.queryByText("٢٥٠ CC")).not.toBeInTheDocument();
    expect(screen.getByText("٥٠ CC")).toBeInTheDocument();
  });
  it("clears previously displayed wallet data if the next request loses authorization",async()=>{
    const fetchMock=vi.fn().mockResolvedValueOnce(response(250)).mockResolvedValueOnce({ok:false,status:401});
    vi.stubGlobal("fetch",fetchMock);
    render(<RewardsMarketplace/>);
    expect(await screen.findByText("٢٥٠ CC")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button",{name:"تحديث"}));
    expect(await screen.findByRole("link",{name:"تسجيل الدخول"})).toBeInTheDocument();
    expect(screen.queryByText("٢٥٠ CC")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading",{name:"ماسك وجه"})).not.toBeInTheDocument();
  });
});
