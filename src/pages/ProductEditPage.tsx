import React from 'react';
import { useParams } from 'react-router-dom';
import { ProductAddPage } from './ProductAddPage';

export const ProductEditPage: React.FC = () => {
  const { productId } = useParams<{ productId?: string }>();
  const id = productId ? Number(productId) : undefined;
  const resolvedId = typeof id === 'number' && !Number.isNaN(id) ? id : undefined;

  return <ProductAddPage mode="edit" productId={resolvedId} />;
};

export default ProductEditPage;
