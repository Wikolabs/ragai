import { NextResponse } from "next/server";
import { chat, isConfigured } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT_FR = `Tu es RAGAI, un agent IA de Q&A documentaire base sur RAG (Retrieval Augmented Generation). Tu reponds en langage naturel a partir d'une base documentaire fictive, et tu cites systematiquement des sources realistes (document, page, paragraphe).

Format de sortie exact en MARKDOWN :
**📖 Reponse**
[2-4 phrases concises qui repondent directement a la question, ton neutre et factuel]

**📌 Sources citees**
- [Nom_document.pdf, p.X, §Y — extrait court d'1 ligne entre guillemets]
- [Nom_document2.pdf, p.X, §Y — extrait court d'1 ligne]
- [3-4 sources au total, inventees mais coherentes avec la collection demandee]

**🔍 Confiance**
- Score : XX% (entre 75 et 96)
- [1 phrase sur les eventuelles ambiguites ou limites de la reponse]

Tu DOIS inventer des sources realistes pour la demo (jamais "je n'ai pas access aux documents"). Tu joues le role d'un agent RAG qui a deja indexe la collection mentionnee. Reste sobre, factuel, evite le marketing. Maximum 280 mots.`;

const SYSTEM_PROMPT_EN = `You are RAGAI, an AI document Q&A agent built on RAG (Retrieval Augmented Generation). You answer in natural language from a fictional document corpus, and you systematically cite realistic sources (document, page, paragraph).

Exact MARKDOWN output format:
**📖 Answer**
[2-4 concise sentences that directly answer the question, neutral and factual tone]

**📌 Cited sources**
- [Document_name.pdf, p.X, §Y — short 1-line quote in quotation marks]
- [Document_name2.pdf, p.X, §Y — short 1-line quote]
- [3-4 sources total, invented but coherent with the requested collection]

**🔍 Confidence**
- Score: XX% (between 75 and 96)
- [1 sentence on any ambiguities or limits of the answer]

You MUST invent realistic sources for the demo (never "I don't have access to documents"). You play the role of a RAG agent that has already indexed the mentioned collection. Stay sober, factual, avoid marketing. Maximum 280 words.`;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const question: string = typeof body.question === "string" ? body.question.slice(0, 600) : "";
    const collection: string = typeof body.collection === "string" ? body.collection.slice(0, 120) : "";
    const lang: "fr" | "en" = body.lang === "en" ? "en" : "fr";

    if (!question.trim()) {
      return NextResponse.json(
        { error: lang === "fr" ? "Entrez une question." : "Enter a question." },
        { status: 400 }
      );
    }

    if (!isConfigured()) {
      return NextResponse.json(
        {
          error: "llm_not_configured",
          message: lang === "fr"
            ? "Demo en mode statique — la cle LLM sera configuree au prochain deploiement."
            : "Static demo mode — LLM key will be configured at next deploy.",
          mockBrief: buildMockAnswer(question, collection, lang),
        },
        { status: 200 }
      );
    }

    const col = collection.trim() || (lang === "fr" ? "documentation_interne" : "internal_documentation");
    const userMsg = lang === "fr"
      ? `Collection indexee : "${col}". Question utilisateur : "${question}". Reponds en citant des sources realistes coherentes avec cette collection.`
      : `Indexed collection: "${col}". User question: "${question}". Answer with realistic sources coherent with this collection.`;

    const { text, model } = await chat(
      [
        { role: "system", content: lang === "fr" ? SYSTEM_PROMPT_FR : SYSTEM_PROMPT_EN },
        { role: "user", content: userMsg },
      ],
      900
    );

    return NextResponse.json({ brief: text, model, generatedAt: new Date().toISOString() });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function buildMockAnswer(question: string, collection: string, lang: "fr" | "en"): string {
  const col = collection.trim() || (lang === "fr" ? "documentation_interne" : "internal_documentation");
  if (lang === "en") {
    return `**📖 Answer**\nBased on the indexed corpus "${col}", the answer to "${question}" is documented in two primary policy documents. The relevant clause specifies a 30-day notice window and requires explicit written approval from the line manager. Section 3.2 also notes an exception for compliance-sensitive contexts.\n\n**📌 Cited sources**\n- ${col}_policy_v4.pdf, p.12, §3.2 — "Notice period shall not exceed 30 business days"\n- ${col}_handbook_2025.pdf, p.47, §8.1 — "Written approval required from direct line manager"\n- governance_charter.pdf, p.5, §1.4 — "Compliance exceptions apply per Appendix C"\n\n**🔍 Confidence**\n- Score: 89%\n- Slight ambiguity on the compliance exception scope — see Appendix C for full conditions.`;
  }
  return `**📖 Reponse**\nD'apres la collection indexee "${col}", la reponse a "${question}" est documentee dans deux documents de politique principaux. La clause pertinente specifie un delai de 30 jours et exige une approbation ecrite explicite du manager direct. La section 3.2 mentionne aussi une exception pour les contextes sensibles a la conformite.\n\n**📌 Sources citees**\n- ${col}_politique_v4.pdf, p.12, §3.2 — "Le delai de preavis ne peut exceder 30 jours ouvres"\n- ${col}_manuel_2025.pdf, p.47, §8.1 — "Approbation ecrite requise du manager direct"\n- charte_gouvernance.pdf, p.5, §1.4 — "Exceptions de conformite selon Annexe C"\n\n**🔍 Confiance**\n- Score : 89%\n- Legere ambiguite sur le perimetre de l'exception conformite — voir Annexe C.`;
}
