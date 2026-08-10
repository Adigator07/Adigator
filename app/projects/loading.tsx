export default function ProjectsLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EEF4F7] text-slate-600">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        <p className="mt-4 text-sm font-medium">Opening projects…</p>
      </div>
    </div>
  );
}
