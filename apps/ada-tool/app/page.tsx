import type { Metadata } from 'next'
import ScanWidget from './_components/ScanWidget'

export const metadata: Metadata = {
  title: 'ADA Demand Letter Response — WCAG Technical Evidence Package',
  description:
    'Received an ADA demand letter? Get a WCAG Technical Evidence Package showing your good-faith accessibility remediation effort. Free scan, paid PDFs. Not legal advice.',
}

const DISCLAIMER =
  "This tool provides a technical assessment of your website's accessibility " +
  'using axe-core automated scanning, which identifies approximately 57% of WCAG 2.2 issues. ' +
  'It does not constitute legal advice and is not a substitute for a qualified attorney. ' +
  'If you received an ADA demand letter, consult a licensed attorney immediately.'

const FAQ = [
  {
    q: 'Does this make my website "ADA compliant"?',
    a: "No. No automated tool can certify ADA compliance. This tool generates a Technical Evidence Package demonstrating your good-faith effort to assess and remediate accessibility issues. Whether that effort is sufficient in a specific legal context is a question for your attorney.",
  },
  {
    q: 'What does the scan actually check?',
    a: "We use axe-core, an industry-standard open-source library by Deque Systems. Per Deque's own research across 2,000+ audits and 300,000 issues, automated scanning detects approximately 57% of WCAG 2.2 AA issues. The remaining issues require manual testing by an accessibility specialist.",
  },
  {
    q: 'Will this help with my demand letter?',
    a: 'The evidence package documents your WCAG analysis and shows remediation steps taken — this can demonstrate good faith to opposing counsel. How useful it is depends entirely on your specific situation. Ask your attorney how to use it in your response.',
  },
  {
    q: 'Will an accessibility widget protect me?',
    a: 'No. The FTC fined AccessiBe — one of the most popular accessibility overlay tools — $1 million in 2025 for false compliance claims. 1 in 4 ADA lawsuits in 2025 hit sites already running these widgets. Overlays do not constitute good-faith remediation effort.',
  },
  {
    q: 'What WCAG version do you test against?',
    a: 'WCAG 2.2, which became the official standard in October 2023 and is the current benchmark courts and plaintiffs reference. Most sites are not yet fully compliant.',
  },
  {
    q: 'What is included in each package?',
    a: 'Basic ($49): WCAG Technical Evidence Package PDF — executive summary, all violations found, legal disclaimer. Premium ($79): Adds a Developer Remediation Guide with before/after code examples for your developers. Monitoring ($149/mo): Adds all of the above plus a Monitoring Activation Confirmation document and monthly re-scans.',
  },
  {
    q: 'How are the PDFs delivered?',
    a: 'After purchase via Gumroad, your PDF download links are emailed within minutes. Links are valid for 7 days. The PDFs include mandatory legal disclaimers and WCAG coverage disclosures on every document.',
  },
  {
    q: 'Is my scan data private?',
    a: 'Your URL and scan results are stored in a private database (not public). They are used only to generate your evidence package. We do not share or sell your data.',
  },
]

export default function HomePage() {
  const gumroadUrls = {
    basic:      process.env.GUMROAD_PRODUCT_BASIC      ?? '#',
    premium:    process.env.GUMROAD_PRODUCT_PREMIUM    ?? '#',
    monitoring: process.env.GUMROAD_PRODUCT_MONITORING ?? '#',
  }

  return (
    <main style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#111827' }}>

      {/* ── Legal notice bar ────────────────────────────────────────────────── */}
      <div style={{
        background:   '#fef3c7',
        borderBottom: '1px solid #fde68a',
        padding:      '10px 24px',
        textAlign:    'center',
        fontSize:     '13px',
        color:        '#92400e',
      }}>
        <strong>Important:</strong> {DISCLAIMER}
      </div>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)',
        color:      '#fff',
        padding:    '64px 24px',
        textAlign:  'center',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{
            display:       'inline-block',
            background:    '#f59e0b',
            color:         '#000',
            fontSize:      '12px',
            fontWeight:    '700',
            padding:       '4px 14px',
            borderRadius:  '20px',
            marginBottom:  '16px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            Received an ADA demand letter?
          </div>
          <h1 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: '800', margin: '0 0 16px', lineHeight: '1.15' }}>
            You Don&apos;t Have to Be Faster<br />Than the Bear
          </h1>
          <p style={{ fontSize: '18px', color: '#bfdbfe', margin: '0 0 32px', lineHeight: '1.6' }}>
            Just faster than the other businesses he&apos;s chasing. Dated proof of
            good-faith effort kills 80% of ADA demand letters.
          </p>

          <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
            <ScanWidget gumroadUrls={gumroadUrls} />
          </div>

          <p style={{ fontSize: '12px', color: '#93c5fd', marginTop: '16px' }}>
            Free scan · No account required · Not legal advice
          </p>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section style={{ padding: '64px 24px', background: '#fff' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', textAlign: 'center', margin: '0 0 40px' }}>
            How It Works
          </h2>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { step: '1', title: 'Enter Your URL', body: 'Paste your website address. We run a free WCAG 2.2 scan using axe-core and show you your score and top issues.' },
              { step: '2', title: 'Review Your Results', body: 'See your accessibility score, the violations found, and how many items passed. The free report shows the top 3 issues.' },
              { step: '3', title: 'Purchase Your Package', body: 'Choose the tier that fits your situation. Pay securely via Gumroad. Your PDF evidence package is emailed within minutes.' },
            ].map(({ step, title, body }) => (
              <div key={step} style={{
                flex:      '1 1 200px',
                maxWidth:  '240px',
                textAlign: 'center',
                padding:   '24px 16px',
              }}>
                <div style={{
                  width:          '48px',
                  height:         '48px',
                  background:     '#1d4ed8',
                  color:          '#fff',
                  borderRadius:   '50%',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       '20px',
                  fontWeight:     '800',
                  margin:         '0 auto 16px',
                }}>
                  {step}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 8px' }}>{title}</h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, lineHeight: '1.6' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '64px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', textAlign: 'center', margin: '0 0 8px' }}>
            Choose Your Evidence Package
          </h2>
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '15px', margin: '0 0 40px' }}>
            All packages include mandatory legal disclaimers and WCAG coverage disclosures.
          </p>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>

            {/* Basic */}
            <div style={{
              flex:         '1 1 240px',
              maxWidth:     '280px',
              padding:      '32px 24px',
              background:   '#fff',
              border:       '1px solid #e5e7eb',
              borderRadius: '12px',
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px' }}>Basic</h3>
              <div style={{ fontSize: '36px', fontWeight: '800', color: '#1d4ed8', margin: '0 0 20px' }}>
                $49{' '}
                <span style={{ fontSize: '14px', fontWeight: '400', color: '#6b7280' }}>one-time</span>
              </div>
              <ul style={{ fontSize: '14px', color: '#374151', paddingLeft: '18px', margin: '0 0 24px', lineHeight: '1.8' }}>
                <li>WCAG Technical Evidence Package</li>
                <li>All violations documented</li>
                <li>Executive summary</li>
                <li>Legal disclaimer included</li>
              </ul>
              <a
                href={gumroadUrls.basic}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:        'block',
                  textAlign:      'center',
                  padding:        '12px',
                  background:     '#1d4ed8',
                  color:          '#fff',
                  textDecoration: 'none',
                  borderRadius:   '8px',
                  fontSize:       '15px',
                  fontWeight:     '700',
                }}
              >
                Get Basic — $49
              </a>
            </div>

            {/* Premium */}
            <div style={{
              flex:         '1 1 240px',
              maxWidth:     '280px',
              padding:      '32px 24px',
              background:   '#1d4ed8',
              border:       '2px solid #3b82f6',
              borderRadius: '12px',
              color:        '#fff',
              position:     'relative',
            }}>
              <div style={{
                position:    'absolute',
                top:         '-13px',
                left:        '50%',
                transform:   'translateX(-50%)',
                background:  '#f59e0b',
                color:       '#000',
                fontSize:    '11px',
                fontWeight:  '700',
                padding:     '3px 12px',
                borderRadius: '20px',
                whiteSpace:  'nowrap',
              }}>
                MOST POPULAR
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px' }}>Premium</h3>
              <div style={{ fontSize: '36px', fontWeight: '800', color: '#bfdbfe', margin: '0 0 20px' }}>
                $79{' '}
                <span style={{ fontSize: '14px', fontWeight: '400', color: '#93c5fd' }}>one-time</span>
              </div>
              <ul style={{ fontSize: '14px', color: '#bfdbfe', paddingLeft: '18px', margin: '0 0 24px', lineHeight: '1.8' }}>
                <li>Everything in Basic</li>
                <li>Developer Remediation Guide</li>
                <li>Before/after code examples</li>
                <li>Fix difficulty ratings</li>
              </ul>
              <a
                href={gumroadUrls.premium}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:        'block',
                  textAlign:      'center',
                  padding:        '12px',
                  background:     '#fff',
                  color:          '#1d4ed8',
                  textDecoration: 'none',
                  borderRadius:   '8px',
                  fontSize:       '15px',
                  fontWeight:     '700',
                }}
              >
                Get Premium — $79
              </a>
            </div>

            {/* Monitoring */}
            <div style={{
              flex:         '1 1 240px',
              maxWidth:     '280px',
              padding:      '32px 24px',
              background:   '#fff',
              border:       '1px solid #e5e7eb',
              borderRadius: '12px',
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px' }}>Monitoring</h3>
              <div style={{ fontSize: '36px', fontWeight: '800', color: '#1d4ed8', margin: '0 0 20px' }}>
                $149{' '}
                <span style={{ fontSize: '14px', fontWeight: '400', color: '#6b7280' }}>/month</span>
              </div>
              <ul style={{ fontSize: '14px', color: '#374151', paddingLeft: '18px', margin: '0 0 24px', lineHeight: '1.8' }}>
                <li>Everything in Premium</li>
                <li>Monthly re-scans</li>
                <li>Monitoring Confirmation doc</li>
                <li>Ongoing evidence trail</li>
              </ul>
              <a
                href={gumroadUrls.monitoring}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:        'block',
                  textAlign:      'center',
                  padding:        '12px',
                  background:     '#1d4ed8',
                  color:          '#fff',
                  textDecoration: 'none',
                  borderRadius:   '8px',
                  fontSize:       '15px',
                  fontWeight:     '700',
                }}
              >
                Get Monitoring — $149/mo
              </a>
            </div>

          </div>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '24px' }}>
            Payments processed securely by Gumroad. PDFs delivered by email within minutes.
            This is a technical assessment package, not legal advice. Consult a qualified attorney.
          </p>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '64px 24px', background: '#fff' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', textAlign: 'center', margin: '0 0 40px' }}>
            Frequently Asked Questions
          </h2>
          <div>
            {FAQ.map(({ q, a }) => (
              <div key={q} style={{
                padding:      '20px 0',
                borderBottom: '1px solid #e5e7eb',
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 8px', color: '#111827' }}>
                  {q}
                </h3>
                <p style={{ fontSize: '14px', color: '#374151', margin: 0, lineHeight: '1.7' }}>
                  {a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{
        padding:    '32px 24px',
        background: '#1e293b',
        color:      '#94a3b8',
        textAlign:  'center',
        fontSize:   '13px',
        lineHeight: '1.8',
      }}>
        <p style={{ margin: '0 0 8px', color: '#cbd5e1', fontWeight: '600' }}>
          WCAG Technical Evidence Package Tool
        </p>
        <p style={{ margin: '0 0 8px' }}>
          Not legal advice. Not a compliance certification. Consult a qualified attorney.
        </p>
        <p style={{ margin: 0, fontSize: '12px' }}>
          Automated scanning detects ~57% of WCAG 2.2 issues (axe-core, Deque Systems research).
          Manual review required for full assessment.
        </p>
      </footer>

    </main>
  )
}
