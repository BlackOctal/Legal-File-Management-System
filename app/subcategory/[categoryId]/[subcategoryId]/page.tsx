
import SubcategoryDetail from './SubcategoryDetail';

export async function generateStaticParams() {
  return [
    { categoryId: 'financial', subcategoryId: 'loan-settlement' },
    { categoryId: 'financial', subcategoryId: 'debt-recovery' },
    { categoryId: 'financial', subcategoryId: 'bankruptcy' },
    { categoryId: 'deeds', subcategoryId: 'property-transfer' },
    { categoryId: 'deeds', subcategoryId: 'title-dispute' },
    { categoryId: 'deeds', subcategoryId: 'registration' },
    { categoryId: 'criminal', subcategoryId: 'defense' },
    { categoryId: 'criminal', subcategoryId: 'prosecution' },
    { categoryId: 'criminal', subcategoryId: 'appeals' },
  ];
}

export default function SubcategoryPage({ params }: { params: { categoryId: string; subcategoryId: string } }) {
  return <SubcategoryDetail categoryId={params.categoryId} subcategoryId={params.subcategoryId} />;
}
