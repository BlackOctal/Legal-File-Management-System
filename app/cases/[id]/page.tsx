
import CaseDetail from './CaseDetail';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
  ];
}

export default function CasePage({ params }: { params: { id: string } }) {
  return <CaseDetail caseId={params.id} />;
}
