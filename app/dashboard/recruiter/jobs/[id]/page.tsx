import JobApplicantsClient from './JobApplicantsClient';

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

export default async function JobApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JobApplicantsClient initialJobId={id} />;
}
