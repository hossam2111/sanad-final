import OpenAI from "openai";
import type { AiDecisionResult } from "./decision-engine.js";

const openai = new OpenAI({ apiKey: process.env["OPENAI_API_KEY"] || "placeholder" });

// Gemini 2.5 Flash via OpenAI-compatible endpoint — automatic fallback
const gemini = new OpenAI({
  apiKey: process.env["GEMINI_API_KEY"] || "placeholder",
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export interface PatientContext {
  name: string;
  age: number;
  /** NEVER send to external AI providers — omitted from prompts for PDPL compliance */
  nationalId: string;
  chronicConditions: string[];
  allergies: string[];
  activeMedications: string[];
  recentLabs: Array<{ test: string; result: string; status: string; date: string }>;
  recentVisits: Array<{ date: string; type: string; diagnosis: string }>;
  decision: AiDecisionResult;
}

function buildClinicalSystemPrompt(): string {
  return `You are SANAD Clinical AI — the intelligent brain of Saudi Arabia's National AI Health Intelligence Platform.

You communicate in both Arabic and English. When the patient's name is Arabic, default to Arabic for the narrative. Otherwise use English.

Your role:
- Generate clear, concise clinical summaries for healthcare providers
- Translate complex AI decision-engine outputs into plain clinical language
- Highlight the most urgent actionable items
- Respect patient privacy — never speculate beyond provided data
- Be precise, evidence-based, and clinically appropriate

Important constraints:
- This is a demo healthcare system — treat data as real clinical data
- Always flag critical/urgent findings prominently
- Structure output for quick reading by busy clinicians
- Do not provide definitive diagnoses — you are a decision-support tool`;
}

function buildPatientPromptText(ctx: PatientContext, lang: "ar" | "en"): string {
  const { decision } = ctx;

  if (lang === "ar") {
    return `
اسم المريض: ${ctx.name}
العمر: ${ctx.age} سنة

الحالات المزمنة: ${ctx.chronicConditions.join("، ") || "لا يوجد"}
الحساسية: ${ctx.allergies.join("، ") || "لا يوجد"}
الأدوية الفعّالة: ${ctx.activeMedications.join("، ") || "لا يوجد"}

مخرجات محرك القرار الذكي:
- درجة الخطورة: ${decision.riskScore}/100 (${decision.riskLevel})
- مستوى الإلحاح: ${decision.urgency}
- الإجراء الأساسي: ${decision.primaryAction}
- النافذة الزمنية: ${decision.timeWindow}
- مستوى الثقة: ${(decision.confidence * 100).toFixed(0)}%

أسباب القرار:
${decision.whyFactors.map(f => `• ${f.factor} (تأثير: ${f.impact}): ${f.description}`).join("\n")}

توقعات المريض الرقمي (12 شهراً):
- المسار: ${decision.digitalTwin.riskTrajectory}
- درجة الخطر المتوقعة: ${decision.digitalTwin.projectedRiskScore}/100
- الحالات المتوقعة: ${decision.digitalTwin.predictedConditions.join("، ")}

التوصيات:
${decision.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}

اكتب ملخصاً سريرياً مقتضباً وواضحاً للطبيب يتضمن:
1. نظرة عامة سريعة عن حالة المريض
2. أهم النقاط العاجلة التي تستوجب التدخل الفوري
3. الخطة العلاجية المقترحة بناءً على البيانات
4. تحذيرات هامة إن وُجدت

الرد بالعربية، بأسلوب طبي واضح ومختصر.`;
  }

  return `
Patient: ${ctx.name}, Age: ${ctx.age}

Chronic Conditions: ${ctx.chronicConditions.join(", ") || "None"}
Allergies: ${ctx.allergies.join(", ") || "None"}
Active Medications: ${ctx.activeMedications.join(", ") || "None"}

AI Decision Engine Output:
- Risk Score: ${decision.riskScore}/100 (${decision.riskLevel})
- Urgency: ${decision.urgency}
- Primary Action: ${decision.primaryAction}
- Time Window: ${decision.timeWindow}
- Confidence: ${(decision.confidence * 100).toFixed(0)}%

Decision Factors:
${decision.whyFactors.map(f => `• ${f.factor} (impact: ${f.impact}): ${f.description}`).join("\n")}

Digital Twin Projection (12 months):
- Trajectory: ${decision.digitalTwin.riskTrajectory}
- Projected Risk: ${decision.digitalTwin.projectedRiskScore}/100
- Predicted Conditions: ${decision.digitalTwin.predictedConditions.join(", ")}

Recommendations:
${decision.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Write a concise clinical summary for the physician including:
1. Quick patient status overview
2. Critical items requiring immediate action
3. Suggested care plan based on the data
4. Important warnings if any

Respond in English, clinical tone, brief and scannable.`;
}

function detectLanguage(name: string): "ar" | "en" {
  return /[؀-ۿ]/.test(name) ? "ar" : "en";
}

function isQuotaError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes("429") || msg.includes("quota") || msg.includes("rate limit") || msg.includes("insufficient_quota");
  }
  return false;
}

function generateMockClinicalNarrative(ctx: PatientContext, lang: "ar" | "en"): string {
  const { decision } = ctx;
  if (lang === "ar") {
    return `### نظرة عامة على الحالة السريرية
المريض **${ctx.name}** البالغ من العمر **${ctx.age}** سنة، يعاني من **${ctx.chronicConditions.join("، ") || "لا توجد حالات مزمنة مسجلة"}** وموثق لديه حساسية من **${ctx.allergies.join("، ") || "لا توجد حساسية معروفة"}**. 

يُظهر محرك القرار السريري درجة خطورة إجمالية تبلغ **${decision.riskScore}/100** وهي مصنفة كحالة **${decision.riskLevel === "critical" ? "حرجة جداً" : decision.riskLevel === "high" ? "عالية الخطورة" : "متوسطة/منخفضة الخطورة"}**، مع مستوى إلحاح **${decision.urgency}**.

### أهم النقاط العاجلة والتدخلات
* **التشخيص الحالي**: يتطلب متابعة دقيقة ومستمرة لحالة **${ctx.chronicConditions.join(" و ") || "المريض الصحية"}**.
* **الخطة العلاجية الدوائية**: يتناول المريض أدوية فعالة تشمل **${ctx.activeMedications.join("، ") || "لا توجد أدوية نشطة مسجلة"}**. يجب التأكد من عدم وجود تداخلات مع أي أدوية جديدة.
* **الإجراء الأساسي المطلوب**: **${decision.primaryAction}** خلال نافذة زمنية قدرها **${decision.timeWindow}** بمستوى ثقة **${(decision.confidence * 100).toFixed(0)}%**.

### أسباب اتخاذ القرار الذكي
${decision.whyFactors.map(f => `* **${f.factor}** (الأثر: ${f.impact}): ${f.description}`).join("\n")}

### محاكاة التوأم الرقمي (Digital Twin) خلال 12 شهراً
تشير توقعات التوأم الرقمي إلى مسار خطورة **${decision.digitalTwin.riskTrajectory === "worsening" || decision.digitalTwin.riskTrajectory === "rapidly_worsening" ? "متدهور" : decision.digitalTwin.riskTrajectory === "stable" ? "مستقر" : "متحسن"}** مع احتمال تطور حالات إضافية مثل **${decision.digitalTwin.predictedConditions.join("، ") || "لا توجد حالات متوقعة"}**، ودرجة خطورة متوقعة تصل إلى **${decision.digitalTwin.projectedRiskScore}/100**.

### توصيات خطة الرعاية الصحية
${decision.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}`;
  }

  return `### Clinical Overview
Patient **${ctx.name}**, **${ctx.age}** years old, is managed for **${ctx.chronicConditions.join(", ") || "no chronic conditions"}** and has documented allergies to **${ctx.allergies.join(", ") || "no known allergies"}**.

The Clinical Decision Engine reports an overall risk score of **${decision.riskScore}/100** (**${decision.riskLevel}**), with an urgency level of **${decision.urgency}**.

### Critical Findings & Required Actions
* **Clinical Presentation**: Requires close monitoring for **${ctx.chronicConditions.join(", ") || "general health status"}**.
* **Active Pharmacotherapy**: Currently prescribed **${ctx.activeMedications.join(", ") || "no active medications"}**. Review carefully for potential drug-drug interactions.
* **Primary Recommendation**: **${decision.primaryAction}** within a time window of **${decision.timeWindow}** (AI confidence: **${(decision.confidence * 100).toFixed(0)}%**).

### Decision Rationale
${decision.whyFactors.map(f => `* **${f.factor}** (Impact: ${f.impact}): ${f.description}`).join("\n")}

### 12-Month Digital Twin Projection
The Digital Twin simulation projects a **${decision.digitalTwin.riskTrajectory}** trajectory. The projected risk score is **${decision.digitalTwin.projectedRiskScore}/100**, with a potential risk of developing: **${decision.digitalTwin.predictedConditions.join(", ") || "none"}**.

### Recommended Care Plan
${decision.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}`;
}

/** Stream a clinical narrative — tries OpenAI first, falls back to Gemini 2.5 Flash on quota errors */
export async function streamClinicalNarrative(
  ctx: PatientContext,
  onChunk: (text: string, provider: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): Promise<void> {
  const lang = detectLanguage(ctx.name);

  const hasRealKeys = 
    (process.env["OPENAI_API_KEY"] && process.env["OPENAI_API_KEY"] !== "placeholder") ||
    (process.env["GEMINI_API_KEY"] && process.env["GEMINI_API_KEY"] !== "placeholder");

  if (!hasRealKeys) {
    const narrative = generateMockClinicalNarrative(ctx, lang);
    const chunks = narrative.split(" ");
    let i = 0;
    const interval = setInterval(() => {
      if (i < chunks.length) {
        onChunk(chunks[i] + " ", "SANAD Clinical AI (Demo Mode)");
        i++;
      } else {
        clearInterval(interval);
        onDone();
      }
    }, 20);
    return;
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: buildClinicalSystemPrompt() },
    { role: "user", content: buildPatientPromptText(ctx, lang) },
  ];

  const tryStream = async (client: OpenAI, model: string, provider: string) => {
    const stream = await client.chat.completions.create({ model, max_tokens: 1024, stream: true, messages });
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) onChunk(text, provider);
    }
    onDone();
  };

  // Gemini is primary (free quota), OpenAI is the fallback for the demo
  const useGeminiFirst = !!process.env["GEMINI_API_KEY"] && process.env["GEMINI_API_KEY"] !== "placeholder";

  if (useGeminiFirst) {
    try {
      await tryStream(gemini, "gemini-2.5-flash", "Gemini 2.5 Flash");
    } catch (err) {
      if (process.env["OPENAI_API_KEY"] && process.env["OPENAI_API_KEY"] !== "placeholder") {
        try {
          await tryStream(openai, "gpt-4o", "OpenAI GPT-4o");
        } catch (openaiErr) {
          onError(openaiErr instanceof Error ? openaiErr : new Error(String(openaiErr)));
        }
      } else {
        onError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  } else {
    try {
      await tryStream(openai, "gpt-4o", "OpenAI GPT-4o");
    } catch (err) {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}

/** Single-turn Q&A — tries OpenAI first, falls back to Gemini on quota errors */
export async function askClinicalQuestion(
  ctx: PatientContext,
  question: string,
): Promise<string> {
  const lang = detectLanguage(ctx.name);

  const hasRealKeys = 
    (process.env["OPENAI_API_KEY"] && process.env["OPENAI_API_KEY"] !== "placeholder") ||
    (process.env["GEMINI_API_KEY"] && process.env["GEMINI_API_KEY"] !== "placeholder");

  if (!hasRealKeys) {
    const isArabic = lang === "ar";
    if (isArabic) {
      return `بناءً على استفسارك الموجه للنظام حول المريض **${ctx.name}**:\n\n- المريض يعاني حالياً من **${ctx.chronicConditions.join("، ") || "لا توجد حالات مسجلة"}**.\n- يُظهر تحليل الذكاء الاصطناعي درجة خطورة **${ctx.decision.riskScore}/100** ومستوى إلحاح **${ctx.decision.urgency}**.\n- الإجراء الموصى به هو: **${ctx.decision.primaryAction}**.\n\nتوصية سريرية: يرجى متابعة المريض لضمان الالتزام بالأدوية وفحص المؤشرات الحيوية بانتظام. (تشغيل تجريبي - بدون اتصال بالمزود)`;
    } else {
      return `Based on your clinical inquiry regarding patient **${ctx.name}**:\n\n- The patient is managed for **${ctx.chronicConditions.join(", ") || "no chronic conditions"}**.\n- AI risk analysis shows a risk score of **${ctx.decision.riskScore}/100** with an urgency of **${ctx.decision.urgency}**.\n- Recommended Action: **${ctx.decision.primaryAction}**.\n\nClinical advisory: Regular check-ups and monitoring of vital signs are highly recommended to prevent acute complications. (Demo Mode)`;
    }
  }

  const contextSummary =
    lang === "ar"
      ? `المريض: ${ctx.name}، ${ctx.age} سنة\nالحالات: ${ctx.chronicConditions.join("، ")}\nدرجة الخطر: ${ctx.decision.riskScore}/100 (${ctx.decision.riskLevel})\nالإلحاح: ${ctx.decision.urgency}`
      : `Patient: ${ctx.name}, ${ctx.age}y\nConditions: ${ctx.chronicConditions.join(", ")}\nRisk: ${ctx.decision.riskScore}/100 (${ctx.decision.riskLevel})\nUrgency: ${ctx.decision.urgency}`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: buildClinicalSystemPrompt() },
    { role: "user", content: `${contextSummary}\n\n${question}` },
  ];

  const tryAsk = async (client: OpenAI, model: string) => {
    const response = await client.chat.completions.create({ model, max_tokens: 512, messages });
    return response.choices[0]?.message?.content ?? "No response generated.";
  };

  // Gemini is primary (free quota), OpenAI is the fallback
  const useGeminiFirst = !!process.env["GEMINI_API_KEY"] && process.env["GEMINI_API_KEY"] !== "placeholder";
  if (useGeminiFirst) {
    try {
      return await tryAsk(gemini, "gemini-2.5-flash");
    } catch {
      if (process.env["OPENAI_API_KEY"] && process.env["OPENAI_API_KEY"] !== "placeholder") return await tryAsk(openai, "gpt-4o");
      throw new Error("All AI providers unavailable");
    }
  }
  return await tryAsk(openai, "gpt-4o");
}
