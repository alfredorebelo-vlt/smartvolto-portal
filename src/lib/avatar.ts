// Volto-aligned avatar palette
const AVATAR_COLORS = [
  "linear-gradient(135deg, #ffc429, #f29220)", // warm
  "linear-gradient(135deg, #2e3c8f, #5a6bba)", // blue
  "linear-gradient(135deg, #f29220, #c9761a)", // orange
  "linear-gradient(135deg, #5a6bba, #2e3c8f)", // blue inv
  "linear-gradient(135deg, #1f9d55, #0e7a3c)", // green
  "linear-gradient(135deg, #d7263d, #a31729)", // red
  "linear-gradient(135deg, #ffc429, #d9a41e)", // yellow
  "linear-gradient(135deg, #8390cb, #5a6bba)", // light blue
];

export function getInitials(givenName: string, familyName: string): string {
  const first = givenName?.[0] ?? "";
  const last = familyName?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

export function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
