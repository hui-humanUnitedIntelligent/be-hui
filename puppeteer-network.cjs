const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  const failedReqs = [];
  page.on('requestfailed', req => {
    failedReqs.push(req.url() + ' - ' + req.failure()?.errorText);
  });
  page.on('response', resp => {
    if (resp.status() >= 400) {
      failedReqs.push(resp.url() + ' - HTTP ' + resp.status());
    }
  });
  page.on('pageerror', err => {
    console.log('PAGE_ERROR: ' + err.message + '\n' + (err.stack || ''));
  });
  page.on('console', msg => {
    console.log(msg.type() + ': ' + msg.text().substring(0, 300));
  });
  
  await page.goto('https://be-hui.com/app/login', { waitUntil: 'networkidle2', timeout: 30000 });
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const target = btns.find(b => /already a member/i.test(b.textContent));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 3000));
  
  await page.type('input[type="email"]', 'puppe-test@hui.app');
  await page.type('input[type="password"]', 'PuppetTest2026!');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const loginBtn = btns.find(b => b.type === 'submit') || btns.find(b => /sign in/i.test(b.textContent));
    if (loginBtn) loginBtn.click();
  });
  
  console.log('Waiting 20s...');
  await new Promise(r => setTimeout(r, 20000));
  
  console.log('\n=== Failed requests ===');
  if (failedReqs.length === 0) console.log('None.');
  failedReqs.forEach((r, i) => console.log((i+1) + ': ' + r.substring(0, 200)));
  
  // Try to manually load the UnifiedFeed chunk
  console.log('\n=== Trying to load UnifiedFeed chunk directly ===');
  const chunkResult = await page.evaluate(async () => {
    try {
      const resp = await fetch('/assets/UnifiedFeed-Cd9Ju_oG.js');
      const text = await resp.text();
      return `OK: ${resp.status}, ${text.length} bytes, starts with: ${text.substring(0, 50)}`;
    } catch(e) {
      return `FAIL: ${e.message}`;
    }
  });
  console.log('UnifiedFeed chunk: ' + chunkResult);
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
