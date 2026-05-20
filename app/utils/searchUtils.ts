// Normalizza stringhe per confronto
export function normalize(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

// Tokenizza in parole (per ricerche tipo "latte scremato", "burro arachidi")
export function tokenize(str: string) {
  return normalize(str).split(/\s+/).filter(Boolean);
}

// Levenshtein "classico" ma già ottimizzato
export function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const dp = [];
  for (let i = 0; i <= b.length; i++) dp[i] = [i];
  for (let j = 0; j <= a.length; j++) dp[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      dp[i][j] =
        b[i - 1] === a[j - 1]
          ? dp[i - 1][j - 1]
          : Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + 1);
    }
  }
  return dp[b.length][a.length];
}
