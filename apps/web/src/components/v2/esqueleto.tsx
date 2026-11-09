export function Esqueleto() {
  return (
    <div className="app-clear px-4 pt-6" aria-hidden="true">
      <div className="esqueleto h-10 w-48 rounded-xl" />
      <div className="esqueleto mt-4 h-8 w-full rounded-full" />
      <div className="esqueleto mt-5 h-44 rounded-2xl" />
      <div className="mt-6 flex gap-3">
        <div className="esqueleto h-28 w-40 rounded-2xl" />
        <div className="esqueleto h-28 w-40 rounded-2xl" />
      </div>
    </div>
  );
}
