# Dental Report AI

Ferramenta que transforma fotos de fichas clínicas preenchidas à mão em um relatório
de estágio odontológico pronto para entregar em PDF.

## Sobre o projeto

O relatório de estágio da clínica de Odontologia é montado a partir de fichas de
papel: dados do paciente, situação do tratamento e a contagem de cada procedimento
realizado. Transcrever isso à mão para o documento final é demorado, repetitivo e
fácil de errar na soma dos procedimentos.

Este projeto encurta o caminho: o aluno fotografa as fichas, o sistema lê as imagens,
estrutura os dados e devolve o relatório montado — com a possibilidade de revisar e
corrigir cada campo antes de exportar.

## Funcionalidades

- **Extração automática por imagem** — as fotos das fichas são enviadas para a API da
  Claude (modelo com visão), que devolve os dados já estruturados em JSON: identificação
  do aluno, período, lista de pacientes e contagem de procedimentos.
- **OCR no navegador** — o Tesseract.js roda no cliente e alimenta um parser próprio,
  escrito para o layout específico dessas fichas (leitura por rótulo, tolerante a acento
  e a quebras de linha), usado como caminho alternativo de leitura.
- **Revisão antes de exportar** — todos os campos extraídos ficam editáveis em
  formulários (capa, pacientes e produtividade), com validação via Zod.
- **Lista de pacientes ordenável** — reordenação por arrastar e soltar com dnd-kit.
- **Pré-visualização fiel** — o relatório é renderizado na tela exatamente como sairá.
- **Exportação em PDF** — captura da pré-visualização com html2canvas e montagem em
  páginas A4 via jsPDF.

## Arquitetura

```
Navegador
   │
   ├── Upload das fotos das fichas
   │
   ├── Caminho A ──→ POST /api/extract ──→ Claude API (visão) ──→ JSON estruturado
   │
   └── Caminho B ──→ Tesseract.js (no cliente) ──→ lib/ocr-parser.ts ──→ JSON estruturado
                                                          │
                                                          ↓
                                           Formulários editáveis (React Hook Form + Zod)
                                                          │
                                                          ↓
                                           Pré-visualização → html2canvas → jsPDF → PDF A4
```

A chave da API fica apenas no servidor: a rota `/api/extract` é o único ponto que fala
com a Claude, e o navegador nunca vê a credencial.

## Tecnologias

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Radix UI ·
Anthropic SDK (Claude) · Tesseract.js · jsPDF · html2canvas · React Hook Form · Zod · dnd-kit

## Instalação

Requisitos: Node.js 20+ e uma chave da API da Anthropic.

```bash
git clone https://github.com/devluisam/dental-report-ai.git
cd dental-report-ai
npm install

cp .env.example .env.local   # preencha a chave
npm run dev                  # http://localhost:3000
```

## Variáveis de ambiente

| Variável | Para quê |
|---|---|
| `ANTHROPIC_API_KEY` | Extração dos dados das imagens pela rota `/api/extract` |

`.env.local` está no `.gitignore`. Nunca versione a chave.

## Estrutura do projeto

```
app/
├── api/extract/route.ts   extração via Claude (server-side)
└── page.tsx               fluxo principal da aplicação
components/
├── AutoExtract.tsx        upload, OCR no cliente e disparo da extração
├── CoverForm.tsx          dados da capa do relatório
├── PatientsForm.tsx       lista de pacientes (ordenável)
├── ProductivityForm.tsx   contagem de procedimentos
├── ReportPreview.tsx      pré-visualização em formato A4
└── PhotosUpload.tsx       anexos de imagens
lib/
├── ocr-parser.ts          parser do texto do OCR para dados estruturados
├── pdf-generator.ts       montagem do PDF
└── types.ts               contratos de dados do relatório
```

## Autor

**Luis Henrique Azevedo** — Manaus, AM
[Portfólio](https://devluisam.github.io) · [GitHub](https://github.com/devluisam) · [LinkedIn](https://www.linkedin.com/in/luis-henrique-94a6183b3)
