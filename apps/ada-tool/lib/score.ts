// S3: WCAG violation severity scoring
//
// Severity weights (per axe-core impact levels):
//   critical → 10 points per affected node
//   serious  →  5 points per affected node
//   moderate →  3 points per affected node
//   minor    →  1 point  per affected node
//
// Score = sum of (weight × nodeCount) for all violations
// Normalized to 0–100 scale against total checks run
// Lower score = more accessible

export {}
// TODO S3: implement computeScore(violations: AxeResults['violations']): number
