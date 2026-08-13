// ══════════════════════════════════════════════════════════
// auto-translate — HUI Auto-Translation Edge Function v2
// ══════════════════════════════════════════════════════════
// Uses Google Translate (unofficial) as primary,
// MyMemory as fallback. Translates DE → 6 target languages.
// ══════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const TARGET_LANGS = ["en", "fr", "es", "it", "el", "tr"];
const SOURCE_LANG = "de";

// Google Translate unofficial endpoint — free, no key, reliable
async function googleTranslate(
  text: string,
  from: string,
  to: string
): Promise<string> {
  if (from === to) return text;
  try {
    const url = `https://translate.google.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HUI/1.0)" },
    });
    if (!resp.ok) return "";
    const data = await resp.json();
    // Response format: [[["translated","original",...], ...], ...]
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0]
        .map((seg: any[]) => (Array.isArray(seg) ? seg[0] : ""))
        .join("");
      if (translated && translated.trim().length > 0) return translated.trim();
    }
    return "";
  } catch {
    return "";
  }
}

// MyMemory fallback
async function myMemoryTranslate(
  text: string,
  from: string,
  to: string
): Promise<string> {
  if (from === to) return text;
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "HUI-App/1.0" },
    });
    if (!resp.ok) return "";
    const data = await resp.json();
    const translated = data?.responseData?.translatedText;
    if (!translated || typeof translated !== "string") return "";
    // Filter MyMemory's license/warning text
    if (translated.includes("GNU General Public License")) return "";
    if (translated.startsWith("MYMEMORY WARNING")) return "";
    if (translated.includes("LICENSE")) return "";
    return translated.trim();
  } catch {
    return "";
  }
}

async function translateWithFallback(
  text: string,
  from: string,
  to: string
): Promise<string> {
  // Try Google first
  let result = await googleTranslate(text, from, to);
  if (result) return result;

  // Fallback to MyMemory
  result = await myMemoryTranslate(text, from, to);
  if (result) return result;

  // Final fallback: empty string (client will use English fallback)
  return "";
}

async function translateToAll(
  text: string
): Promise<Record<string, string>> {
  const results: Record<string, string> = { de: text };

  const promises = TARGET_LANGS.map(async (lang) => {
    const translated = await translateWithFallback(text, SOURCE_LANG, lang);
    return [lang, translated] as const;
  });

  const settled = await Promise.allSettled(promises);
  for (const result of settled) {
    if (result.status === "fulfilled") {
      const [lang, translated] = result.value;
      if (translated) results[lang] = translated;
    }
  }

  return results;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const keys = body?.keys;
    if (!Array.isArray(keys) || keys.length === 0) {
      return new Response(
        JSON.stringify({ error: "keys array required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Limit batch size
    const batch = keys.slice(0, 50);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Check which keys already exist
    const keyStrings = batch.map((k: any) => k.key);
    const { data: existing } = await supabase
      .from("i18n_translations")
      .select("*")
      .in("key", keyStrings);

    const existingMap = new Map();
    for (const row of existing ?? []) {
      existingMap.set(row.key, row);
    }

    const translations = [];
    const toTranslate = [];

    for (const item of batch) {
      const { key, sourceText, namespace = "translation" } = item;
      if (!key || !sourceText) continue;

      if (existingMap.has(key)) {
        translations.push({ key, ...existingMap.get(key) });
      } else {
        toTranslate.push(item);
      }
    }

    // Translate new keys
    for (const item of toTranslate) {
      const { key, sourceText, namespace = "translation" } = item;

      const allTranslations = await translateToAll(sourceText);

      // Store in DB
      await supabase.from("i18n_translations").upsert(
        {
          key,
          namespace,
          source_text: sourceText,
          source_lang: SOURCE_LANG,
          de: allTranslations.de,
          en: allTranslations.en || null,
          fr: allTranslations.fr || null,
          es: allTranslations.es || null,
          it: allTranslations.it || null,
          el: allTranslations.el || null,
          tr: allTranslations.tr || null,
          auto_translated: true,
        },
        { onConflict: "key" }
      );

      translations.push({
        key,
        namespace,
        de: allTranslations.de,
        en: allTranslations.en || null,
        fr: allTranslations.fr || null,
        es: allTranslations.es || null,
        it: allTranslations.it || null,
        el: allTranslations.el || null,
        tr: allTranslations.tr || null,
      });
    }

    return new Response(
      JSON.stringify({ translations }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
