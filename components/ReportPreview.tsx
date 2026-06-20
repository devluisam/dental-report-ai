"use client";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ReportData, PROCEDURES, SITUATION_LABELS, PatientSituation } from "@/lib/types";

interface Props {
  data: ReportData;
  previewRef?: React.RefObject<HTMLDivElement>;
}

const PIE_COLORS = ["#4472C4", "#70AD47", "#ED7D31", "#A5A5A5"];

function formatDate(dateStr: string) {
  if (!dateStr) return "____/________";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function SituationCheckboxes({ situacao }: { situacao: PatientSituation }) {
  const options: { key: PatientSituation; label: string }[] = [
    { key: "em_tratamento", label: "EM TRATAMENTO" },
    { key: "tratamento_concluido", label: "TRATAMENTO CONCLUÍDO" },
    { key: "abandono", label: "ABANDONO" },
    { key: "paciente_avulso", label: "PAC. AVULSO" },
  ];
  return (
    <span style={{ display: "inline-flex", gap: 12, fontSize: 9, flexWrap: "wrap" }}>
      {options.map((o) => (
        <span key={o.key} style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              border: "1px solid #333",
              background: situacao === o.key ? "#333" : "transparent",
              flexShrink: 0,
            }}
          />
          {" "}{o.label}
        </span>
      ))}
    </span>
  );
}

export function ReportPreview({ data, previewRef }: Props) {
  const barData = PROCEDURES.map(({ key, label }) => ({
    name: label.split("(")[0].trim().slice(0, 30),
    fullName: label,
    quantidade: data.productivity[key] || 0,
  })).filter((d) => d.quantidade > 0);

  const patientCounts = {
    em_tratamento: data.patients.filter((p) => p.situacao === "em_tratamento").length,
    tratamento_concluido: data.patients.filter((p) => p.situacao === "tratamento_concluido").length,
    abandono: data.patients.filter((p) => p.situacao === "abandono").length,
    paciente_avulso: data.patients.filter((p) => p.situacao === "paciente_avulso").length,
  };

  const pieData = [
    { name: "Em tratamento", value: patientCounts.em_tratamento },
    { name: "Tratamento Concluído", value: patientCounts.tratamento_concluido },
    { name: "Abandono de tratamento", value: patientCounts.abandono },
    { name: "Paciente Avulso", value: patientCounts.paciente_avulso },
  ].filter((d) => d.value > 0);

  const totalProc = PROCEDURES.reduce((s, { key }) => s + (data.productivity[key] || 0), 0);

  return (
    <div ref={previewRef} id="report-root" style={{ background: "#fff" }}>
      {/* ────────── PAGE 1 — CAPA ────────── */}
      <div
        className="report-page"
        id="page-cover"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "297mm",
          textAlign: "center",
          fontFamily: "Times New Roman, Times, serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/fametro-logo.png"
          alt="FAMETRO"
          style={{ width: 200, marginBottom: 32 }}
        />

        <p style={{ fontSize: 14, fontWeight: "bold", marginBottom: 24, textTransform: "uppercase" }}>
          CENTRO UNIVERSITÁRIO FAMETRO
        </p>

        <p style={{ fontSize: 13, fontWeight: "bold", marginBottom: 40, maxWidth: 400 }}>
          {data.disciplina || "NOME DA DISCIPLINA"}
        </p>

        <p
          style={{
            fontSize: 13,
            fontWeight: "bold",
            marginBottom: 60,
            maxWidth: 420,
            lineHeight: 1.5,
          }}
        >
          RELATÓRIO DAS ATIVIDADES AMBULATORIAIS E PRODUTIVIDADE INDIVIDUAL
        </p>

        <p style={{ fontSize: 13, fontWeight: "bold", marginBottom: 8 }}>
          {data.aluno || "NOME DO ALUNO"}
        </p>

        <p style={{ fontSize: 12, marginBottom: 80 }}>
          {data.matricula ? `Matrícula: ${data.matricula}` : "MATRÍCULA DO ALUNO"}
        </p>

        <p style={{ fontSize: 12, marginBottom: 4 }}>
          {data.cidade || "Manaus - AM"}
        </p>
        <p style={{ fontSize: 12 }}>{data.periodo || "2023.2"}</p>
      </div>

      {/* ────────── PAGE 2 — PACIENTES ────────── */}
      <div
        className="report-page"
        id="page-patients"
        style={{ fontFamily: "Times New Roman, Times, serif" }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 20,
            textTransform: "uppercase",
            borderBottom: "2px solid #000",
            paddingBottom: 8,
          }}
        >
          SITUAÇÃO DOS PACIENTES ATENDIDOS NO PERÍODO DE{" "}
          {formatDate(data.dataInicio)} A {formatDate(data.dataFim)}.
        </p>

        {data.patients.length === 0 && (
          <p style={{ color: "#999", fontSize: 11, textAlign: "center" }}>
            Nenhum paciente cadastrado
          </p>
        )}

        {data.patients.map((patient, i) => (
          <div
            key={patient.id}
            style={{
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: i < data.patients.length - 1 ? "1px solid #ccc" : "none",
            }}
          >
            <p style={{ fontSize: 10, fontWeight: "bold", marginBottom: 4 }}>
              NOME COMPLETO DO PACIENTE:{" "}
              <span style={{ fontWeight: "normal" }}>{patient.nome || "___________________________"}</span>
            </p>
            <p style={{ fontSize: 10, fontWeight: "bold", marginBottom: 4 }}>
              IDADE:{" "}
              <span style={{ fontWeight: "normal" }}>{patient.idade || "___"}</span>
            </p>
            <p style={{ fontSize: 10, fontWeight: "bold", marginBottom: 4 }}>
              ENDEREÇO DO PACIENTE:{" "}
              <span style={{ fontWeight: "normal" }}>{patient.endereco || "___________________________"}</span>
            </p>
            <p style={{ fontSize: 10, fontWeight: "bold", marginBottom: 6 }}>
              CONTATO:{" "}
              <span style={{ fontWeight: "normal" }}>{patient.contato || "___________________________"}</span>
            </p>
            <p style={{ fontSize: 10, fontWeight: "bold" }}>
              SITUAÇÃO:{" "}
              <SituationCheckboxes situacao={patient.situacao} />
            </p>
          </div>
        ))}
      </div>

      {/* ────────── PAGE 3 — PRODUTIVIDADE ────────── */}
      <div
        className="report-page"
        id="page-productivity"
        style={{ fontFamily: "Times New Roman, Times, serif" }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 4,
            textTransform: "uppercase",
          }}
        >
          QUADRO DE PRODUTIVIDADE INDIVIDUAL
        </p>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 10,
            marginBottom: 12,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  border: "1px solid #000",
                  padding: "6px 8px",
                  textAlign: "left",
                  background: "#D9D9D9",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  fontSize: 10,
                }}
              >
                PROCEDIMENTOS REALIZADOS
              </th>
              <th
                style={{
                  border: "1px solid #000",
                  padding: "6px 8px",
                  textAlign: "center",
                  background: "#D9D9D9",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  fontSize: 10,
                  width: 100,
                }}
              >
                QUANTIDADE
              </th>
            </tr>
          </thead>
          <tbody>
            {PROCEDURES.map(({ key, label }, i) => (
              <tr key={key} style={{ background: i % 2 === 0 ? "#fff" : "#F2F2F2" }}>
                <td style={{ border: "1px solid #000", padding: "5px 8px" }}>{label}</td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "5px 8px",
                    textAlign: "center",
                    fontWeight: data.productivity[key] ? "bold" : "normal",
                  }}
                >
                  {data.productivity[key] || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ fontSize: 9, fontStyle: "italic", color: "#555", marginTop: 4 }}>
          OBS: REGISTRAR NA COLUNA QUANTIDADES O NÚMERO TOTAL DE CADA UM DOS PROCEDIMENTOS
          REALIZADOS (SOMATÓRIO DE TODOS OS PACIENTES).
        </p>
      </div>

      {/* ────────── PAGE 4 — GRÁFICOS ────────── */}
      <div
        className="report-page"
        id="page-charts"
        style={{ fontFamily: "Times New Roman, Times, serif" }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 24,
            textTransform: "uppercase",
            borderBottom: "2px solid #000",
            paddingBottom: 8,
          }}
        >
          GRÁFICOS
        </p>

        {totalProc === 0 && pieData.length === 0 ? (
          <p style={{ color: "#999", textAlign: "center", fontSize: 11 }}>
            Preencha os dados de produtividade para visualizar os gráficos
          </p>
        ) : (
          <>
            {/* Bar Chart */}
            {barData.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: 11, fontWeight: "bold", textAlign: "center", marginBottom: 8 }}>
                  Procedimentos Realizados
                </p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 8 }}
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                    <Tooltip
                      formatter={(v) => [v, "Quantidade"]}
                      labelFormatter={(l, p) => p[0]?.payload?.fullName || l}
                    />
                    <Bar dataKey="quantidade" fill="#4472C4" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Pie Chart */}
            {pieData.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: "bold", textAlign: "center", marginBottom: 8 }}>
                  Pacientes Atendidos
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ percent }: { percent?: number }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend iconSize={12} wrapperStyle={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [v, "Pacientes"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>

      {/* ────────── PAGE 5 — FOTOS ────────── */}
      <div
        className="report-page"
        id="page-photos"
        style={{ fontFamily: "Times New Roman, Times, serif" }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: "bold",
            textAlign: "justify",
            marginBottom: 20,
            textTransform: "uppercase",
            border: "2px solid #000",
            padding: "10px 12px",
          }}
        >
          INSERIR NESTA ÁREA AS FOTOS DE COMPROVAÇÃO DA EXECUÇÃO DOS PROCEDIMENTOS BEM COMO
          TODAS AS FICHAS DE AVALIAÇÃO DIÁRIAS DEVIDAMENTE ASSINADAS E CARIMBADAS PELOS
          PROFESSORES DA DISCIPLINA.
          <br />
          <br />
          AS ASSINATURAS E NOTAS DEVEM ESTAR LEGÍVEIS.
        </p>

        {data.photos.length === 0 ? (
          <div
            style={{
              border: "2px dashed #ccc",
              borderRadius: 8,
              padding: 40,
              textAlign: "center",
              color: "#999",
              fontSize: 11,
            }}
          >
            Nenhuma foto adicionada
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            {data.photos.map((photo, index) => (
              <div key={photo.id} style={{ textAlign: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.preview}
                  alt={photo.caption}
                  style={{
                    width: "100%",
                    height: 180,
                    objectFit: "contain",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                  }}
                />
                <p style={{ fontSize: 9, marginTop: 4, fontWeight: "bold" }}>
                  {photo.caption || `Foto ${String(index + 1).padStart(2, "0")}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
