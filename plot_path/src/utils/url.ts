export function resolveUrl(url: string | null): string {
  if (!url) return '';
  if (url.startsWith('/uploads')) return `http://localhost:3001${url}`;
  return url;
}
