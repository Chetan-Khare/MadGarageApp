import { BASE_SERVER_URL } from '../services/apiClient';
export { BASE_SERVER_URL };
import { Product } from '../types';

export const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400';

/**
 * Low-level utility to resolve a single URL string.
 */
export const resolveSingleImageUrl = (url: string | undefined): string => {
  if (!url || typeof url !== 'string') return PLACEHOLDER_IMAGE;
  if (url.startsWith('http')) return url;
  if (url.startsWith('data:image')) return url;

  const cleanBase = BASE_SERVER_URL?.endsWith('/') ? BASE_SERVER_URL.slice(0, -1) : BASE_SERVER_URL;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  
  return `${cleanBase}${cleanPath}`;
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
