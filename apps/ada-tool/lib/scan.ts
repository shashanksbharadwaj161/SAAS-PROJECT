// S3: axe-core WCAG scanner
//
// Implementation notes:
// - Use puppeteer-core + @sparticuz/chromium-min (NOT full puppeteer — 50MB Vercel limit)
// - Launch chromium: await chromium.executablePath('path') from @sparticuz/chromium-min
// - Run: axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa'] } })
// - Returns: violations (automated failures) + incomplete (needs manual review)
//
// CRITICAL DISCLOSURE: axe-core detects ~57% of WCAG issues automatically (Deque, 2,000+ audits)
// Every caller must surface the coverageNote in the response — never imply full coverage.

export {}
// TODO S3: implement runScan(url: string): Promise<ScanResult>
