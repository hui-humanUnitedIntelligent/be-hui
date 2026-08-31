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
  page.on('console', msg => {
    if (msg.type() === 'error' || /HUI|crash|boundary/i.test(msg.text())) {
      errors.push('CONSOLE.' + msg.type() + ': ' + msg.text());
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
    const loginBtn = btns.find(b => b.type === 'submit') || btns.find(b => /sign in|anmeld/i.test(b.textContent));
    if (loginBtn) loginBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 15000));
  
  console.log('URL:', page.url());
  
  // Get ALL details elements and expand them
  const allDetails = await page.evaluate(() => {
    const details = document.querySelectorAll('details');
    return Array.from(details).map(d => {
      d.open = true;
      return {
        summary: d.querySelector('summary')?.textContent || '',
        content: d.querySelector('pre')?.textContent || d.textContent,
        html: d.innerHTML.substring(0, 2000)
      };
    });
  });
  
  console.log('\n=== ALL details elements:', allDetails.length, '===');
  allDetails.forEach((d, i) => {
    console.log(`\n--- Details ${i+1} ---`);
    console.log('Summary:', d.summary);
    console.log('Content:', d.content.substring(0, 1500));
    console.log('HTML:', d.html.substring(0, 500));
  });
  
  // Also get the full body innerHTML
  const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 5000));
  console.log('\n=== Body HTML (first 3000 chars) ===');
  console.log(bodyHTML.substring(0, 3000));
  
  console.log('\n=== Console/Error messages ===');
  errors.forEach((e, i) => console.log((i+1) + ': ' + e.substring(0, 1500)));
  if (errors.length === 0) console.log('None.');
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
