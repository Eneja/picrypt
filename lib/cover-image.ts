function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function createSeededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

export function generateCoverSvg(dropId: string): string {
  const random = createSeededRandom(hashString(dropId));

  const hue1 = Math.floor(random() * 360);
  const hue2 = (hue1 + 40 + Math.floor(random() * 80)) % 360;
  const saturation = 50 + Math.floor(random() * 30);
  const lightness1 = 45 + Math.floor(random() * 20);
  const lightness2 = 55 + Math.floor(random() * 20);

  const color1 = `hsl(${hue1}, ${saturation}%, ${lightness1}%)`;
  const color2 = `hsl(${hue2}, ${saturation}%, ${lightness2}%)`;

  const circleCount = 5 + Math.floor(random() * 8);
  const circles = Array.from({ length: circleCount }, () => {
    const cx = random() * 800;
    const cy = random() * 600;
    const radius = 20 + random() * 120;
    const opacity = 0.1 + random() * 0.3;
    return `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${radius.toFixed(0)}" fill="white" opacity="${opacity.toFixed(2)}" />`;
  }).join("\n    ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color1}" />
      <stop offset="100%" stop-color="${color2}" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg)" />
  ${circles}
</svg>`;
}
