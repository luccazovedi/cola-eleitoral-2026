# Cola Eleitoral 2026

MVP neutro, mobile-first e privado para ajudar eleitores a montar uma cola eleitoral digital com base em dados oficiais de candidaturas do Tribunal Superior Eleitoral (TSE). A aplicação não realiza voto, não recomenda candidatos e não possui vínculo oficial com a Justiça Eleitoral.

## Objetivo

O Cola Eleitoral 2026 deve permitir que a pessoa eleitora selecione sua UF, pesquise candidatos por cargo, revise suas escolhas e gere uma cola final em formato de comprovante simples para consulta pessoal no dia da votação.

## Princípios do produto

- Neutralidade política: nenhum candidato, partido, federação ou coligação deve ser recomendado, ranqueado, promovido ou desfavorecido.
- Privacidade por padrão: escolhas eleitorais ficam no dispositivo da pessoa usuária sempre que possível.
- Fontes oficiais: dados de candidatura devem vir de fontes oficiais do TSE, com data de última atualização visível.
- Transparência: a interface deve deixar claro que o site é independente e sem validade oficial.
- Acessibilidade: fluxo navegável por teclado, contraste adequado, HTML semântico e estados que não dependam apenas de cor.
- Mobile-first: a experiência principal deve ser confortável em celulares.

## Escopo do MVP

- Seleção obrigatória de UF.
- Busca por nome, nome de urna, número e partido.
- Seleção dos cargos na ordem planejada para o fluxo: deputado federal, deputado estadual ou distrital, senador 1, senador 2, governador e presidente.
- Regras específicas para duas escolhas ao Senado, impedindo duplicidade do mesmo candidato.
- Revisão completa antes da finalização, com edição por cargo.
- Comprovante final estilo nota fiscal, sem validade oficial.
- Impressão e alternativa de exportação quando suportada pelo navegador.
- Persistência local no navegador.
- Sem login obrigatório.
- Sem registro de escolhas políticas em backend ou analytics.

## Fontes oficiais do TSE

A camada de dados usa o catálogo CKAN oficial do TSE para descobrir o recurso vigente de candidatos de 2026:

- Portal de Dados Abertos do TSE: https://dadosabertos.tse.jus.br/
- Candidatos - 2026: https://dadosabertos.tse.jus.br/dataset/candidatos-2026
- API CKAN do pacote: https://dadosabertos.tse.jus.br/api/3/action/package_show?id=candidatos-2026
- Divulgação de Candidaturas e Contas Eleitorais: https://divulgacandcontas.tse.jus.br/divulga/#/

Os dados normalizados para o frontend preservam, quando disponíveis, cargo, UF, número, nome de urna, nome completo, partido, situação da candidatura e data da última atualização. Qualquer ausência, defasagem ou indisponibilidade de dados deve ser comunicada de forma neutra.

O arquivo nacional é segmentado por UF durante a leitura, evitando misturar candidaturas de estados diferentes. A data apresentada vem dos campos de geração do próprio CSV oficial. As fotos são associadas pelo identificador `SQ_CANDIDATO` aos arquivos oficiais `F{UF}{SQ_CANDIDATO}_div.jpg` distribuídos pelo TSE.

## API de candidatos

`GET /api/candidates` consulta a fonte oficial do TSE, baixa o recurso CSV/ZIP de candidatos, normaliza os campos e retorna um JSON próprio para uso no frontend.

Parâmetros aceitos:

- `uf`: sigla da UF, como `SP`, `RJ` ou `BR`.
- `office`: `deputado-federal`, `deputado-estadual-distrital`, `senador`, `governador` ou `presidente`.
- `q`: busca por número, nome de urna, nome completo ou partido.
- `limit`: limite de resultados, entre 1 e 200.

Exemplo:

```http
GET /api/candidates?uf=SP&office=senador&q=123&limit=20
```

A resposta inclui `source.updatedAt`, permitindo exibir a data de última atualização disponível para o usuário.

## Privacidade e analytics

O projeto não deve enviar escolhas de candidatos, partidos ou preferências eleitorais para backend, logs, ferramentas de analytics, eventos de produto ou serviços de terceiros. Métricas, se adicionadas no futuro, devem ser agregadas e não sensíveis, sem payloads que identifiquem escolha política.

A persistência do MVP deve ser local, usando armazenamento do navegador, com opção clara para limpar escolhas.

## Stack planejada

- Next.js com App Router
- React
- TypeScript
- Tailwind CSS
- Componentes acessíveis e reutilizáveis
- localStorage para persistência local
- Deploy em Vercel com runtime para a API de candidatos

## Desenvolvimento local

```bash
npm install
npm run dev
```

Scripts disponíveis:

- `npm run dev`: inicia o servidor de desenvolvimento.
- `npm run build`: gera a build de produção.
- `npm run start`: inicia a build de produção.
- `npm run lint`: executa a verificação de lint.
- `npm run typecheck`: executa a verificação de TypeScript.

## Aplicação ao vivo

A aplicação é publicada na Vercel, onde a rota server-side `/api/candidates` pode consultar e normalizar os dados oficiais do TSE.

**Acesso:** https://cola-eleitoral-2026-azure.vercel.app/

Cada atualização da branch `main` pode gerar uma nova implantação pela integração entre GitHub e Vercel. O GitHub permanece como fonte do código e da documentação; a hospedagem da aplicação e o runtime da API ficam na Vercel.

Quando o TSE bloqueia uma consulta feita pelo runtime da Vercel, a interface usa como contingência o mesmo ZIP oficial diretamente do CDN do TSE, processado no navegador. As escolhas continuam locais e não são enviadas ao servidor.

O navegador mantém os arquivos oficiais em cache durante a sessão para evitar downloads repetidos ao navegar entre cargos ou refazer pesquisas na mesma UF.

## Segurança e neutralidade

- Não armazenar escolhas políticas no servidor.
- Não criar ranking de candidatos.
- Não destacar candidatos por popularidade, partido, ideologia ou ordem não oficial.
- Não usar textos persuasivos sobre candidaturas.
- Sanitizar entradas usadas em busca e filtros.
- Documentar claramente as fontes de dados e a última atualização disponível.

## Desenvolvimento do backlog

As próximas etapas do backlog estão organizadas no Linear no projeto `Cola Eleitoral 2026`, começando por:

1. Configurar base Next.js + TypeScript + Tailwind.
2. Integrar dados oficiais do TSE.
3. Criar fluxo por UF e cargo.
4. Implementar busca e seleção.
5. Aplicar regras para duas escolhas de senador.
6. Criar revisão e edição.
7. Gerar comprovante final.
8. Implementar impressão/exportação.
9. Persistir escolhas localmente.
10. Revisar acessibilidade, neutralidade e avisos legais.
11. Preparar QA e deploy.
