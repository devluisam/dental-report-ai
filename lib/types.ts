export type PatientSituation =
  | "em_tratamento"
  | "tratamento_concluido"
  | "abandono"
  | "paciente_avulso";

export interface Patient {
  id: string;
  nome: string;
  idade: string;
  endereco: string;
  contato: string;
  situacao: PatientSituation;
}

export interface Productivity {
  anamnese: number;
  fluor: number;
  selamento: number;
  restauracaoProvisoria: number;
  restauracaoDefinitiva: number;
  raspagem_supra: number;
  raspagem_sub: number;
  exodontias: number;
  moldagem: number;
  endodontia: number;
  protese_parcial: number;
  protese_parcial_provisoria: number;
  provisorio: number;
  protese_fixa: number;
  cirurgia_tecidos: number;
}

export interface PhotoItem {
  id: string;
  file: File;
  preview: string;
  caption: string;
}

export interface ReportData {
  disciplina: string;
  aluno: string;
  matricula: string;
  cidade: string;
  periodo: string;
  dataInicio: string;
  dataFim: string;
  patients: Patient[];
  productivity: Productivity;
  photos: PhotoItem[];
}

export const PROCEDURES: { key: keyof Productivity; label: string }[] = [
  {
    key: "anamnese",
    label:
      "Anamnese, Profilaxia, Exame Clínico, Odontograma e Planejamento. (1ª consulta)",
  },
  {
    key: "fluor",
    label: "Aplicação Tópica de Flúor (Gel e ou Verniz) (por paciente)",
  },
  {
    key: "selamento",
    label: "Selamento Provisório de Lesões Cariosas Cavitadas (por dente)",
  },
  {
    key: "restauracaoProvisoria",
    label:
      "Restaurações Provisórias e ou Curativos de lesões não cariosas (por dente)",
  },
  {
    key: "restauracaoDefinitiva",
    label: "Restaurações Definitivas em Resina Composta",
  },
  { key: "raspagem_supra", label: "Raspagem supra-gengival por sextante" },
  { key: "raspagem_sub", label: "Raspagem subgengival por sextante" },
  { key: "exodontias", label: "Exodontias de dentes permanentes" },
  { key: "moldagem", label: "Moldagem" },
  { key: "endodontia", label: "Tratamento endodôntico" },
  { key: "protese_parcial", label: "Prótese Parcial Removível" },
  {
    key: "protese_parcial_provisoria",
    label: "Prótese Parcial Removível provisória",
  },
  { key: "provisorio", label: "Confecção de provisório" },
  { key: "protese_fixa", label: "Prótese Fixa" },
  {
    key: "cirurgia_tecidos",
    label: "Procedimentos Cirúrgicos em Tecidos Moles",
  },
];

export const SITUATION_LABELS: Record<PatientSituation, string> = {
  em_tratamento: "EM TRATAMENTO",
  tratamento_concluido: "TRATAMENTO CONCLUÍDO",
  abandono: "ABANDONO",
  paciente_avulso: "PAC. AVULSO",
};
