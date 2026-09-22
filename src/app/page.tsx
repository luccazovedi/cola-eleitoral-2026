import { ShieldCheck, Vote } from "lucide-react";
import { ElectionFlow } from "@/components/election-flow";

export default function Home() {
  return (
    <main className="app-shell min-h-dvh text-slate-950">
      <a className="skip-link" href="#fluxo">
        Ir para a seleção de candidatos
      </a>
      <div className="phone-layout mx-auto w-full max-w-[520px] px-3 pb-8 pt-3 sm:px-5 sm:pt-5">
        <header className="app-header mb-3 flex items-center justify-between rounded-[22px] px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="brand-mark flex size-10 shrink-0 items-center justify-center rounded-xl">
              <Vote aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-[17px] font-black tracking-[-0.03em]">Cola Eleitoral</h1>
              <p className="text-xs font-semibold text-slate-500">Eleições 2026</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <ShieldCheck aria-hidden="true" className="size-4 text-emerald-600" />
            Privado
          </span>
        </header>

        <ElectionFlow />

        <footer className="px-4 py-6 text-center text-xs leading-5 text-slate-500">
          Projeto independente, sem vínculo com a Justiça Eleitoral. Não é comprovante de voto.
        </footer>
      </div>
    </main>
  );
}
