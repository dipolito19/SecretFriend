import GroupPage from "./GroupPage";

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <GroupPage code={code.toUpperCase()} />;
}
