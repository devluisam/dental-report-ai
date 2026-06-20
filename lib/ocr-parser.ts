import { ReportData, PatientSituation } from "./types";

// ── utilidades ────────────────────────────────────────────────────────────────

function norm(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

function has(n: string, ...kws: string[]) {
  return kws.every((k) => n.includes(norm(k)));
}

function hasAny(n: string, ...kws: string[]) {
  return kws.some((k) => n.includes(norm(k)));
}

/** Extrai o texto à direita de um rótulo na mesma linha */
function afterLabel(raw: string, ...labels: string[]): string {
  const n = norm(raw);
  for (const lbl of labels) {
    const nl = norm(lbl);
    const idx = n.indexOf(nl);
    if (idx !== -1) {
      return raw.slice(idx + lbl.length).replace(/^[\s:\/]+/, "").trim();
    }
  }
  return "";
}

/** Retorna a próxima linha não vazia que não seja um rótulo conhecido */
function nextMeaningfulLine(lines: string[], normLines: string[], from: number): string {
  const SKIP = [
    "ALUNO", "PACIENTE", "IDADE", "ENDERECO", "ENDEREÇO", "BAIRRO",
    "TELEFONE", "CONTATO", "SITUACAO", "SITUAÇÃO", "ACADEMICO", "PROFESSOR",
    "DISCIPLINA", "TURMA", "TURNO", "FICHA", "DATA", "NOME",
  ];
  for (let i = from; i < Math.min(from + 4, lines.length); i++) {
    const raw = lines[i].trim();
    const n = normLines[i];
    if (!raw || raw.length < 2) continue;
    if (SKIP.some((s) => n.startsWith(s))) continue;
    if (/^\d{1,2}$/.test(raw)) continue; // número isolado = pular
    return raw;
  }
  return "";
}

function parseDate(raw: string): string {
  const m = raw.match(/(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})/);
  if (!m) return "";
  const d = m[1].padStart(2, "0");
  const mo = m[2].padStart(2, "0");
  const y = m[3].length === 2 ? "20" + m[3] : m[3];
  return `${y}-${mo}-${d}`;
}

// ── procedimentos ─────────────────────────────────────────────────────────────

const PROCS: { key: keyof ReportData["productivity"]; kws: string[][] }[] = [
  { key: "anamnese",                   kws: [["ANAMNESE"], ["PROFILAXIA", "EXAME"], ["ODONTOGRAMA"], ["1", "CONSULTA"], ["PLANEJAMENTO"]] },
  { key: "fluor",                      kws: [["FLUOR"], ["TOPICA"], ["VERNIZ"]] },
  { key: "selamento",                  kws: [["SELAMENTO"]] },
  { key: "restauracaoProvisoria",      kws: [["RESTAURA", "PROVISORI"], ["CURATIVO"], ["LESOES NAO CARIOSA"]] },
  { key: "restauracaoDefinitiva",      kws: [["RESINA COMPOSTA"], ["RESTAURA", "DEFINITIV"]] },
  { key: "raspagem_supra",             kws: [["SUPRA"], ["SUPRAGENGIVAL"]] },
  { key: "raspagem_sub",               kws: [["SUBGENGIVAL"]] },
  { key: "exodontias",                 kws: [["EXODONTIA"]] },
  { key: "moldagem",                   kws: [["MOLDAGEM"]] },
  { key: "endodontia",                 kws: [["ENDODONT"]] },
  { key: "protese_parcial_provisoria", kws: [["PARCIAL", "PROVISORI"]] },
  { key: "protese_parcial",            kws: [["PARCIAL REMOVIVEL"]] },
  { key: "provisorio",                 kws: [["CONFECCAO DE PROVISORIO"], ["CONFEC", "PROVISORI"]] },
  { key: "protese_fixa",               kws: [["PROTESE FIXA"]] },
  { key: "cirurgia_tecidos",           kws: [["CIRURGI", "TECIDO"], ["TECIDOS MOLES"]] },
];

function matchProc(n: string): keyof ReportData["productivity"] | null {
  for (const { key, kws } of PROCS) {
    for (const grp of kws) {
      if (grp.every((k) => n.includes(k))) return key;
    }
  }
  return null;
}

// ── parser principal ──────────────────────────────────────────────────────────

export function parseOcrText(fullText: string): Partial<ReportData> {
  const lines = fullText.split("\n").map((l) => l.trim());
  const normLines = lines.map(norm);

  const result: Partial<ReportData> & {
    productivity: ReportData["productivity"];
    patients: ReportData["patients"];
  } = {
    disciplina: "",
    aluno: "",
    matricula: "",
    cidade: "Manaus - AM",
    periodo: "",
    dataInicio: "",
    dataFim: "",
    patients: [],
    productivity: {
      anamnese: 0, fluor: 0, selamento: 0, restauracaoProvisoria: 0,
      restauracaoDefinitiva: 0, raspagem_supra: 0, raspagem_sub: 0,
      exodontias: 0, moldagem: 0, endodontia: 0, protese_parcial: 0,
      protese_parcial_provisoria: 0, provisorio: 0, protese_fixa: 0,
      cirurgia_tecidos: 0,
    },
  };

  // ── rastrear paciente atual (Ficha de Triagem) ────────────────────────────
  type Draft = {
    nome: string; idade: string; endereco: string;
    bairro: string; contato: string; situacao: PatientSituation;
  };
  let cur: Draft | null = null;
  // mapa para evitar duplicatas (por nome normalizado)
  const seenPatients = new Set<string>();

  const flushPatient = () => {
    if (!cur) return;
    const key = norm(cur.nome);
    if (cur.nome.trim() && !seenPatients.has(key)) {
      seenPatients.add(key);
      const endFull = cur.bairro
        ? `${cur.endereco}${cur.endereco ? ", " : ""}${cur.bairro}`
        : cur.endereco;
      result.patients.push({
        id: `ocr-${Date.now()}-${result.patients.length}`,
        nome: cur.nome,
        idade: cur.idade,
        endereco: endFull,
        contato: cur.contato,
        situacao: cur.situacao,
      });
    }
    cur = null;
  };

  for (let i = 0; i < normLines.length; i++) {
    const n = normLines[i];
    const raw = lines[i];

    // ── ALUNO (Ficha de Avaliação: "ALUNO: Nome Completo") ──────────────────
    if (!result.aluno && has(n, "ALUNO") && !has(n, "PACIENTE") && !has(n, "NOTA")) {
      let v = afterLabel(raw, "ALUNO:");
      if (!v) v = nextMeaningfulLine(lines, normLines, i + 1);
      // Remover ruído como "TURMA", "TURNO" que às vezes vêm na mesma linha
      v = v.replace(/\s*(TURMA|TURNO).*$/i, "").trim();
      if (v.length > 3) result.aluno = v;
    }

    // ── ACADÊMICOS (Ficha de Triagem: "Acadêmicos: Nome") ───────────────────
    if (!result.aluno && hasAny(n, "ACADEMICO", "ACADEMICOS")) {
      let v = afterLabel(raw, "Acadêmicos:", "ACADEMICOS:", "Academico:");
      if (!v) v = nextMeaningfulLine(lines, normLines, i + 1);
      // Pode ter dois nomes separados por "/" — pegar só o primeiro
      v = v.split("/")[0].trim();
      if (v.length > 3) result.aluno = v;
    }

    // ── DISCIPLINA ───────────────────────────────────────────────────────────
    if (!result.disciplina) {
      // Ficha de triagem: "Disciplina: Clínica do Adulto III"
      if (has(n, "DISCIPLINA") && !has(n, "PLANEJAMENTO") && !has(n, "AVALIACAO")) {
        let v = afterLabel(raw, "Disciplina:", "DISCIPLINA:");
        if (!v) v = nextMeaningfulLine(lines, normLines, i + 1);
        if (v && v.length > 2 && !norm(v).includes("DEVE SER")) result.disciplina = v;
      }
      // Ficha de avaliação: "DISCIPLINAS: Clínica Integrada I, II e III..."
      if (has(n, "DISCIPLINAS")) {
        let v = afterLabel(raw, "DISCIPLINAS:");
        if (!v) v = nextMeaningfulLine(lines, normLines, i + 1);
        if (v) result.disciplina = v;
      }
    }

    // ── DATA (coletar datas de qualquer ficha para período) ──────────────────
    const dateMatch = raw.match(/\b(\d{1,2})[\/\.](\d{1,2})[\/\.](20\d{2})\b/);
    if (dateMatch) {
      const parsed = parseDate(dateMatch[0]);
      if (parsed) {
        if (!result.dataInicio || parsed < result.dataInicio) result.dataInicio = parsed;
        if (!result.dataFim || parsed > result.dataFim) result.dataFim = parsed;
      }
    }

    // ── PERÍODO ──────────────────────────────────────────────────────────────
    if (!result.periodo) {
      const periodoM = raw.match(/\b(20\d{2})[.\-](\d)\b/);
      if (periodoM) result.periodo = periodoM[0];
    }

    // ── FICHA DE TRIAGEM: início de novo paciente ────────────────────────────
    if (hasAny(n, "FICHA DE TRIAGEM", "FICHA TRIAGEM")) {
      flushPatient();
      cur = { nome: "", idade: "", endereco: "", bairro: "", contato: "", situacao: "em_tratamento" };
    }

    // ── PACIENTE (em qualquer ficha) ─────────────────────────────────────────
    if (has(n, "PACIENTE") && !has(n, "SISTEMICA", "COMPROMETIDO", "ATENDIDOS")) {
      let v = afterLabel(raw, "PACIENTE:", "PACIENTE");
      if (!v) v = nextMeaningfulLine(lines, normLines, i + 1);
      if (v.length > 2) {
        if (cur) {
          cur.nome = v;
        } else {
          // Ficha de Avaliação sem triagem: cria paciente simples
          const key = norm(v);
          if (!seenPatients.has(key)) {
            cur = { nome: v, idade: "", endereco: "", bairro: "", contato: "", situacao: "em_tratamento" };
          }
        }
      }
    }

    if (!cur) continue;

    // ── IDADE ────────────────────────────────────────────────────────────────
    if (!cur.idade && has(n, "IDADE")) {
      let v = afterLabel(raw, "IDADE:");
      if (!v) v = nextMeaningfulLine(lines, normLines, i + 1);
      // Remover "anos" se veio junto
      v = v.replace(/anos?/i, "").trim();
      if (v) cur.idade = v + " anos";
    }

    // ── ENDEREÇO ─────────────────────────────────────────────────────────────
    if (!cur.endereco && hasAny(n, "ENDERECO", "ENDEREÇO")) {
      let v = afterLabel(raw, "ENDEREÇO:", "ENDERECO:");
      if (!v) v = nextMeaningfulLine(lines, normLines, i + 1);
      if (v) cur.endereco = v;
    }

    // ── BAIRRO ───────────────────────────────────────────────────────────────
    if (!cur.bairro && has(n, "BAIRRO")) {
      let v = afterLabel(raw, "BAIRRO:");
      if (!v) v = nextMeaningfulLine(lines, normLines, i + 1);
      if (v) cur.bairro = v;
    }

    // ── CONTATO / TELEFONE ───────────────────────────────────────────────────
    if (!cur.contato && hasAny(n, "TELEFONE", "CONTATO")) {
      let v = afterLabel(raw, "TELEFONES PARA CONTATO:", "TELEFONE:", "CONTATO:");
      if (!v) {
        // Procurar padrão de telefone na linha
        const tel = raw.match(/\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4}/);
        if (tel) v = tel[0];
      }
      if (v) cur.contato = v;
    }

    // ── SITUAÇÃO ─────────────────────────────────────────────────────────────
    if (hasAny(n, "SITUACAO", "SITUAÇÃO")) {
      const block = [raw, lines[i + 1] || "", lines[i + 2] || ""].join(" ");
      cur.situacao = detectSituacao(block);
    }
  }

  flushPatient();

  // ── Produtividade (quadro de produtividade do relatório) ──────────────────
  for (let i = 0; i < normLines.length; i++) {
    const n = normLines[i];
    const key = matchProc(n);
    if (!key) continue;

    // Número na mesma linha (extrai apenas dígitos isolados ao final)
    const numSame = lines[i].match(/\b(\d{1,3})\s*$/);
    if (numSame) {
      result.productivity[key] += parseInt(numSame[1], 10);
    } else {
      // Próxima linha com número isolado
      for (let j = i + 1; j <= i + 2 && j < lines.length; j++) {
        if (/^\d+$/.test(lines[j].trim())) {
          result.productivity[key] += parseInt(lines[j].trim(), 10);
          break;
        }
      }
    }
  }

  return result;
}

// ── detectar situação pelos checkboxes ───────────────────────────────────────
function detectSituacao(block: string): PatientSituation {
  const n = norm(block);
  const parts = n.split(/\[([^\]]{0,5})\]/);
  for (let i = 1; i < parts.length; i += 2) {
    const box = parts[i].trim();
    const after = parts[i + 1] || "";
    if (!box || box === " ") continue;
    if (after.includes("EM TRATAMENTO") && !after.includes("CONCLU")) return "em_tratamento";
    if (after.includes("CONCLU")) return "tratamento_concluido";
    if (after.includes("ABANDONO")) return "abandono";
    if (after.includes("AVULSO")) return "paciente_avulso";
  }
  return "em_tratamento";
}
