"use client";
import { UseFormReturn } from "react-hook-form";
import { ReportData } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Props {
  form: UseFormReturn<ReportData>;
}

export function CoverForm({ form }: Props) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
        Preencha os dados da capa do relatório
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="disciplina">Nome da Disciplina *</Label>
          <Input
            id="disciplina"
            placeholder="Ex: Clínica Integrada I"
            {...register("disciplina")}
            className="mt-1"
          />
          {errors.disciplina && (
            <p className="text-red-500 text-xs mt-1">{errors.disciplina.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="aluno">Nome Completo do Aluno *</Label>
          <Input
            id="aluno"
            placeholder="Nome completo"
            {...register("aluno")}
            className="mt-1"
          />
          {errors.aluno && (
            <p className="text-red-500 text-xs mt-1">{errors.aluno.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="matricula">Matrícula *</Label>
          <Input
            id="matricula"
            placeholder="Ex: 2023001234"
            {...register("matricula")}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              placeholder="Ex: Manaus - AM"
              {...register("cidade")}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="periodo">Ano/Período</Label>
            <Input
              id="periodo"
              placeholder="Ex: 2024.1"
              {...register("periodo")}
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="dataInicio">Data Início do Período</Label>
            <Input
              id="dataInicio"
              type="date"
              {...register("dataInicio")}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="dataFim">Data Fim do Período</Label>
            <Input
              id="dataFim"
              type="date"
              {...register("dataFim")}
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
