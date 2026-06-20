"use client";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { ReportData, PatientSituation } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, User } from "lucide-react";

interface Props {
  form: UseFormReturn<ReportData>;
}

const situacoes: { value: PatientSituation; label: string }[] = [
  { value: "em_tratamento", label: "Em Tratamento" },
  { value: "tratamento_concluido", label: "Tratamento Concluído" },
  { value: "abandono", label: "Abandono" },
  { value: "paciente_avulso", label: "Paciente Avulso" },
];

export function PatientsForm({ form }: Props) {
  const { register, control, setValue, watch } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "patients" });

  const addPatient = () => {
    append({
      id: crypto.randomUUID(),
      nome: "",
      idade: "",
      endereco: "",
      contato: "",
      situacao: "em_tratamento",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {fields.length} paciente(s) cadastrado(s)
        </p>
        <Button type="button" onClick={addPatient} size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          Adicionar Paciente
        </Button>
      </div>

      {fields.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400">
          <User className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum paciente adicionado</p>
          <p className="text-xs mt-1">Clique em &quot;Adicionar Paciente&quot; para começar</p>
        </div>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="border rounded-lg p-4 bg-gray-50 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-600">
                Paciente {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs">Nome Completo *</Label>
                <Input
                  {...register(`patients.${index}.nome`)}
                  placeholder="Nome completo do paciente"
                  className="mt-1 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Idade</Label>
                  <Input
                    {...register(`patients.${index}.idade`)}
                    placeholder="Ex: 32 anos"
                    className="mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label className="text-xs">Contato</Label>
                  <Input
                    {...register(`patients.${index}.contato`)}
                    placeholder="(92) 99999-9999"
                    className="mt-1 bg-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Endereço</Label>
                <Input
                  {...register(`patients.${index}.endereco`)}
                  placeholder="Rua, número, bairro"
                  className="mt-1 bg-white"
                />
              </div>

              <div>
                <Label className="text-xs">Situação</Label>
                <Select
                  value={watch(`patients.${index}.situacao`)}
                  onValueChange={(val) =>
                    setValue(`patients.${index}.situacao`, val as PatientSituation)
                  }
                >
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {situacoes.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
