"use client";
import { useRef, useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { ReportData } from "@/lib/types";
import { parseOcrText } from "@/lib/ocr-parser";
import { Button } from "@/components/ui/button";
import { Upload, ScanText, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  form: UseFormReturn<ReportData>;
  onPhotosExtracted?: (files: File[]) => void;
}

interface FileEntry { file: File; preview: string }

export function AutoExtract({ form, onPhotosExtracted }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const addFiles = useCallback((selected: FileList | null) => {
    if (!selected) return;
    Array.from(selected).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) =>
        setEntries((prev) => [...prev, { file, preview: e.target?.result as string }]);
      reader.readAsDataURL(file);
    });
    setDone(false);
    setError("");
  }, []);

  const removeEntry = (i: number) => {
    setEntries((prev) => prev.filter((_, idx) => idx !== i));
    setDone(false);
  };

  const handleExtract = async () => {
    if (!entries.length) return;
    setLoading(true);
    setDone(false);
    setError("");

    try {
      // Dynamic import so Tesseract only loads when needed
      const Tesseract = (await import("tesseract.js")).default;

      let allText = "";

      for (let i = 0; i < entries.length; i++) {
        setProgress(`Lendo imagem ${i + 1} de ${entries.length}...`);
        const result = await Tesseract.recognize(entries[i].preview, "por", {
          logger: (m) => {
            if (m.status === "recognizing text") {
              const pct = Math.round((m.progress || 0) * 100);
              setProgress(`Imagem ${i + 1}/${entries.length}: lendo... ${pct}%`);
            }
          },
        });
        allText += "\n" + result.data.text;
      }

      setProgress("Analisando dados...");
      const extracted = parseOcrText(allText);

      if (extracted.disciplina) form.setValue("disciplina", extracted.disciplina);
      if (extracted.aluno) form.setValue("aluno", extracted.aluno);
      if (extracted.matricula) form.setValue("matricula", extracted.matricula);
      if (extracted.cidade) form.setValue("cidade", extracted.cidade);
      if (extracted.periodo) form.setValue("periodo", extracted.periodo);
      if (extracted.dataInicio) form.setValue("dataInicio", extracted.dataInicio);
      if (extracted.dataFim) form.setValue("dataFim", extracted.dataFim);
      if (extracted.patients && extracted.patients.length > 0)
        form.setValue("patients", extracted.patients);
      if (extracted.productivity) form.setValue("productivity", extracted.productivity);

      if (onPhotosExtracted) onPhotosExtracted(entries.map((e) => e.file));
      setDone(true);
      setProgress("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao processar as imagens");
      setProgress("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
        <strong>Extração por OCR local</strong> — sem internet, sem conta. Envie fotos das fichas e o sistema lê o texto automaticamente.
        <br />
        <span className="text-xs text-purple-500">Dica: fotos nítidas e bem iluminadas dão melhores resultados.</span>
      </div>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
      >
        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 font-medium">Clique ou arraste as fotos aqui</p>
        <p className="text-xs text-gray-400 mt-1">Fichas de pacientes, quadro de produtividade, capa</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Thumbnails */}
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {entries.map((entry, i) => (
            <div key={i} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.preview}
                alt={`Foto ${i + 1}`}
                className="w-full h-20 object-cover rounded border"
              />
              <button
                onClick={() => removeEntry(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              <p className="text-xs text-center text-gray-500 mt-0.5 truncate">{entry.file.name}</p>
            </div>
          ))}
        </div>
      )}

      {/* Progress */}
      {loading && progress && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
          {progress}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {done && (
        <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          Dados extraídos! Confira e corrija nas abas Capa, Pacientes e Produtividade antes de gerar o PDF.
        </div>
      )}

      <Button
        type="button"
        onClick={handleExtract}
        disabled={!entries.length || loading}
        className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> {progress || "Processando..."}</>
        ) : (
          <><ScanText className="h-4 w-4" /> Extrair Dados das Imagens</>
        )}
      </Button>

      {entries.length > 0 && !loading && (
        <p className="text-xs text-center text-gray-400">{entries.length} imagem(ns) selecionada(s) · Primeira execução pode demorar ~30s para baixar o motor OCR</p>
      )}
    </div>
  );
}
