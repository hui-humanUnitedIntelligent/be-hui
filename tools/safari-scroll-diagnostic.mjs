/**
 * WebKit scroll diagnostic — mirrors HUI Home/Feed layout structure.
 * Run: npx playwright install webkit && node tools/safari-scroll-diagnostic.mjs
 */
import { webkit } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, 'safari-scroll-diagnostic.html');

async function run() {
  const browser = await webkit.launch();
  const context = await browser.newContext({
    viewport: { width: 820, height: 1180 }, // iPad-ish
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(`file://${htmlPath}`);

  await page.waitForTimeout(800);

  const result = await page.evaluate(() => {
    const scrollEl = document.querySelector('.hui-scroll');
    const candidates = [
      document.documentElement,
      document.body,
      document.getElementById('root'),
      document.querySelector('.home-shell'),
      scrollEl,
      document.querySelector('.unified-feed'),
      document.getElementById('feed-list'),
    ];

    function probe(el) {
      if (!el) return null;
      const cs = getComputedStyle(el);
      const before = el.scrollTop;
      el.scrollTop = before + 50;
      const canScroll = el.scrollTop !== before;
      el.scrollTop = before;
      return {
        component: el.dataset?.component || el.className || el.tagName,
        canScroll,
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        height: cs.height,
        minHeight: cs.minHeight,
        maxHeight: cs.maxHeight,
        overflow: cs.overflow,
        overflowY: cs.overflowY,
        contain: cs.contain,
        contentVisibility: cs.contentVisibility,
        position: cs.position,
        transform: cs.transform,
        willChange: cs.willChange,
      };
    }

    const cardHeights = [...document.querySelectorAll('[data-index]')].map((el) => ({
      index: Number(el.dataset.index),
      offsetHeight: el.offsetHeight,
      rectHeight: el.getBoundingClientRect().height,
    }));

    return {
      userAgent: navigator.userAgent,
      windowScrollY: window.scrollY,
      scrollElScrollTop: scrollEl?.scrollTop,
      candidates: candidates.map(probe),
      cardHeights: cardHeights.slice(0, 12),
      diag: window.__HUI_SCROLL_DIAG__,
    };
  });

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  return result;
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
