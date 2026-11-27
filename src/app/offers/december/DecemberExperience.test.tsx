import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import DecemberRegistrationForm from './DecemberRegistrationForm';
import DecemberMyExam from './DecemberMyExam';
import DecemberHomePromo from '@/components/home/DecemberHomePromo';
const rates={firstVisit:10,student:10,club:5,multiService:5,friends:[20,45,75] as [number,number,number]};
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
describe('December customer journey',()=>{
 it('caps the home promotion and points to the campaign',()=>{
  render(<DecemberHomePromo rates={rates}/>);
  expect(screen.getByText('100%')).toBeInTheDocument();
  expect(screen.getByRole('link',{name:'شوف ورقة الامتحان'})).toHaveAttribute('href','/offers/december');
 });
 it('keeps disabled registration closed',()=>{
  const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
  render(<DecemberRegistrationForm enabled={false}/>);
  expect(screen.getByRole('button',{name:'سجّل في الامتحان'})).toBeDisabled();
  expect(fetcher).not.toHaveBeenCalled();
 });
 it('submits education and inherited invitation without OTP',async()=>{
  const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({ok:true,referralCode:'CUT-ABCDEF1234567890'})});vi.stubGlobal('fetch',fetcher);
  render(<DecemberRegistrationForm enabled initialReferral="CUT-1234567890ABCDEF" suggestions={[{type:'UNIVERSITY',institution:'Test University',faculty:'Test Faculty'}]}/>);
  fireEvent.change(screen.getByLabelText('اسمك'),{target:{value:'Test student'}});
  fireEvent.change(screen.getByLabelText('رقم الموبايل'),{target:{value:'01000000000'}});
  fireEvent.click(screen.getByLabelText('أنا طالب'));
  fireEvent.change(screen.getByLabelText('اسم الجامعة'),{target:{value:'Test University'}});
  fireEvent.change(screen.getByLabelText('اسم الكلية'),{target:{value:'Test Faculty'}});
  fireEvent.click(screen.getByRole('button',{name:'سجّل في الامتحان'}));
  await waitFor(()=>expect(screen.getByText('سجلت في الامتحان!')).toBeInTheDocument());
  expect(fetcher).toHaveBeenCalledTimes(1);
  const [url,options]=fetcher.mock.calls[0];expect(url).toBe('/api/offers/december/register');
  expect(JSON.parse(options.body)).toMatchObject({name:'Test student',phone:'01000000000',student:true,referralCode:'CUT-1234567890ABCDEF',marketingConsent:false,education:{type:'UNIVERSITY',university:'Test University',faculty:'Test Faculty'}});
 });
 it('keeps confirmed and potential referral tiers separate',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({ok:true,referralCode:'CUT-ABCDEF1234567890',campaignStatus:'ACTIVE',counts:{confirmed:2,pending:1,rejected:0}})}));
  render(<DecemberMyExam rates={rates}/>);
  expect(await screen.findByText('45%')).toBeInTheDocument();
  expect(screen.getByText('75%')).toBeInTheDocument();
  expect(screen.getByText(/ليست ضمانًا/)).toBeInTheDocument();
 });
 it('shows consumption and stops sharing after redemption',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({ok:true,referralCode:'CUT-ABCDEF1234567890',campaignStatus:'ACTIVE',redeemed:true,counts:{confirmed:2,pending:1,rejected:0}})}));
  render(<DecemberMyExam rates={rates}/>);
  expect(await screen.findByText(/تم استخدام عرض ديسمبر/)).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'شارك على واتساب'})).not.toBeInTheDocument();
  expect(screen.queryByText('75%')).not.toBeInTheDocument();
 });

});
