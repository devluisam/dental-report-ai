"use client";
import { UseFormReturn } from "react-hook-form";
import { ReportData, PROCEDURES } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Props {
  form: UseFormReturn<ReportData>;
}

export function ProductivityForm({ form }: Props) {
  const { register } = form;

  return (
    <div className="space-y-3">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
        Registre o número total de cada procedimento realizado (somatório de todos os pacientes).
      </div>

      <div className="space-y-2">
        {PROCEDURES.map(({ key, label }, i) => (
          <div key={key} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 border border-transparent hover:border-gray-100">
            <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{i + 1}.</span>
            <Label className="text-xs flex-1 leading-tight cursor-pointer" htmlFor={key}>
              {label}
            </Label>
            <Input
              id={key}
              type="number"
              min="0"
              {...register(`productivity.${key}`, { valueAsNumber: true })}
              className="w-20 text-center flex-shrink-0"
              defaultValue={0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
