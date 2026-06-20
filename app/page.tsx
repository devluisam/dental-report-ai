"use client";
import { useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ReportData, PhotoItem } from "@/lib/types";
import { CoverForm } from "@/components/CoverForm";
import { PatientsForm } from "@/components/PatientsForm";
import { ProductivityForm } from "@/components/ProductivityForm";
import { PhotosUpload } from "@/components/PhotosUpload";
import { AutoExtract } from "@/components/AutoExtract";
import { ReportPreview } from "@/components/ReportPreview";
import { Button } from "@/components/ui/button";
import { generatePDF } from "@/lib/pdf-generator";
import { FileDown, Loader2, Eye, EyeOff } from "lucide-react";

const schema = z.object({
  disciplina: z.string().min(1, "Informe o nome da disciplina"),
  aluno: z.string().min(1, "Informe o nome do aluno"),
  matricula: z.string().optional().default(""),
  cidade: z.string().optional().default("Manaus - AM"),
  periodo: z.string().optional().default(""),
  dataInicio: z.string().optional().default(""),
  dataFim: z.string().optional().default(""),
  patients: z.array(
    z.object({
      id: z.string(),
      nome: z.string(),
      idade: z.string(),
      endereco: z.string(),
      contato: z.string(),
      situacao: z.enum(["em_tratamento", "tratamento_concluido", "abandono", "paciente_avulso"]),
    })
  ).default([]),
  productivity: z.object({
    anamnese: z.number().default(0),
    fluor: z.number().default(0),
    selamento: z.number().default(0),
    restauracaoProvisoria: z.number().default(0),
    restauracaoDefinitiva: z.number().default(0),
    raspagem_supra: z.number().default(0),
    raspagem_sub: z.number().default(0),
    exodontias: z.number().default(0),
    moldagem: z.number().default(0),
    endodontia: z.number().default(0),
    protese_parcial: z.number().default(0),
    protese_parcial_provisoria: z.number().default(0),
    provisorio: z.number().default(0),
    protese_fixa: z.number().default(0),
    cirurgia_tecidos: z.number().default(0),
  }).default({}),
  photos: z.array(z.any()).default([]),
});

const TABS = [
  { id: "extrair", label: "⚡ Extrair" },
  { id: "capa", label: "Capa" },
  { id: "pacientes", label: "Pacientes" },
  { id: "produtividade", label: "Produtividade" },
  { id: "fotos", label: "Fotos" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("extrair");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  const form = useForm<ReportData>({
    resolver: zodResolver(schema),
    defaultValues: {
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
        protese_parcial_provisoria: 0, provisorio: 0, protese_fixa: 0, cirurgia_tecidos: 0,
      },
      photos: [],
    },
    mode: "onChange",
  });

  const formData = form.watch();
  const reportData: ReportData = { ...formData, photos };

  const handleGeneratePDF = useCallback(async () => {
    if (!previewRef.current) return;
    setIsGenerating(true);
    try {
      await generatePDF(previewRef.current);
    } catch (err) {
      alert("Erro ao gerar PDF. Verifique o console para mais detalhes.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/fametro-logo.png" alt="FAMETRO" className="h-8" />
            <div>
              <h1 className="text-sm font-bold text-gray-800 leading-none">
                Gerador de Relatório de Estágio
              </h1>
              <p className="text-xs text-gray-500">Centro Universitário FAMETRO</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview((v) => !v)}
              className="gap-1 hidden md:flex"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? "Ocultar" : "Mostrar"} Preview
            </Button>

            <Button
              type="button"
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              {isGenerating ? "Gerando PDF..." : "Gerar Relatório PDF"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto p-4">
        <div className={`flex gap-4 ${showPreview ? "md:flex-row" : ""}`}>
          {/* ─── FORM PANEL ─── */}
          <div className={`${showPreview ? "md:w-[420px] w-full" : "w-full max-w-2xl mx-auto"} flex-shrink-0`}>
            {/* Tabs */}
            <div className="bg-white rounded-t-lg border border-b-0 flex">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white border rounded-b-lg p-4 min-h-[calc(100vh-140px)] overflow-y-auto max-h-[calc(100vh-140px)]">
              {activeTab === "extrair" && (
                <AutoExtract
                  form={form}
                  onPhotosExtracted={(files) => {
                    const items = files.map((f, i) => ({
                      id: `auto-${Date.now()}-${i}`,
                      file: f,
                      preview: URL.createObjectURL(f),
                      caption: f.name.replace(/\.[^/.]+$/, ""),
                    }));
                    setPhotos((prev) => [...prev, ...items]);
                    setActiveTab("capa");
                  }}
                />
              )}
              {activeTab === "capa" && <CoverForm form={form} />}
              {activeTab === "pacientes" && <PatientsForm form={form} />}
              {activeTab === "produtividade" && <ProductivityForm form={form} />}
              {activeTab === "fotos" && (
                <PhotosUpload photos={photos} onChange={setPhotos} />
              )}
            </div>

            {/* Nav buttons */}
            <div className="flex justify-between mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={activeTab === "capa"}
                onClick={() => {
                  const idx = TABS.findIndex((t) => t.id === activeTab);
                  if (idx > 0) setActiveTab(TABS[idx - 1].id);
                }}
              >
                ← Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={activeTab === "fotos"}
                onClick={() => {
                  const idx = TABS.findIndex((t) => t.id === activeTab);
                  if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id);
                }}
              >
                Próximo →
              </Button>
            </div>
          </div>

          {/* ─── PREVIEW PANEL ─── */}
          {showPreview && (
            <div className="flex-1 min-w-0">
              <div className="bg-gray-200 rounded-lg border px-2 py-2">
                <p className="text-xs text-center text-gray-500 mb-3 font-medium">
                  Preview do Relatório (atualiza em tempo real)
                </p>
                <div
                  className="overflow-auto max-h-[calc(100vh-160px)]"
                  style={{ background: "#e0e0e0" }}
                >
                  <div
                    style={{
                      transform: "scale(0.55)",
                      transformOrigin: "top center",
                      width: "181.8%",
                      pointerEvents: "none",
                    }}
                  >
                    <ReportPreview data={reportData} previewRef={previewRef} />
                  </div>
                </div>
              </div>

              <p className="text-xs text-center text-gray-400 mt-2">
                O PDF gerado terá tamanho A4 com qualidade profissional
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
