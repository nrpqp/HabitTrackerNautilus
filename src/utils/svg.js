import { innerRadius, cellThickness, gapBetweenRings, svgPadding, DEG } from '../constants.js';

export function computeSvgMetrics(ringCount) {
  const n = Math.max(1, ringCount);
  const outerR = innerRadius + n * cellThickness + (n - 1) * gapBetweenRings;
  const total = (outerR + svgPadding) * 2;
  return { outerRadius: outerR, size: total, cx: total / 2, cy: total / 2 };
}

export function polarToCartesian(cx, cy, r, angleDeg) {
  const a = angleDeg * DEG;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

export function annularSectorPath(cx, cy, rInner, rOuter, a0, a1) {
  const largeArc = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  const p0o = polarToCartesian(cx, cy, rOuter, a0);
  const p1o = polarToCartesian(cx, cy, rOuter, a1);
  const p1i = polarToCartesian(cx, cy, rInner, a1);
  const p0i = polarToCartesian(cx, cy, rInner, a0);
  return [
    `M ${p0o.x} ${p0o.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} ${sweep} ${p1o.x} ${p1o.y}`,
    `L ${p1i.x} ${p1i.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} ${sweep ^ 1} ${p0i.x} ${p0i.y}`,
    'Z',
  ].join(' ');
}
