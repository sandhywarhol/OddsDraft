const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000/live/1', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'screenshot.png', fullPage: true });
  await browser.close();
  console.log('Screenshot saved to screenshot.png');
})();
