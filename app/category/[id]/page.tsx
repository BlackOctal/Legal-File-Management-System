import CategoryDetail from './CategoryDetail';

interface CategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id } = await params;
  return <CategoryDetail categoryId={id} />;
}