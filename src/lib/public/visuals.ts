export function getPhotoVisualStyle(seed: string) {
  const palettes = [
    "linear-gradient(135deg, #4d443a, #8c7960)",
    "linear-gradient(135deg, #24313a, #7b8b8f)",
    "linear-gradient(135deg, #5b4b41, #c2aa84)",
    "linear-gradient(135deg, #2e2a28, #776b61)",
  ];
  const index = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palettes.length;
  return palettes[index];
}
