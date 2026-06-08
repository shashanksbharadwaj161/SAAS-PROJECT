// S9: Dashboard — VAMP ratio gauge, alert tier, month projection, fine estimate
// Entry point after Shopify OAuth install; merchant sees their current ratio immediately

export default function HomePage() {
  return (
    <main>
      <h1>VAMP Monitor</h1>
      <p>Track your Visa dispute ratio and stay below the 1.5% threshold.</p>
      {/* TODO S9: Ratio gauge (green/yellow/red), monthly trend chart, breach projector */}
      {/* TODO S6: Redirect to OAuth install if shop not authenticated */}
    </main>
  )
}
