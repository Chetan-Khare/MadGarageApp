import React, { useState } from 'react';
import { Image, ImageProps, ActivityIndicator, View, StyleSheet } from 'react-native';
import { resolveProductImage, PLACEHOLDER_IMAGE } from '../utils/imageUtils';
import { Product } from '../types';

interface ProductImageProps extends Omit<ImageProps, 'source'> {
  product: Product | any;
  index?: number;
}

export const ProductImage = ({ product, index = 0, style, ...props }: ProductImageProps) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const resolvedUri = resolveProductImage(product, index);
  const source = error ? { uri: PLACEHOLDER_IMAGE } : { uri: resolvedUri };

  return (
    <View style={[style, styles.container]}>
      <Image
        {...props}
        source={source}
        style={[style, styles.image]}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
      {loading && !error && (
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
