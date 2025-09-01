export function formatDate24(d: Date) {
  try {
    return d.toLocaleString(undefined, { hour12: false });
  } catch {
    return d.toISOString().replace('T', ' ').slice(0, 16);
  }
}
