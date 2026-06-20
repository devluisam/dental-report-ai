import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === "sua-chave-aqui") {
    return NextResponse.json(
      { error: "Chave da API não configurada. Edite o arquivo .env.local e reinicie o servidor." },
      { status: 500 }
    );
  }

  const client = new Anthropic({ apiKey });

  try {
    const formData = await req.formData();
    const files = formData.getAll("images") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "Nenhuma imagem enviada" }, { status: 400 });
    }

    const imageContents: Anthropic.ImageBlockParam[] = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        const mediaType = (file.type || "image/jpeg") as
          | "image/jpeg"
          | "image/png"
          | "image/gif"
          | "image/webp";
        return {
          type: "image" as const,
          source: { type: "base64" as const, media_type: mediaType, data: base64 },
        };
      })
    );

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: `Você é um assistente especializado em extrair dados de documentos odontológicos de estágio da FAMETRO.
Analise as imagens fornecidas e extraia todos os dados relevantes para preencher o relatório.
Retorne APENAS um JSON válido, sem markdown, sem explicações, com esta estrutura exata:
{
  "disciplina": "",
  "aluno": "",
  "matricula": "",
  "cidade": "Manaus - AM",
  "periodo": "",
  "dataInicio": "",
  "dataFim": "",
  "patients": [
    {
      "nome": "",
      "idade": "",
      "endereco": "",
      "contato": "",
      "situacao": "em_tratamento"
    }
  ],
  "productivity": {
    "anamnese": 0,
    "fluor": 0,
    "selamento": 0,
    "restauracaoProvisoria": 0,
    "restauracaoDefinitiva": 0,
    "raspagem_supra": 0,
    "raspagem_sub": 0,
    "exodontias": 0,
    "moldagem": 0,
    "endodontia": 0,
    "protese_parcial": 0,
    "protese_parcial_provisoria": 0,
    "provisorio": 0,
    "protese_fixa": 0,
    "cirurgia_tecidos": 0
  }
}

Regras:
- situacao deve ser exatamente um de: "em_tratamento", "tratamento_concluido", "abandono", "paciente_avulso"
- dataInicio e dataFim devem estar no formato YYYY-MM-DD se encontradas, senão deixe vazio
- Se um campo não for encontrado nas imagens, deixe vazio ou 0
- Extraia todos os pacientes que encontrar nas fichas
- Para produtividade, some os procedimentos de todas as fichas encontradas`,
      messages: [
        {
          role: "user",
          content: [
            ...imageContents,
            {
              type: "text",
              text: "Extraia todos os dados dessas fichas/documentos de estágio odontológico e retorne o JSON.",
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "A IA não retornou dados estruturados. Tente com imagens mais nítidas." },
        { status: 422 }
      );
    }

    const extracted = JSON.parse(jsonMatch[0]);
    return NextResponse.json(extracted);
  } catch (err: unknown) {
    console.error("Extraction error:", err);
    const message =
      err instanceof Error ? err.message : "Erro desconhecido ao processar as imagens";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
