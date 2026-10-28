// Utilidades de video para URBANNOISE (YouTube, YouTube Shorts y videos web)

export function getYouTubeId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();
  // Soporta: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, youtube.com/embed/ID
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = clean.match(regExp);
  return match ? match[1] : null;
}

export function isYouTubeUrl(url: string | null | undefined): boolean {
  return Boolean(getYouTubeId(url));
}

export function getYouTubeEmbedUrl(
  url: string | null | undefined,
  autoplay: boolean = true,
  mute: boolean = true
): string | null {
  const id = getYouTubeId(url);
  if (!id) return null;
  const autoParam = autoplay ? '1' : '0';
  const muteParam = mute ? '1' : '0';
  // loop=1&playlist=id permite que YouTube se repita sin detenerse en pantalla de replay
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=${autoParam}&mute=${muteParam}&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&fs=0&disablekb=1&iv_load_policy=3`;
}

export function getYouTubeThumbnail(url: string | null | undefined): string | null {
  const id = getYouTubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}
