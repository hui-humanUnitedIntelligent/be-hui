const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  const errors = [];
  const consoleMsgs = [];
  
  page.on('pageerror', err => {
    errors.push('PAGE_ERROR: ' + err.message + '\nSTACK: ' + (err.stack || 'no stack'));
  });
  page.on('console', msg => {
    consoleMsgs.push(msg.type() + ': ' + msg.text());
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
  await page.type('input[type="email"]', 'puppe-test@hui.app');
  await page.type('input[type="password"]', 'PuppetTest2026!');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const loginBtn = btns.find(b => b.type === 'submit') || btns.find(b => /sign in|anmeld|login|einlog/i.test(b.textContent));
    if (loginBtn) loginBtn.click();
  });
  console.log('Login submitted.');
  
  console.log('Waiting 15s for post-login render...');
  await new Promise(r => setTimeout(r, 15000));
  
  const url = await page.url();
  console.log('Current URL:', url);
  
  // Get full HTML to find the stack trace
  const fullHTML = await page.content();
  
  // Look for "Stack" or "details" or "pre" in the HTML
  const stackMatch = fullHTML.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
  if (stackMatch) {
    console.log('\n=== STACK TRACE from <pre> ===');
    console.log(stackMatch[1].substring(0, 2000));
  }
  
  // Also look for details element
  const detailsMatch = fullHTML.match(/<details[\s\S]*?<\/details>/);
  if (detailsMatch) {
    console.log('\n=== Details element ===');
    console.log(detailsMatch[0].substring(0, 2000));
  }
  
  // Expand details if present and get content
  const expandedContent = await page.evaluate(() => {
    const details = document.querySelector('details');
    if (details) {
      details.open = true;
      const pre = details.querySelector('pre');
      return pre ? pre.textContent : details.textContent;
    }
    return null;
  });
  if (expandedContent) {
    console.log('\n=== Expanded details content ===');
    console.log(expandedContent.substring(0, 2000));
  }
  
  // Check for window.__HUI_ERRORS__
  const huiErrors = await page.evaluate(() => {
    return window.__HUI_ERRORS__ ? JSON.stringify(window.__HUI_ERRORS__) : null;
  });
  if (huiErrors) {
    console.log('\n=== window.__HUI_ERRORS__ ===');
    console.log(huiErrors.substring(0, 2000));
  }
  
  console.log('\n=== Console messages (errors only) ===');
  consoleMsgs.filter(m => m.startsWith('error')).forEach((m, i) => {
    console.log((i+1) + ': ' + m.substring(0, 1500));
  });
  
  console.log('\n=== Page errors ===');
  errors.forEach((e, i) => console.log((i+1) + ': ' + e.substring(0, 1500)));
  if (errors.length === 0) console.log('No uncaught page errors.');
  
  // Also check ALL console messages for "t is not defined" or "HUI"
  console.log('\n=== All console messages mentioning "t is" or "HUI" or "Error" ===');
  consoleMsgs.filter(m => /t is|HUI|Error|error|crash/i.test(m)).forEach((m, i) => {
    console.log((i+1) + ': ' + m.substring(0, 1500));
  });
  
  await browser.close();
  console.log('\nDone.');
})().catch(e => console.error('Puppeteer error:', e.message));
