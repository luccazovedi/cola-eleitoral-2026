import Link from "next/link";

export const metadata = {
  title: "Privacidade e anúncios | Cola Eleitoral 2026",
  description: "Como a Cola Eleitoral trata escolhas, armazenamento local e publicidade.",
};

export default function PrivacyPage() {
  return (
    <main className="app-shell min-h-dvh px-4 py-8 text-slate-950">
      <article className="mx-auto max-w-[620px] border border-slate-300 bg-white p-5 shadow-sm sm:p-8">
        <Link className="text-sm font-bold text-slate-600 hover:text-slate-950" href="/">
          ← Voltar para a cola
        </Link>
        <h1 className="mt-6 text-3xl font-black tracking-[-0.04em]">Privacidade e anúncios</h1>
        <div className="mt-6 grid gap-6 text-base leading-7 text-slate-700">
          <section>
            <h2 className="font-black text-slate-950">Suas escolhas</h2>
            <p className="mt-1">Candidatos selecionados e progresso ficam somente no armazenamento local do seu navegador. O site não envia essas escolhas para um banco de dados.</p>
          </section>
          <section>
            <h2 className="font-black text-slate-950">Publicidade</h2>
            <p className="mt-1">O site pode usar o Google AdSense para exibir anúncios. O Google e seus parceiros podem usar cookies ou tecnologias semelhantes conforme as preferências de consentimento aplicáveis.</p>
          </section>
          <section>
            <h2 className="font-black text-slate-950">Controle</h2>
            <p className="mt-1">Você pode bloquear ou apagar cookies nas configurações do navegador. Quando exigido para sua região, as opções de consentimento são apresentadas antes da publicidade personalizada.</p>
          </section>
        </div>
      </article>
    </main>
  );
}
