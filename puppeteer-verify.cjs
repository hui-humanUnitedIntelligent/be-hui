const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', err => {
    errors.push('PAGE_ERROR: ' + err.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error' || /HUI|Suspense|lazy/i.test(msg.text())) {
      errors.push(msg.type() + ': ' + msg.text().substring(0, 200));
    }
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
  
  console.log('Waiting 25s for post-login render...');
  await new Promise(r => setTimeout(r, 25000));
  
  const url = page.url();
  console.log('URL:', url);
  
  const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 1500) || '');
  console.log('Body text:', bodyText.substring(0, 800));
  
  // Check if the app loaded successfully (no error page)
  const hasError = /konnte nicht geladen|Laden dauert|t is not defined/i.test(bodyText);
  const hasContent = /Entdecken|Feed|Werke|Talente|Erlebnisse|Momente|HUI|Profil/i.test(bodyText);
  
  if (hasError) {
    console.log('\n❌ App still showing error page');
  } else if (hasContent) {
    console.log('\n✅ App loaded successfully!');
  } else {
    console.log('\n⚠️ Unknown state');
  }
  
  console.log('\n=== Console messages ===');
  errors.forEach((e, i) => console.log((i+1) + ': ' + e.substring(0, 300)));
  if (errors.length === 0) console.log('None.');
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
