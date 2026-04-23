import { BASE_SERVER_URL } from '../services/apiClient';
export { BASE_SERVER_URL };
import { Product } from '../types';

export const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400';

/**
 * Low-level utility to resolve a single URL string.
 */
export const resolveSingleImageUrl = (url: string | undefined): string => {
  if (!url || typeof url !== 'string') return PLACEHOLDER_IMAGE;
  
  // Handled early for data URIs
  if (url.startsWith('data:image')) return url;

  let finalUrl = url;

  // If it's a relative path, we need to build the full server URL
  if (!url.startsWith('http')) {
    // 1. Normalize slashes (converts Windows backslashes to standard forward slashes)
    const normalizedUrl = url.replace(/\\/g, '/');

    const cleanBase = BASE_SERVER_URL?.endsWith('/') ? BASE_SERVER_URL.slice(0, -1) : BASE_SERVER_URL;
    const cleanPath = normalizedUrl.startsWith('/') ? normalizedUrl : `/${normalizedUrl}`;
    
    finalUrl = `${cleanBase}${cleanPath}`;
  }
  
  // ── Mobile Rendering Fix ──────────────────────────────────────────────────
  // Critical for React Native <Image />: We MUST encode the URI even if it's already an absolute http link.
  // This ensures that spaces (e.g. in "magnetic 5w-40") are converted to %20 correctly.
  return encodeURI(finalUrl);
};

/**
 * Resolves a product's image URL with robust fallback and relative path handling.
 */
export const resolveProductImage = (product: Product | any, index: number = 0): string => {
  if (!product) return PLACEHOLDER_IMAGE;

  let rawUrl = product.imageUrl;

  if (product.imageUrls && Array.isArray(product.imageUrls) && product.imageUrls.length > index) {
    rawUrl = product.imageUrls[index];
  } else if (!rawUrl && product.imageUrls && Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
    rawUrl = product.imageUrls[0];
  }

  return resolveSingleImageUrl(rawUrl);
};
