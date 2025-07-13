
import CategoryDetail from './CategoryDetail';

export async function generateStaticParams() {
  return [
    { id: 'financial' },
    { id: 'deeds' },
    { id: 'criminal' },
    { id: 'civil' },
    { id: 'family' },
    { id: 'corporate' },
  ];
}

export default function CategoryPage({ params }: { params: { id: string } }) {
  return <CategoryDetail categoryId={params.id} />;
}
