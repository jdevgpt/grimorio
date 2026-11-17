import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const p = await b.newPage();
for (const s of [192, 512]) {
  await p.setViewportSize({ width: s, height: s });
  await p.goto('file:///home/claude/grimorio/img/emblema.svg');
  await p.evaluate((s) => { const svg = document.querySelector('svg'); svg.setAttribute('width', s); svg.setAttribute('height', s); document.documentElement.style.margin = 0; }, s);
  await p.screenshot({ path: `/home/claude/grimorio/img/icono-${s}.png`, omitBackground: true });
}
await b.close();
