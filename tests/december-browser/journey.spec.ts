import {test,expect} from '@playwright/test';
import {createServer,type Server} from 'node:http';
const key='browser-fixture-only-key-12345678901234567890';
const ownerToken='A'.repeat(43),friendToken='B'.repeat(43);
const ownerCode='CUT-ABCDEF1234567890',friendCode='CUT-1234567890ABCDEF';
let mock:Server,registered:Record<string,unknown>[]=[];
test.beforeAll(async()=>{
 mock=createServer(async(req,res)=>{
  const send=(status:number,data:unknown)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(data));};
  if(req.headers.authorization!=='Bearer '+key)return send(401,{ok:false});
  const path=req.url||'';
  if(path.endsWith('/rates'))return send(200,{ok:true,rates:{firstVisit:10,student:10,club:5,multiService:5,friends:[20,45,75]}});
  if(path.endsWith('/education'))return send(200,{ok:true,items:[{type:'UNIVERSITY',institution:'Fixture University',faculty:'Fixture Faculty'}]});
  if(path.endsWith('/register')&&req.method==='POST'){
   let raw='';for await(const chunk of req)raw+=chunk;
   const body=JSON.parse(raw);registered.push(body);
   const friend=body.referralCode===ownerCode;
   return send(201,{ok:true,sessionToken:friend?friendToken:ownerToken,referralCode:friend?friendCode:ownerCode,identityStatus:'PENDING',referralStatus:friend?'PENDING':null});
  }
  if(path.endsWith('/session')){
   const token=req.headers['x-december-session'];
   if(token!==ownerToken&&token!==friendToken)return send(401,{ok:false});
   return send(200,{ok:true,referralCode:token===ownerToken?ownerCode:friendCode,campaignStatus:'ACTIVE',redeemed:false,counts:{confirmed:0,pending:token===ownerToken&&registered.length>1?1:0,rejected:0}});
  }
  return send(404,{ok:false});
 });
 await new Promise<void>((resolve,reject)=>{mock.once('error',reject);mock.listen(3108,'localhost',resolve);});
});
test.afterAll(async()=>{if(mock)await new Promise<void>(resolve=>{mock.closeAllConnections();mock.close(()=>resolve());});});
test('mobile owner registration, separate friend browser session and pending referral',async({page,browser})=>{
 await page.goto('/offers/december');
 await expect(page.getByRole('heading',{name:'ورقة الامتحان'})).toBeVisible();
 await page.getByLabel('اسمك').fill('Fixture Owner');
 await page.getByLabel('رقم الموبايل').fill('01000000101');
 await page.getByLabel('أنا طالب').check();
 await page.getByLabel('اسم الجامعة').fill('Fixture University');
 await page.getByLabel('اسم الكلية').fill('Fixture Faculty');
 await page.getByRole('button',{name:'سجّل في الامتحان'}).click();
 await expect(page.getByText('سجلت في الامتحان!')).toBeVisible();
 await expect(page.getByRole('button',{name:'شارك على واتساب'})).toBeVisible();
 const cookies=await page.context().cookies();expect(cookies.find(c=>c.name==='december_exam')?.httpOnly).toBe(true);
 expect(await page.evaluate(()=>document.cookie)).not.toContain(ownerToken);
 expect(registered[0]).toMatchObject({student:true,education:{type:'UNIVERSITY',university:'Fixture University',faculty:'Fixture Faculty'}});
 const other=await browser.newContext({viewport:{width:390,height:844}});
 try{
  const friend=await other.newPage();await friend.goto('http://localhost:3107/offers/december?ref='+ownerCode);
  await expect(friend.getByLabel('كود صاحبك (اختياري)')).toHaveValue(ownerCode);
  await friend.getByLabel('اسمك').fill('Fixture Friend');await friend.getByLabel('رقم الموبايل').fill('01000000102');
  await friend.getByRole('button',{name:'سجّل في الامتحان'}).click();
  await expect(friend.getByText('سجلت في الامتحان!')).toBeVisible();
  expect(registered[1]).toMatchObject({student:false,referralCode:ownerCode});
 }finally{await other.close();}
 await page.getByRole('button',{name:'تحديث حالة الدعوات'}).click();
 await expect(page.getByText('20%',{exact:true}).last()).toBeVisible();
 await expect(page.getByText('نسبة الدعوات المؤكدة مبدئيًا')).toBeVisible();
 await expect(page.getByText('لو كل الدعوات المعلقة تأكدت')).toBeVisible();
});
