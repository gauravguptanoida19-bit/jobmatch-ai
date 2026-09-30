import JobDetailClient from './JobDetailClient';

export function generateStaticParams() {
  return [
    { id: 'job-1' },
    { id: 'job-2' },
    { id: 'job-3' },
    { id: 'job-4' },
    { id: 'job-5' },
    { id: 'job-6' },
    { id: 'job-7' },
    { id: 'job-8' },
  ];
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JobDetailClient initialJobId={id} />;
}
