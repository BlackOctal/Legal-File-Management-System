import SubcategoryDetail from './SubcategoryDetail';

interface SubcategoryPageProps {
  params: Promise<{ categoryId: string; subcategoryId: string }>;
}

export default async function SubcategoryPage({ params }: SubcategoryPageProps) {
  const { categoryId, subcategoryId } = await params;
  return <SubcategoryDetail categoryId={categoryId} subcategoryId={subcategoryId} />;
}