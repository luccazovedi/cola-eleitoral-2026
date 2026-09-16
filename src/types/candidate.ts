export type CandidateOffice =
  | "deputado-federal"
  | "deputado-estadual-distrital"
  | "senador"
  | "governador"
  | "presidente";

export type CandidateSource = {
  datasetName: string;
  datasetUrl: string;
  resourceName: string;
  resourceUrl: string;
  updatedAt: string | null;
};

export type Candidate = {
  id: string;
  uf: string;
  office: CandidateOffice;
  officeLabel: string;
  number: string;
  ballotName: string;
  fullName: string;
  party: string;
  status: string;
  sourceUpdatedAt: string | null;
};

export type CandidateFilters = {
  uf?: string;
  office?: CandidateOffice;
  q?: string;
  limit?: number;
};

export type CandidateSearchResult = {
  source: CandidateSource;
  filters: Required<Pick<CandidateFilters, "limit">> & Omit<CandidateFilters, "limit">;
  total: number;
  candidates: Candidate[];
};
