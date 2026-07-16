import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ScanWidget from '../_components/ScanWidget'

// ─── Industry data ────────────────────────────────────────────────────────────

interface IndustryData {
  label: string
  metaTitle: string
  metaDescription: string
  // Unique accent per industry — used in hero tint, stats, and CTA
  accent: string
  accentRgb: string  // "r,g,b" for rgba() compositions
  cta: string
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
    accent: '#f97316',
    accentRgb: '249,115,22',
    cta: 'Scan your restaurant website free',
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
    accent: '#06b6d4',
    accentRgb: '6,182,212',
    cta: 'Scan your practice website free',
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
    accent: '#8b5cf6',
    accentRgb: '139,92,246',
    cta: 'Scan your firm website free',
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
    accent: '#ef4444',
    accentRgb: '239,68,68',
    cta: 'Scan your gym website free',
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
    accent: '#10b981',
    accentRgb: '16,185,129',
    cta: 'Scan your listings site free',
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
    <main>

      {/* ── Legal notice bar ────────────────────────────────────────────────── */}
      <div
        className="notice-bar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #78350f, #92400e)',
          color: '#fef3c7',
          fontSize: '13px',
          textAlign: 'center',
          padding: '8px 16px',
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
      >
        <span>
          ⚠ Technical assessment only — not legal advice
          <span className="notice-bar-mid"> · axe-core identifies ~57% of WCAG 2.2 issues</span>
          <span className="notice-bar-end"> · Always consult a qualified attorney</span>
        </span>
      </div>

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: 'sticky',
          top: '32px',
          zIndex: 100,
          background: 'rgba(6, 9, 18, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 clamp(16px, 5vw, 80px)',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '32px',
        }}
      >
        <a href="/" className="nav-brand" style={{ color: 'var(--accent)', fontSize: '18px', fontWeight: 700, textDecoration: 'none' }}>
          ⬡ ADA Evidence
        </a>
        <a
          href="#scan"
          className="btn-accent nav-cta"
          style={{
            background: data.accent,
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '10px 20px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px',
            textDecoration: 'none',
          }}
        >
          Get Evidence Package →
        </a>
      </nav>

      {/* ── Hero (industry-tinted gradient) ─────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: 'clamp(64px, 10vh, 110px) 20px clamp(48px, 8vh, 90px)',
          textAlign: 'center',
          background:
            `radial-gradient(ellipse 120% 60% at 50% 0%, rgba(${data.accentRgb},0.10), transparent 70%), ` +
            'var(--bg-base)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '28px',
            background: `rgba(${data.accentRgb},0.12)`,
            border: `1px solid rgba(${data.accentRgb},0.35)`,
            borderRadius: 'var(--radius-full)',
            padding: '8px 20px',
            fontSize: '13px',
            color: data.accent,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          ADA Demand Letters — {data.label}
        </div>

        <h1
          style={{
            fontSize: 'clamp(30px, 5vw, 52px)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            color: 'var(--text-primary)',
            maxWidth: '820px',
            margin: '0 auto 20px',
          }}
        >
          WCAG Technical Evidence{' '}
          <span style={{ color: data.accent }}>for {data.label}</span>
        </h1>

        <p
          style={{
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            maxWidth: '560px',
            margin: '0 auto 40px',
          }}
        >
          {data.cta}. Get timestamped documentation of your good-faith
          accessibility assessment for your attorney.
        </p>

        <div id="scan" style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'left' }}>
          <ScanWidget gumroadUrls={gumroadUrls} />
        </div>

        <div className="trust-bar" style={{ marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span>✓ Free scan</span>
          <span>✓ No account required</span>
          <span>✓ PDF in minutes</span>
          <span>✓ Not legal advice</span>
        </div>
      </section>

      {/* ── Industry intro ──────────────────────────────────────────────────── */}
      <section
        style={{
          padding: '64px 20px',
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 16px' }}>
            ADA Demand Letters and {data.label}
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.8, margin: '0 0 24px' }}>
            {data.intro}
          </p>

          <div
            style={{
              padding: '16px 20px',
              background: 'var(--critical-dim)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderLeft: '3px solid var(--critical)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              color: '#fca5a5',
              lineHeight: 1.7,
            }}
          >
            <strong style={{ color: 'var(--critical)' }}>Action recommended:</strong> {data.urgencyNote}
          </div>
        </div>
      </section>

      {/* ── Common violations ───────────────────────────────────────────────── */}
      <section style={{ padding: '64px 20px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 12px' }}>
            Common WCAG Issues on {data.label} Websites
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 24px' }}>
            Frequently found by automated scanning, ranked by how often they appear in
            {' '}{data.label.toLowerCase()} demand letters. Your site may differ — scan to find out.
          </p>

          {data.commonViolations.map((v, i) => (
            <div
              key={v.title}
              style={{
                display: 'flex',
                gap: '16px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: '32px',
                  height: '32px',
                  background: `rgba(${data.accentRgb},0.12)`,
                  border: `1px solid rgba(${data.accentRgb},0.35)`,
                  color: data.accent,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px' }}>
                  {v.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.7 }}>
                  {v.description}
                </p>
              </div>
            </div>
          ))}

          <div
            style={{
              marginTop: '20px',
              padding: '12px 16px',
              background: 'rgba(234,179,8,0.08)',
              border: '1px solid rgba(234,179,8,0.2)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: '#fde68a',
              lineHeight: 1.5,
            }}
          >
            <strong>Coverage note:</strong> Automated scanning with axe-core identifies approximately
            57% of WCAG 2.2 issues. Manual review by an accessibility specialist is required for
            a comprehensive assessment.
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: '64px 20px',
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px' }}>
          Get Your Technical Evidence Package
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: '0 0 28px' }}>
          {data.cta}, then choose the package that fits your situation. From $49.
        </p>
        <a
          href="#scan"
          className="btn-accent"
          style={{
            display: 'inline-block',
            background: data.accent,
            color: '#fff',
            borderRadius: 'var(--radius-md)',
            padding: '14px 32px',
            fontWeight: 700,
            fontSize: '16px',
            textDecoration: 'none',
          }}
        >
          Start Free Scan
        </a>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px' }}>
          PDFs emailed within minutes. Not legal advice. Consult a qualified attorney.
        </p>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer
        className="footer-bar"
        style={{
          background: 'var(--bg-base)',
          borderTop: '1px solid var(--border-subtle)',
          padding: '40px 20px',
        }}
      >
        <a href="/" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>
          ⬡ ADA Evidence Tool
        </a>
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Not legal advice. Technical assessment only. © 2026
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
          axe-core ~57% WCAG 2.2 coverage
        </span>
      </footer>

    </main>
  )
}
