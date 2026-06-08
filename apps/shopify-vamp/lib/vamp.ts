// S7: VAMP ratio calculation and breach projection
//
// Formula:
//   VAMP ratio = (TC40 fraud + TC15 disputes) ÷ TC05 settled CNP transactions
//   (TC40 and TC15 come from Shopify disputes API; order count is the denominator)
//
// Alert tiers (as of April 1 2026 — re-verify before shipping):
//   green  → ratio < 1.0%
//   yellow → ratio 1.0% – 1.49%
//   red    → ratio ≥ 1.5%  (VAMP Excessive threshold, US/CA/EU/APAC)
//   CEMEA  → threshold stays at 2.20%
//
// Enrollment floor:
//   Merchants with < 1,500 TC40+TC15 events/month are NOT enrolled in VAMP.
//   Show "below enrollment threshold" status — don't show red alert.
//
// Fine projection:
//   projected_fine = max(0, (dispute_count - floor(order_count * 0.015))) * 8
//   (fine = $8 per event over the implied allowance at 1.5% threshold)

export {}
// TODO S7: implement computeVampRatio, getAlertTier, projectMonthEndRatio, computeFinExposure
