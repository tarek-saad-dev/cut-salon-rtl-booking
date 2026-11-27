import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/december-browser',workers:1,timeout:60000,retries:0,
 use:{baseURL:'http://localhost:3107',browserName:'chromium',viewport:{width:390,height:844}},
 webServer:{command:'npm run dev -- --hostname localhost --port 3107',url:'http://localhost:3107',timeout:120000,reuseExistingServer:false,
 env:{DECEMBER_EXAM_PREVIEW:'true',DECEMBER_EXAM_INTERNAL_REGISTRATION_ENABLED:'true',DECEMBER_EXAM_CASHER_ORIGIN:'http://localhost:3108',DECEMBER_EXAM_PUBLIC_ORIGIN:'http://localhost:3107',DECEMBER_EXAM_BFF_SHARED_KEY:'browser-fixture-only-key-12345678901234567890'}}
});
