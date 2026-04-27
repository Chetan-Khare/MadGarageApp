import React, { useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { resolveProductImage, PLACEHOLDER_IMAGE } from '../utils/imageUtils';
import { Product } from '../types';

interface ProductImageProps {
  product: Product | any;
  index?: number;
  style?: any;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

export const ProductImage = ({ product, index = 0, style, contentFit, resizeMode, ...props }: ProductImageProps) => {
  const [loading, setLoading] = useState(true);
  const resolvedUri = resolveProductImage(product, index);

  // Backward compatibility: map resizeMode to contentFit
  const finalContentFit = contentFit || (resizeMode === 'stretch' ? 'fill' : (resizeMode === 'center' || resizeMode === 'repeat' ? 'none' : (resizeMode || 'cover')));

  return (
    <View style={[style, styles.container]}>
      <Image
        {...props}
        source={resolvedUri}
        placeholder={PLACEHOLDER_IMAGE}
        contentFit={finalContentFit as any}
        transition={300}
        cachePolicy="memory-disk"
        style={[style, styles.image]}
        onLoadStart={() => setLoading(true)}
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
      />
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loader]}>
          <ActivityIndicator size="small" color="#DF2324" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loader: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});
