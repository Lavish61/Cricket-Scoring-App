export function calcOversFromDeliveries(deliveries) {
  const legal = deliveries.filter(
    (d) => (d.extras?.wd ?? 0) === 0 && (d.extras?.nb ?? 0) === 0
  );
  const balls = legal.length;
  const overs = Math.floor(balls / 6) + (balls % 6) / 10;
  return overs;
}

export function nextBatter(strikerId, playingXI, outIds) {
  for (const pid of playingXI) {
    if (!outIds.has(String(pid)) && String(pid) !== String(strikerId)) {
      return pid;
    }
  }
  return null;
}
