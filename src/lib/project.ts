export const officialSources = [
  {
    label: "Portal de Dados Abertos do TSE",
    href: "https://dadosabertos.tse.jus.br/",
  },
  {
    label: "Candidatos - 2026",
    href: "https://dadosabertos.tse.jus.br/dataset/candidatos-2026",
  },
  {
    label: "Divulgacao de Candidaturas e Contas Eleitorais",
    href: "https://divulgacandcontas.tse.jus.br/divulga/#/",
  },
] as const;

export const electionFlow = [
  {
    id: "deputado-federal",
    label: "Deputado federal",
    helper: "Escolha uma candidatura para representar seu estado na Camara dos Deputados.",
  },
  {
    id: "deputado-estadual-distrital",
    label: "Deputado estadual ou distrital",
    helper: "No DF, esta etapa usa deputado distrital; nas demais UFs, deputado estadual.",
  },
  {
    id: "senador-1",
    label: "Senador - 1a escolha",
    helper: "Primeira vaga ao Senado. A proxima etapa usa uma segunda escolha separada.",
  },
  {
    id: "senador-2",
    label: "Senador - 2a escolha",
    helper: "Segunda vaga ao Senado. A mesma candidatura nao podera ser usada duas vezes.",
  },
  {
    id: "governador",
    label: "Governador",
    helper: "Escolha uma candidatura ao governo da UF selecionada.",
  },
  {
    id: "presidente",
    label: "Presidente",
    helper: "Etapa nacional para a Presidencia da Republica.",
  },
] as const;

export type ElectionStepId = (typeof electionFlow)[number]["id"];

export const privacyPrinciples = [
  "Sem login obrigatorio",
  "Escolhas salvas apenas no dispositivo",
  "Sem envio de candidato ou partido para analytics",
] as const;
