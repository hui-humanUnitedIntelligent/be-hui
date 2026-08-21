// supabase/functions/moderate-content/index.ts
// ═══════════════════════════════════════════════════════════════════
// CONTENT-MODERATION-001 — Automatische Erkennung gefährlicher Inhalte
// (2026-08-20, additiv, kein bestehender Flow wird verändert)
// UPDATE CONTENT-MODERATION-003 (2026-08-21):
//   - Erweiterte, kategorisierte interne Wortliste (Fluchwörter,
//     Extremismus, Rassismus, Sexismus, Gewaltverherrlichung, CSAM-Risiko)
//   - Text-Normalisierung (Umlaute, einfaches Leetspeak z.B. "sch3iss")
//   - OCR: Google Vision TEXT_DETECTION liest Text AUS Bildern und prüft
//     ihn ebenfalls gegen die Wortliste (z.B. Screenshot mit Hassrede)
//
// Prüft Moment-Uploads (Bild/Video-Thumbnail + Text) automatisch auf:
//   - Sexistische/pornografische Inhalte  (Google Vision SafeSearch: adult/racy)
//   - Gewalt/gefährliche Inhalte           (Google Vision SafeSearch: violence)
//   - Fluchwörter, Hassrede, Rassismus, Sexismus, Extremismus im Text
//     (Keyword-Filter, DE-Fokus, additiv erweiterbar)
//   - Denselben Text-Filter auf Text, der VIA OCR aus Bildern erkannt wurde
//
// Ablauf:
//   1. Client (HuiMomentSheet.jsx) ruft diese Function NACH dem Upload,
//      VOR dem finalen Insert in `beitraege` auf.
//   2. Bei is_flagged=true: Client postet NICHT (MODERATION-HARD-BLOCK-001).
//      Medien bleiben im Storage erhalten (Beweis für SADB-Admin-Review).
//   3. Jedes Ergebnis wird in `content_moderation` protokolliert (SSOT
//      für das SADB "Inhaltsprüfung"-Dashboard) + Event-Log in
//      `content_moderation_events`.
//   4. confidence_score < 0.7 -> is_false_positive=true (Admin-Hinweis
//      "Möglicher Fehlalarm"). Keyword-Treffer haben immer >= 0.85.
//   5. CSAM-Risiko-Treffer -> admin_status='urgent_review' (höchste Prio).
// ═══════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ═══════════════════════════════════════════════════════════════════
// INTERNE WORTLISTE — kategorisiert (additiv erweiterbar)
// Basis: Deutsch (Haupt-Nutzersprache), gängige englische Slurs/Begriffe
// ergänzend. Bewusst als .includes()-Substring-Match (wie bisher) statt
// Wortgrenzen-Regex, da deutsche Komposita (z.B. "Scheißapp") sonst
// durchrutschen würden. Trade-off: seltene False-Positives möglich ->
// dafür existiert admin_status='pending' + SADB-Freigabe-Workflow.
// ═══════════════════════════════════════════════════════════════════

const KEYWORD_CATEGORIES = {
  // Fluchwörter / Beleidigungen
  profanity: [
    'scheiss', 'scheiße', 'scheisse', 'verarsch', 'wichser', 'wixer',
    'arschloch', 'arschgeige', 'hurensohn', 'missgeburt', 'drecksau',
    'mistkerl', 'bastard', 'miststück', 'vollidiot', 'kackbratze',
    'trottel', 'wichsen', 'fick dich', 'fick ab', 'leck mich',
    'dumme fotze', 'blöde kuh', 'hackfresse', 'penner',
  ],
  // Extremismus
  extremism: [
    'heil hitler', 'sieg heil', 'nazi', 'hitler hatte recht',
    'hakenkreuz', '1488', '18/88', 'ss-mann', 'arische rasse',
    'weiße rasse überlegen', 'umvolkung', 'rassenkrieg', 'reichsbürger',
    'volksverrat', 'holocaust leugn', 'kz-lüge', 'endsieg',
    'white power', 'kkk', 'ku klux klan',
  ],
  // Rassismus
  racism: [
    'nigger', 'neger', 'kanacke', 'untermensch', 'abschaum',
    'ungeziefer', 'zigeuner', 'schlitzauge', 'kameltreiber',
    'ausländer raus', 'scheiß türke', 'scheiß araber', 'scheiß polacke',
    'mischling', 'köpfe rollen für', 'rasse minderwertig',
  ],
  // Sexismus
  sexism: [
    'schlampe', 'nutte', 'hure', 'fotze', 'schwuchtel',
    'frauen gehören in die küche', 'frauen können nicht',
    'geh zurück an den herd', 'dumme frau', 'weiber taugen nichts',
  ],
  // Gewaltverherrlichung / Drohungen
  violence: [
    'ich bring dich um', 'ich töte dich', 'stirb', 'erschieß',
    'abknallen', 'abstechen', 'bombenanschlag', 'amoklauf',
    'blut soll fließen', 'massaker feiern', 'köpfen wir',
    'ich mach dich fertig', 'schlitz dir die kehle',
  ],
  // CSAM-Risiko — höchste Priorität, immer urgent_review
  csam_risk: [
    'vergewaltig', 'kinderschänder', 'pedo', 'pädo', 'kinderporn',
    'minderjährige nackt', 'kind sexuell',
  ],
}

// Alle Kategorien zu einer durchsuchbaren Liste mit Kategorie-Zuordnung
const FLAT_KEYWORDS = Object.entries(KEYWORD_CATEGORIES).flatMap(([category, words]) =>
  words.map((word) => ({ word, category }))
)

// ── Text-Normalisierung: Umlaute + einfaches Leetspeak abfangen ──
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
    .replace(/[@]/g, 'a')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/\$/g, 's')
}

function checkTextModeration(text) {
  if (!text) return { flags: [], confidence: 0, isCsamRisk: false, matchedCategories: [] }
  const normalized = normalizeText(text)
  const matchedCategories = new Set()
  let isCsamRisk = false

  for (const { word, category } of FLAT_KEYWORDS) {
    const normalizedWord = normalizeText(word)
    if (normalized.includes(normalizedWord)) {
      matchedCategories.add(category)
      if (category === 'csam_risk') isCsamRisk = true
    }
  }

  const flags = Array.from(matchedCategories)
  // csam_risk zusätzlich immer auch als 'hate_speech' für Rückwärtskompatibilität
  // mit älteren SADB-Badge-Anzeigen markieren
  if (flags.length > 0 && !flags.includes('hate_speech') && (flags.includes('racism') || flags.includes('extremism'))) {
    flags.push('hate_speech')
  }

  return {
    flags,
    confidence: isCsamRisk ? 1.0 : (flags.length > 0 ? 0.9 : 0),
    isCsamRisk,
    matchedCategories: Array.from(matchedCategories),
  }
}

async function getGoogleVisionToken(saKeyB64) {
  try {
    const sa = JSON.parse(atob(saKeyB64))
    const now = Math.floor(Date.now() / 1000)
    const header = { alg: 'RS256', typ: 'JWT', kid: sa.private_key_id }
    const payload = {
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-vision',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }
    const enc = (obj) =>
      btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const toSign = `${enc(header)}.${enc(payload)}`

    const pemBody = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')
    const binaryKey = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0))
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const sigBuf = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(toSign)
    )
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const jwt = `${toSign}.${sigB64}`

    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    })
    const tokenData = await tokenResp.json()
    return tokenData.access_token || null
  } catch (e) {
    console.error('[moderate-content] Google auth error:', e)
    return null
  }
}

// ── Google Vision: SafeSearch (Bild-Inhalt) + TEXT_DETECTION (OCR) ──
async function checkImageModeration(mediaUrl, saKeyB64) {
  try {
    const accessToken = await getGoogleVisionToken(saKeyB64)
    if (!accessToken) return { flags: [], confidence: 0, details: {}, ocrText: '', ocrFlags: [] }

    const imgResp = await fetch(mediaUrl)
    const imgBuf = await imgResp.arrayBuffer()
    const imgB64 = btoa(String.fromCharCode(...new Uint8Array(imgBuf)))

    const visionResp = await fetch('https://vision.googleapis.com/v1/images:annotate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: imgB64 },
          features: [
            { type: 'SAFE_SEARCH_DETECTION' },
            { type: 'TEXT_DETECTION' }, // OCR — liest Text AUS dem Bild (z.B. Screenshots)
          ],
        }],
      }),
    })
    const visionData = await visionResp.json()
    const response0 = visionData?.responses?.[0] || {}
    const safeSearch = response0.safeSearchAnnotation || {}

    const flagMap = { adult: 'sexual_content', racy: 'sexual_content', violence: 'violence' }
    const highRisk = ['POSSIBLE', 'LIKELY', 'VERY_LIKELY']
    const flags = []
    let confidence = 0
    for (const key in flagMap) {
      const value = safeSearch[key]
      if (value && highRisk.includes(value)) {
        if (!flags.includes(flagMap[key])) flags.push(flagMap[key])
        if (value === 'VERY_LIKELY') confidence = Math.max(confidence, 0.95)
        else if (value === 'LIKELY') confidence = Math.max(confidence, 0.85)
        else confidence = Math.max(confidence, 0.6)
      }
    }

    // OCR-Text extrahieren: fullTextAnnotation.text enthält den gesamten erkannten Text
    const ocrText = response0.fullTextAnnotation?.text || response0.textAnnotations?.[0]?.description || ''

    return { flags, confidence, details: safeSearch, ocrText }
  } catch (e) {
    console.error('[moderate-content] Vision API error:', e)
    return { flags: [], confidence: 0, details: {}, ocrText: '' }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { content_id, content_type = 'moment', user_id, media_url, media_type, text, device_info } = body

    if (!user_id) {
      return new Response(JSON.stringify({ success: false, error: 'user_id erforderlich' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const textResult = checkTextModeration(text)

    let imageFlags = []
    let imageConfidence = 0
    let imageDetails = {}
    let ocrResult = { flags: [], confidence: 0, isCsamRisk: false }
    let ocrText = ''
    const saKey = Deno.env.get('GOOGLE_VISION_SA_KEY')
    if (media_url && saKey && (media_type === 'image' || media_type === 'foto' || media_type === 'video')) {
      const imgResult = await checkImageModeration(media_url, saKey)
      imageFlags = imgResult.flags
      imageConfidence = imgResult.confidence
      imageDetails = imgResult.details
      ocrText = imgResult.ocrText || ''
      if (ocrText) {
        ocrResult = checkTextModeration(ocrText)
      }
    }

    const allFlags = [...new Set([...textResult.flags, ...imageFlags, ...ocrResult.flags])]
    const maxConfidence = Math.max(textResult.confidence, imageConfidence, ocrResult.confidence)
    const isFlagged = allFlags.length > 0
    const isBlurred = isFlagged
    const isCsamRisk = textResult.isCsamRisk || ocrResult.isCsamRisk
    const isFalsePositive = isFlagged && !isCsamRisk && maxConfidence < 0.7

    let detectionSource = 'none'
    if (imageFlags.length > 0 && (textResult.flags.length > 0 || ocrResult.flags.length > 0)) {
      detectionSource = 'google_vision+keyword_filter'
    } else if (imageFlags.length > 0) {
      detectionSource = 'google_vision'
    } else if (ocrResult.flags.length > 0) {
      detectionSource = 'ocr_keyword_filter'
    } else if (textResult.flags.length > 0) {
      detectionSource = 'keyword_filter'
    }

    const events = []
    if (isFlagged) events.push('content_flagged')
    if (isBlurred) events.push('content_blurred')
    if (isFalsePositive) events.push('content_false_positive')
    if (isCsamRisk) events.push('csam_risk_urgent')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } }
    )

    // ── Ergebnis protokollieren (SSOT für SADB Inhaltsprüfung) ──
    const { data: modRow, error: modErr } = await supabase
      .from('content_moderation')
      .insert({
        content_id: content_id || null,
        content_type,
        user_id,
        media_url: media_url || null,
        media_type: media_type || null,
        text_content: text || (ocrText ? `[OCR erkannt]: ${ocrText.slice(0, 500)}` : null),
        is_flagged: isFlagged,
        is_blurred: isBlurred,
        is_false_positive: isFalsePositive,
        detection_source: detectionSource,
        flag_categories: allFlags,
        confidence_score: maxConfidence,
        detection_details: { ...imageDetails, ocr_text_detected: !!ocrText },
        events,
        device_info: device_info || {},
        admin_status: isCsamRisk ? 'urgent_review' : (isFlagged ? 'pending' : 'cleared'),
      })
      .select('id')
      .single()

    if (modErr) console.error('[moderate-content] Insert error:', modErr)

    if (modRow?.id && events.length > 0) {
      await supabase.from('content_moderation_events').insert(
        events.map((event_type) => ({ moderation_id: modRow.id, event_type, event_data: { flags: allFlags, confidence: maxConfidence } }))
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        is_flagged: isFlagged,
        is_blurred: isBlurred,
        is_false_positive: isFalsePositive,
        flag_categories: allFlags,
        confidence_score: maxConfidence,
        moderation_id: modRow?.id || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[moderate-content] Fatal error:', error)
    return new Response(JSON.stringify({ success: false, error: String(error), is_flagged: false, is_blurred: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

  // ── Rate Limiting (SCALE-006) ──
  const _rl = await checkRateLimit(req, "moderate-content", 10, 60);
  if (!_rl.allowed) return rateLimitResponse(_rl.resetAt);
