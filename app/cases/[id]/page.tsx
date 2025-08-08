import CaseDetail from './CaseDetail';

interface CasePageProps {
  params: Promise<{ id: string }>;
}

export default async function CasePage({ params }: CasePageProps) {
  const { id } = await params;
  return <CaseDetail caseId={id} />;
}