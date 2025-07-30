// Custom image loader for CDN optimization
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const cdnUrl = process.env.CDN_URL || '';

  // If no CDN URL is configured, return the original src
  if (!cdnUrl) {
    return src;
  }

  // Build optimized image URL with CDN
  const params = new URLSearchParams();
  params.set('w', width.toString());

  if (quality) {
    params.set('q', quality.toString());
  }

  // Auto-format selection for better performance
  params.set('f', 'auto');

  // Return CDN URL with optimization parameters
  return `${cdnUrl}${src}?${params.toString()}`;
}
