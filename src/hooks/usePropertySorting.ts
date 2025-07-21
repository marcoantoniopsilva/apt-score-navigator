
import { useState } from 'react';
import { Property } from '@/types/property';

export const usePropertySorting = () => {
  const [sortBy, setSortBy] = useState<string>('finalScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  return {
    sortBy,
    sortOrder,
    setSortBy,
    setSortOrder
  };
};
