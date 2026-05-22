type Props = { section: string };

export function Placeholder({ section }: Props) {
  return (
    <div className="grid min-h-full place-items-center bg-[var(--muted)] p-4 sm:p-8">
      <div className="max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center sm:p-10">
        <div className="vd-eyebrow mb-3">Em desenvolvimento</div>
        <h2
          className="m-0 text-2xl font-bold text-[var(--vd-blue-500)] dark:text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.015em" }}
        >
          Secção <span className="capitalize">{section}</span>
        </h2>
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">
          Esta área ainda não foi migrada para o portal final. Vamos construí-la a seguir,
          a partir do design da Direção A.
        </p>
      </div>
    </div>
  );
}
