const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', err => {
    errors.push('PAGE_ERROR: ' + err.message + '\nSTACK: ' + (err.stack || 'no stack'));
  });
  
  console.log('Navigating to login page...');
  await page.goto('https://be-hui.com/app/login', { waitUntil: 'networkidle2', timeout: 30000 });
  
  // Click "I am already a member"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const target = btns.find(b => /already a member|bereits Mitglied/i.test(b.textContent));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 3000));
  
  // Type credentials
  const emailInput = await page.$('input[type="email"]');
  const passInput = await page.$('input[type="password"]');
  
  if (emailInput && passInput) {
    await emailInput.type('puppe-test@hui.app');
    await passInput.type('PuppetTest2026!');
    
    // Click submit
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const loginBtn = btns.find(b => b.type === 'submit') || btns.find(b => /sign in|anmeld|login|einlog/i.test(b.textContent));
      if (loginBtn) loginBtn.click();
    });
    console.log('Login submitted.');
  }
  
  console.log('Waiting 15s for post-login render...');
  await new Promise(r => setTimeout(r, 15000));
  
  const url = await page.url();
  console.log('\nCurrent URL:', url);
  
  const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 2000) || '');
  console.log('Body text:', bodyText.substring(0, 800));
  
  // Check for stack trace
  const stackTrace = await page.evaluate(() => {
    const details = document.querySelector('details');
    if (details) {
      const pre = details.querySelector('pre');
      return pre ? pre.textContent : 'details exists but no pre';
    }
    const allPre = document.querySelectorAll('pre');
    if (allPre.length > 0) return Array.from(allPre).map(p => p.textContent).join('\n---\n');
    return null;
  });
  if (stackTrace) {
    console.log('\n=== STACK TRACE ===');
    console.log(stackTrace);
  }
  
  console.log('\n=== Page errors ===');
  errors.forEach((e, i) => console.log((i+1) + ': ' + e.substring(0, 1500)));
  if (errors.length === 0) console.log('No page errors captured.');
  
  await browser.close();
  console.log('\nDone.');
})().catch(e => console.error('Puppeteer error:', e.message));
