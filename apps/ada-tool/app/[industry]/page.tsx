import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ScanWidget from '../_components/ScanWidget'

// ─── Industry data ────────────────────────────────────────────────────────────

interface IndustryData {
  label: string
  metaTitle: string
  metaDescription: string
  intro: string
  commonViolations: { title: string; description: string }[]
  urgencyNote: string
}

const INDUSTRIES: Record<string, IndustryData> = {
  restaurants: {
    label: 'Restaurants',
    metaTitle: 'ADA Demand Letter for Restaurants — WCAG Technical Evidence Package',
    metaDescription:
      'Restaurant owner received an ADA demand letter? Get a WCAG Technical Evidence Package showing good-faith accessibility assessment. Free scan. Not legal advice.',
    intro:
      'Restaurant websites are among the most frequently targeted in ADA demand letter campaigns. ' +
      'Plaintiffs often cite missing alt text on food photos, inaccessible online menus, and ' +
      'non-functional reservation forms for screen reader users. ' +
      'A WCAG Technical Evidence Package documents your accessibility assessment and ' +
      'remediation steps taken — useful to share with your attorney when responding.',
    commonViolations: [
      {
        title: 'Missing alt text on food images',
        description:
          'Screen readers cannot describe photos of dishes, specials, or the dining room without alt text attributes. This is one of the most cited issues in restaurant ADA claims.',
      },
      {
        title: 'Inaccessible online menu',
        description:
          'Menus delivered as PDFs or images (rather than readable HTML text) are often inaccessible to screen reader users. WCAG 2.2 requires information to be available in text form.',
      },
      {
        title: 'Non-functional reservation or contact forms',
        description:
          'Form fields without labels, missing error messages, and timeout-based sessions create barriers for keyboard-only users and screen reader users.',
      },
      {
        title: 'Insufficient color contrast',
        description:
          'Decorative color schemes — white text on light backgrounds or dark text on dark images — often fail WCAG 1.4.3 minimum contrast ratio of 4.5:1 for normal text.',
      },
      {
        title: 'Missing page language declaration',
        description:
          'The HTML <html lang="en"> attribute is required so assistive technologies announce content in the correct language.',
      },
    ],
    urgencyNote:
      'If you received a demand letter, do not ignore it. Respond promptly through your attorney. ' +
      'This tool can help document your accessibility status — ask your attorney how to use it.',
  },

  dentists: {
    label: 'Dental Practices',
    metaTitle: 'ADA Demand Letter for Dental Practices — WCAG Technical Evidence Package',
    metaDescription:
      'Dental practice received an ADA demand letter? Get a WCAG Technical Evidence Package showing good-faith accessibility effort. Free scan. Not legal advice.',
    intro:
      'Dental and medical practice websites frequently receive ADA demand letters because ' +
      'healthcare sites often rely on complex patient portals, PDF forms, and appointment ' +
      'scheduling systems that have not been tested for screen reader compatibility. ' +
      'A Technical Evidence Package documents your WCAG assessment for your attorney.',
    commonViolations: [
      {
        title: 'Inaccessible appointment booking forms',
        description:
          'Online scheduling forms with unlabeled fields, missing ARIA attributes, and focus traps prevent keyboard and screen reader users from booking appointments independently.',
      },
      {
        title: 'PDF patient intake forms',
        description:
          'Non-tagged PDFs used for new patient intake cannot be navigated by screen readers. Tagged PDFs or accessible HTML forms are required.',
      },
      {
        title: 'Missing image alt text',
        description:
          'Staff photos, facility images, and before/after treatment photos without alt text create barriers for visually impaired users.',
      },
      {
        title: 'Low contrast text on insurance or service pages',
        description:
          'Gray text used on white backgrounds — common in healthcare site templates — frequently fails WCAG 1.4.3 contrast requirements.',
      },
      {
        title: 'Inaccessible location or hours information',
        description:
          'Hours and address information embedded only in images or map screenshots, rather than readable HTML text, cannot be accessed by screen readers.',
      },
    ],
    urgencyNote:
      'Dental practices have faced significant demand letter campaigns. Your attorney can advise ' +
      'on how technical evidence of your accessibility efforts factors into your response strategy.',
  },

  'law-firms': {
    label: 'Law Firms',
    metaTitle: 'ADA Demand Letter for Law Firms — WCAG Technical Evidence Package',
    metaDescription:
      'Law firm website received an ADA demand letter? Get a WCAG Technical Evidence Package showing your accessibility assessment. Free scan. Not legal advice.',
    intro:
      'Law firm websites — often built on legacy CMS platforms without accessibility review — ' +
      'are a growing target for ADA demand letters. Common issues include inaccessible attorney ' +
      'profile pages, contact forms, and document download sections. ' +
      'This tool generates a Technical Evidence Package documenting your WCAG analysis, ' +
      'which your attorneys can review as part of your response strategy.',
    commonViolations: [
      {
        title: 'Unlabeled contact and intake forms',
        description:
          'Client intake forms and contact forms with missing <label> elements or ARIA labels create barriers that are frequently cited in demand letters.',
      },
      {
        title: 'Inaccessible document downloads',
        description:
          'PDF briefs, articles, and resources that are not tagged for accessibility cannot be navigated by screen reader users.',
      },
      {
        title: 'Missing focus indicators',
        description:
          'Keyboard users who cannot use a mouse rely on visible focus outlines to navigate pages. CSS that removes the default outline (outline: none) without a replacement violates WCAG 2.4.7.',
      },
      {
        title: 'Non-descriptive link text',
        description:
          '"Click here" and "Read more" links without context are a common WCAG failure. Screen reader users navigating by links cannot determine destination without surrounding context.',
      },
      {
        title: 'Insufficient heading structure',
        description:
          'Pages that use headings only for visual styling (skipping H1→H3, using non-heading elements as headings) impair screen reader navigation.',
      },
    ],
    urgencyNote:
      'Law firms that receive ADA demand letters have the advantage of in-house legal counsel. ' +
      'A documented accessibility assessment showing your assessment effort can support your response.',
  },

  gyms: {
    label: 'Gyms & Fitness Centers',
    metaTitle: 'ADA Demand Letter for Gyms — WCAG Technical Evidence Package',
    metaDescription:
      'Gym or fitness center received an ADA demand letter? Get a WCAG Technical Evidence Package. Free scan. Not legal advice.',
    intro:
      'Gym and fitness center websites are commonly targeted in ADA demand letter campaigns, ' +
      'especially sites with class schedule systems, membership sign-up flows, and video content. ' +
      'A Technical Evidence Package documents your WCAG accessibility assessment — share it ' +
      'with your attorney as part of your demand letter response.',
    commonViolations: [
      {
        title: 'Inaccessible class schedule tables',
        description:
          'Class schedule grids that use layout tables without proper headers and scope attributes cannot be correctly interpreted by screen readers.',
      },
      {
        title: 'Membership sign-up forms without labels',
        description:
          'Multi-step membership enrollment forms with unlabeled fields are among the most frequently cited issues in fitness industry demand letters.',
      },
      {
        title: 'Video content without captions',
        description:
          'Workout videos, promotional clips, and trainer introduction videos without closed captions fail WCAG 1.2.2 (Captions, Prerecorded).',
      },
      {
        title: 'Images of text in class descriptions',
        description:
          'Using images for class names, schedules, or pricing instead of actual text prevents screen readers from accessing that information.',
      },
      {
        title: 'Missing alt text on trainer and facility photos',
        description:
          'Trainer profiles, facility photos, and equipment images without descriptive alt text are inaccessible to visually impaired users.',
      },
    ],
    urgencyNote:
      'Gym owners have been disproportionately targeted in serial ADA demand letter campaigns. ' +
      'Document your accessibility effort and consult an attorney promptly.',
  },

  'real-estate-agents': {
    label: 'Real Estate Agents',
    metaTitle: 'ADA Demand Letter for Real Estate Agents — WCAG Technical Evidence Package',
    metaDescription:
      'Real estate agent or brokerage received an ADA demand letter? Get a WCAG Technical Evidence Package. Free scan. Not legal advice.',
    intro:
      'Real estate agent and brokerage websites — often built on industry-specific IDX platforms — ' +
      'frequently have accessibility gaps in property search forms, listing photo galleries, and ' +
      'map-based interfaces. Demand letters in this industry commonly target contact forms and ' +
      'property listing pages. A Technical Evidence Package documents your WCAG assessment ' +
      'for your attorney.',
    commonViolations: [
      {
        title: 'Property photo galleries without alt text',
        description:
          'Listing photo carousels and galleries that display images without alt text are inaccessible to visually impaired users who rely on screen readers.',
      },
      {
        title: 'Inaccessible property search filters',
        description:
          'Search and filter forms — price range sliders, bedroom selectors, map zoom controls — often lack keyboard access and ARIA labels required for screen reader use.',
      },
      {
        title: 'Map embeds without accessible alternatives',
        description:
          'Embedded Google Maps or property location maps without accessible text alternatives (address, directions in HTML) cannot be used by screen reader users.',
      },
      {
        title: 'Contact and inquiry forms without labels',
        description:
          '"Schedule a showing" and inquiry forms with placeholder-only fields (no <label> elements) fail WCAG 1.3.1 and 3.3.2.',
      },
      {
        title: 'PDFs of property disclosures',
        description:
          'Non-tagged PDF disclosures, contracts, and listing documents cannot be navigated by screen reader software.',
      },
    ],
    urgencyNote:
      'Real estate professionals have faced targeted demand letter campaigns in multiple states. ' +
      'A documented accessibility assessment shows your remediation effort — share with your attorney.',
  },
}

// ─── Static params (build-time generation) ───────────────────────────────────

export async function generateStaticParams() {
  return Object.keys(INDUSTRIES).map((industry) => ({ industry }))
}

// ─── Metadata ────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ industry: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { industry } = await params
  const data = INDUSTRIES[industry]
  if (!data) return { title: 'Industry Not Found' }
  return {
    title:       data.metaTitle,
    description: data.metaDescription,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function IndustryPage({ params }: Props) {
  const { industry } = await params
  const data = INDUSTRIES[industry]

  if (!data) notFound()

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
        <strong>Important:</strong> This tool provides a technical WCAG assessment. It does not
        constitute legal advice. If you received an ADA demand letter, consult a licensed attorney.
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
            ADA demand letter — {data.label}
          </div>
          <h1 style={{ fontSize: 'clamp(24px,4vw,42px)', fontWeight: '800', margin: '0 0 16px', lineHeight: '1.2' }}>
            WCAG Technical Evidence Package<br />for {data.label}
          </h1>
          <p style={{ fontSize: '17px', color: '#bfdbfe', margin: '0 0 32px', lineHeight: '1.6' }}>
            Scan your website free and get documentation of your good-faith
            accessibility assessment for your attorney.
          </p>

          <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
            <ScanWidget gumroadUrls={gumroadUrls} />
          </div>

          <p style={{ fontSize: '12px', color: '#93c5fd', marginTop: '16px' }}>
            Free scan · No account required · Not legal advice
          </p>
        </div>
      </section>

      {/* ── Industry intro ──────────────────────────────────────────────────── */}
      <section style={{ padding: '56px 24px', background: '#fff' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 16px' }}>
            ADA Demand Letters and {data.label}
          </h2>
          <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.8', margin: '0 0 16px' }}>
            {data.intro}
          </p>

          {/* Urgency box */}
          <div style={{
            padding:      '16px 20px',
            background:   '#fef2f2',
            border:       '1px solid #fca5a5',
            borderLeft:   '4px solid #dc2626',
            borderRadius: '6px',
            fontSize:     '14px',
            color:        '#7f1d1d',
            lineHeight:   '1.7',
          }}>
            <strong>Action recommended:</strong> {data.urgencyNote}
          </div>
        </div>
      </section>

      {/* ── Common violations ───────────────────────────────────────────────── */}
      <section style={{ padding: '56px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 24px' }}>
            Common WCAG Issues Found on {data.label} Websites
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px' }}>
            These are accessibility issues frequently found on {data.label.toLowerCase()} websites
            by automated scanning. Your specific site may have different issues — scan to find out.
          </p>
          <div>
            {data.commonViolations.map((v, i) => (
              <div key={i} style={{
                display:      'flex',
                gap:          '16px',
                padding:      '20px 0',
                borderBottom: i < data.commonViolations.length - 1 ? '1px solid #e5e7eb' : 'none',
              }}>
                <div style={{
                  flexShrink:     0,
                  width:          '28px',
                  height:         '28px',
                  background:     '#dc2626',
                  color:          '#fff',
                  borderRadius:   '50%',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       '13px',
                  fontWeight:     '700',
                  marginTop:      '2px',
                }}>
                  {i + 1}
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 6px', color: '#111827' }}>
                    {v.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#374151', margin: 0, lineHeight: '1.7' }}>
                    {v.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop:    '24px',
            padding:      '12px 16px',
            background:   '#fffbeb',
            border:       '1px solid #fde68a',
            borderRadius: '6px',
            fontSize:     '13px',
            color:        '#92400e',
          }}>
            <strong>Coverage note:</strong> Automated scanning with axe-core identifies approximately
            57% of WCAG 2.2 issues. Manual review by an accessibility specialist is required for
            a comprehensive assessment.
          </div>
        </div>
      </section>

      {/* ── Pricing CTA ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '56px 24px', background: '#1e293b', color: '#fff' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 8px' }}>
            Get Your Technical Evidence Package
          </h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', margin: '0 0 32px' }}>
            Scan free, then choose the package that fits your situation.
            PDFs delivered by email. Not legal advice.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              {
                label: 'Basic',
                price: '$49',
                sub:   'one-time',
                items: ['Evidence Package PDF', 'All violations listed', 'Executive summary'],
                href:  gumroadUrls.basic,
                light: true,
              },
              {
                label:    'Premium',
                price:    '$79',
                sub:      'one-time',
                items:    ['Everything in Basic', 'Developer Remediation Guide', 'Code examples'],
                href:     gumroadUrls.premium,
                light:    false,
                featured: true,
              },
              {
                label: 'Monitoring',
                price: '$149',
                sub:   '/month',
                items: ['Everything in Premium', 'Monthly re-scans', 'Monitoring Confirmation'],
                href:  gumroadUrls.monitoring,
                light: true,
              },
            ].map(({ label, price, sub, items, href, light, featured }) => (
              <div key={label} style={{
                flex:         '1 1 200px',
                maxWidth:     '220px',
                padding:      '24px 20px',
                background:   featured ? '#1d4ed8' : '#334155',
                borderRadius: '10px',
                border:       featured ? '2px solid #60a5fa' : '1px solid #475569',
                position:     'relative',
              }}>
                {featured && (
                  <div style={{
                    position:     'absolute',
                    top:          '-10px',
                    left:         '50%',
                    transform:    'translateX(-50%)',
                    background:   '#f59e0b',
                    color:        '#000',
                    fontSize:     '10px',
                    fontWeight:   '700',
                    padding:      '2px 10px',
                    borderRadius: '20px',
                    whiteSpace:   'nowrap',
                  }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '4px', color: light ? '#94a3b8' : '#bfdbfe' }}>
                  {label}
                </div>
                <div style={{ fontSize: '26px', fontWeight: '800', marginBottom: '16px' }}>
                  {price} <span style={{ fontSize: '13px', fontWeight: '400', color: '#94a3b8' }}>{sub}</span>
                </div>
                <ul style={{ fontSize: '13px', color: light ? '#94a3b8' : '#93c5fd', paddingLeft: '16px', margin: '0 0 16px', lineHeight: '1.8' }}>
                  {items.map(item => <li key={item}>{item}</li>)}
                </ul>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display:        'block',
                    textAlign:      'center',
                    padding:        '9px',
                    background:     featured ? '#fff' : '#3b82f6',
                    color:          featured ? '#1d4ed8' : '#fff',
                    textDecoration: 'none',
                    borderRadius:   '6px',
                    fontSize:       '13px',
                    fontWeight:     '700',
                  }}
                >
                  Get {label}
                </a>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '11px', color: '#475569', marginTop: '20px' }}>
            Payments via Gumroad. PDFs emailed within minutes. This is a technical assessment package.
            Not legal advice. Consult a qualified attorney.
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{
        padding:    '32px 24px',
        background: '#0f172a',
        color:      '#94a3b8',
        textAlign:  'center',
        fontSize:   '13px',
        lineHeight: '1.8',
      }}>
        <p style={{ margin: '0 0 8px' }}>
          <a href="/" style={{ color: '#60a5fa', textDecoration: 'none' }}>
            ← Back to main site
          </a>
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
