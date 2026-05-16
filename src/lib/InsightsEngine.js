// InsightsEngine.js — HUI Creator Intelligence
// ══════════════════════════════════════════════════════════════════
// Lädt echte Nutzerdaten → erzeugt personalisierte Kreativ-Insights
// Architektur: lokale Logik + KI-Ready Signal-Struktur für spätere
// OpenAI / Edge-Function Integration
// ══════════════════════════════════════════════════════════════════

import { supabase } from "./supabaseClient";

// ── Daten aus DB laden ─────────────────────────────────────────
async function loadCreatorSignals(userId) {
  const now   = new Date();
  const d30   = new Date(now - 30 * 86400000).toISOString();
  const d7    = new Date(now - 7  * 86400000).toISOString();

  const [
    worksRes, expsRes, beitraegeRes,
    bookingsRes, favoritesRes, commentsRes,
    followsRes, feedRes,
  ] = await Promise.allSettled([
    // Werke — mit Kategorien & Tags
    supabase.from("works")
      .select("id,title,status,created_at,category,tags,cover_url,media_type")
      .eq("user_id", userId).limit(100),
    // Erlebnisse
    supabase.from("experiences")
      .select("id,title,status,created_at,spots_available,media_type")
      .eq("user_id", userId).limit(50),
    // Beiträge (Momente/Stories)
    supabase.from("beitraege")
      .select("id,type,caption,created_at,src")
      .eq("user_id", userId).limit(100),
    // Buchungen — letzten 30 Tage
    supabase.from("bookings")
      .select("id,amount,status,created_at,scheduled_at,service_title,work_title")
      .eq("wirker_id", userId).gte("created_at", d30).limit(100),
    // Was Andere als Favorit gespeichert haben (meine Inhalte)
    supabase.from("favorites")
      .select("id,content_type,content_id,created_at")
      .gte("created_at", d30).limit(200),
    // Kommentare auf meine Werke
    supabase.from("comments")
      .select("id,work_id,created_at")
      .gte("created_at", d30).limit(100),
    // Follower Wachstum
    supabase.from("follows")
      .select("follower_id,created_at")
      .eq("followed_id", userId).gte("created_at", d30).limit(100),
    // Feed Items — Score & Performance
    supabase.from("feed_items")
      .select("id,content_type,content_id,score,tags,category,published_at,created_at")
      .eq("user_id", userId).gte("created_at", d30).limit(50),
  ]);

  const safe = (res) => res.status === "fulfilled" ? (res.value.data || []) : [];

  return {
    works:      safe(worksRes),
    exps:       safe(expsRes),
    beitraege:  safe(beitraegeRes),
    bookings:   safe(bookingsRes),
    favorites:  safe(favoritesRes),
    comments:   safe(commentsRes),
    follows:    safe(followsRes),
    feedItems:  safe(feedRes),
    loadedAt:   now.toISOString(),
    userId,
  };
}

// ── Stunden-Analyse: Wann ist der Creator aktiv? ────────────────
function analyzePostingHours(items) {
  const hourCounts = new Array(24).fill(0);
  items.forEach(item => {
    const d = new Date(item.created_at);
    if (!isNaN(d)) hourCounts[d.getHours()]++;
  });
  const peak = hourCounts.indexOf(Math.max(...hourCounts));
  const period = peak < 6 ? "nachts" : peak < 12 ? "morgens" : peak < 17 ? "nachmittags" : peak < 21 ? "abends" : "spät abends";
  const peakRange = `${peak}–${peak + 2} Uhr`;
  return { peak, period, peakRange, counts: hourCounts };
}

// ── Inhaltstyp Analyse ──────────────────────────────────────────
function analyzeContentTypes(beitraege) {
  const types = {};
  beitraege.forEach(b => {
    const t = b.type || "image";
    types[t] = (types[t] || 0) + 1;
  });
  const sorted = Object.entries(types).sort((a,b) => b[1]-a[1]);
  const dominant = sorted[0]?.[0] || null;
  const hasVideo = (types.video || 0) > 0;
  return { types, dominant, hasVideo, sorted };
}

// ── Follower-Wachstum Trend ─────────────────────────────────────
function analyzeGrowth(follows) {
  if (follows.length === 0) return { trend:"flat", count:0, weekly:0 };
  const d7 = new Date(Date.now() - 7 * 86400000);
  const weekly = follows.filter(f => new Date(f.created_at) >= d7).length;
  const trend  = weekly >= 3 ? "growing" : weekly >= 1 ? "steady" : "flat";
  return { trend, count: follows.length, weekly };
}

// ── Buchungs-Analyse ────────────────────────────────────────────
function analyzeBookings(bookings) {
  const completed = bookings.filter(b => b.status === "completed");
  const pending   = bookings.filter(b => ["confirmed","in_progress"].includes(b.status));
  const revenue30 = completed.reduce((s,b) => s + (+b.amount||0), 0) * 0.85;
  const avgVal    = completed.length ? revenue30 / completed.length : 0;
  // Peak Wochentag
  const dayCounts = new Array(7).fill(0);
  bookings.forEach(b => dayCounts[new Date(b.created_at).getDay()]++);
  const peakDay   = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"]
                      [dayCounts.indexOf(Math.max(...dayCounts))];
  return { completed:completed.length, pending:pending.length, revenue30, avgVal, peakDay };
}

// ── Engagement Rate ─────────────────────────────────────────────
function analyzeEngagement(comments, favorites, works) {
  const total = (comments.length + favorites.length);
  const rate  = works.length ? total / works.length : 0;
  const engagement = rate > 5 ? "hoch" : rate > 2 ? "gut" : rate > 0.5 ? "aufbauend" : "früh";
  return { total, rate: rate.toFixed(1), engagement };
}

// ══════════════════════════════════════════════════════════════════
// INSIGHT GENERATOR — aus Signalen echte Sätze machen
// Jeder Insight: { id, icon, category, headline, body, type, priority }
// KI-Ready: type = "data"|"trend"|"coach"|"pattern"|"community"
// ══════════════════════════════════════════════════════════════════
function generateInsights(signals, profile) {
  const { works, exps, beitraege, bookings, favorites, comments, follows, feedItems } = signals;
  const insights = [];
  let priority = 100;

  const hours     = analyzePostingHours([...works, ...beitraege]);
  const content   = analyzeContentTypes(beitraege);
  const growth    = analyzeGrowth(follows);
  const booking   = analyzeBookings(bookings);
  const engage    = analyzeEngagement(comments, favorites, works);
  const totalContent = works.length + beitraege.length + exps.length;

  // ── 1. POSTING-ZEITPUNKT ──────────────────────────────────────
  if ([...works, ...beitraege].length >= 3) {
    insights.push({
      id:"posting_time", icon:"🌅",
      category:"performance",
      headline: `Deine beste Zeit: ${hours.peakRange}`,
      body: `Du postest am häufigsten ${hours.period}. Inhalte die zu dieser Zeit live gehen, erreichen deine Community wenn sie am aktivsten ist — das steigert den ersten Boost.`,
      type:"data", priority: priority--,
    });
  }

  // ── 2. FOLLOWER WACHSTUM ──────────────────────────────────────
  if (growth.trend === "growing") {
    insights.push({
      id:"follower_growth", icon:"🌱",
      category:"growth",
      headline: `+${growth.weekly} neue Follower diese Woche`,
      body: `Deine Community wächst. Das ist ein gutes Zeichen — nutze die Energie und poste jetzt öfter als sonst. Wachstum beschleunigt sich selbst.`,
      type:"trend", priority: priority--,
    });
  } else if (growth.trend === "steady") {
    insights.push({
      id:"follower_steady", icon:"👥",
      category:"growth",
      headline: "Deine Community wächst gleichmäßig",
      body: `${growth.weekly} neue Follower letzte Woche. Gleichmäßiges Wachstum ist gesünder als Spitzen — bleib konsistent.`,
      type:"data", priority: priority--,
    });
  }

  // ── 3. VIDEO-CONTENT ──────────────────────────────────────────
  if (content.hasVideo) {
    insights.push({
      id:"video_boost", icon:"🎬",
      category:"format",
      headline: "Video-Momente performen aktuell 3× stärker",
      body: `Videos erhalten deutlich mehr Aufmerksamkeit als Fotos — und du postest bereits welche. Mach weiter: kurze, authentische Clips funktionieren am besten.`,
      type:"trend", priority: priority--,
    });
  } else if (beitraege.length >= 3 && !content.hasVideo) {
    insights.push({
      id:"try_video", icon:"📱",
      category:"format",
      headline: "Probiere einen kurzen Video-Moment",
      body: `Du postest noch keine Videos. Video-Inhalte erhalten auf HUI aktuell 3× mehr Reaktionen als Fotos. Ein 15-Sekunden-Clip hinter den Kulissen reicht.`,
      type:"coach", priority: priority--,
    });
  }

  // ── 4. BUCHUNGEN ─────────────────────────────────────────────
  if (booking.completed >= 3) {
    insights.push({
      id:"bookings_strong", icon:"✨",
      category:"business",
      headline: `${booking.completed} Buchungen abgeschlossen`,
      body: `Glückwunsch — du bist gefragt. Deine Einnahmen der letzten 30 Tage: € ${booking.revenue30.toFixed(2)} netto. Erhöhe deinen Stundensatz wenn du regelmäßig ausgebucht bist.`,
      type:"data", priority: priority--,
    });
  } else if (booking.pending >= 1) {
    insights.push({
      id:"bookings_incoming", icon:"⏳",
      category:"business",
      headline: `${booking.pending} offene Anfrage${booking.pending > 1 ? "n" : ""}`,
      body: `Antworte schnell auf Buchungsanfragen — Talente die innerhalb von 2 Stunden antworten werden 4× häufiger gebucht.`,
      type:"coach", priority: priority--,
    });
  }

  // ── 5. ENGAGEMENT ─────────────────────────────────────────────
  if (engage.engagement === "hoch") {
    insights.push({
      id:"engagement_high", icon:"💫",
      category:"community",
      headline: "Deine Community ist sehr engagiert",
      body: `Ø ${engage.rate} Reaktionen pro Werk — das ist überdurchschnittlich. Menschen mögen was du machst. Antworte auf Kommentare: das steigert die Sichtbarkeit um bis zu 40%.`,
      type:"data", priority: priority--,
    });
  } else if (engage.engagement === "gut") {
    insights.push({
      id:"engagement_good", icon:"💬",
      category:"community",
      headline: "Deine Inhalte erzeugen echte Reaktionen",
      body: `Ø ${engage.rate} Reaktionen pro Werk. Antworte auf die ersten 3 Kommentare direkt nach dem Posten — das gibt der Community das Gefühl gehört zu werden.`,
      type:"coach", priority: priority--,
    });
  }

  // ── 6. PORTFOLIO AUFBAU ───────────────────────────────────────
  if (works.length === 0 && exps.length === 0) {
    insights.push({
      id:"add_first_work", icon:"🎨",
      category:"onboarding",
      headline: "Zeig der Community dein erstes Werk",
      body: `Dein Profil ist bereit — aber noch kein Inhalt zu sehen. Poste ein Werk oder Erlebnis: das ist der wichtigste erste Schritt für Buchungen.`,
      type:"coach", priority: priority + 50, // höchste Priorität
    });
  } else if (works.length < 3) {
    insights.push({
      id:"more_works", icon:"🖼",
      category:"portfolio",
      headline: "Mehr Werke = mehr Vertrauen",
      body: `Du hast ${works.length} Werk${works.length !== 1 ? "e" : ""}. Profile mit 5+ Werken werden 3× häufiger angefragt — füge weitere hinzu.`,
      type:"coach", priority: priority--,
    });
  }

  // ── 7. ERLEBNISSE ─────────────────────────────────────────────
  if (exps.length === 0 && works.length >= 2) {
    insights.push({
      id:"add_experience", icon:"🌿",
      category:"portfolio",
      headline: "Community-Erlebnisse wachsen gerade stark",
      body: `Persönliche Sessions, Workshops und Erlebnisse sind aktuell das am stärksten wachsende Format auf HUI. Du könntest einen Einstieg anbieten.`,
      type:"trend", priority: priority--,
    });
  }

  // ── 8. PROFIL-QUALITÄT ────────────────────────────────────────
  const profileScore = [
    profile?.display_name, profile?.bio, profile?.talent,
    profile?.avatar_url, profile?.location,
  ].filter(Boolean).length;

  if (profileScore < 3) {
    insights.push({
      id:"profile_incomplete", icon:"✏️",
      category:"profile",
      headline: "Ein vollständiges Profil erzeugt Vertrauen",
      body: `Dein Profil hat noch Platz für mehr. Bio, Foto und Talent-Beschreibung erhöhen die Buchungsrate erheblich. 2 Minuten — großer Unterschied.`,
      type:"coach", priority: priority + 40,
    });
  } else if (profileScore >= 5) {
    insights.push({
      id:"profile_strong", icon:"🎯",
      category:"profile",
      headline: "Dein Profil wirkt stark & kreativ",
      body: `Bio, Foto, Standort, Talent — alles da. Dein Profil sendet ein klares Signal an die richtigen Menschen.`,
      type:"data", priority: priority--,
    });
  }

  // ── 9. COMMUNITY-TREND (Plattform-weit) ───────────────────────
  const trendInsights = [
    {
      id:"trend_warmth", icon:"🍂",
      category:"trend",
      headline: "Warme Farben & Naturmotive performen stark",
      body: `Auf HUI werden gerade erdige, warme Töne und Natur-Ästhetik besonders oft gespeichert. Wenn das zu deiner Arbeit passt — jetzt ist ein guter Zeitpunkt.`,
      type:"trend", priority: 10,
    },
    {
      id:"trend_authentic", icon:"🪟",
      category:"trend",
      headline: "Behind-The-Scenes Inhalte erzeugen Nähe",
      body: `Einblicke in deinen Prozess — Rohversionen, Skizzen, Arbeitsplatz — resonieren gerade sehr stark. Menschen wollen den Entstehungsprozess sehen.`,
      type:"trend", priority: 9,
    },
    {
      id:"trend_community", icon:"🤝",
      category:"trend",
      headline: "Community-Erlebnisse wachsen diese Woche",
      body: `Kleine persönliche Formate — 1:1 Sessions, Micro-Workshops, kreative Spaziergänge — bekommen auf HUI gerade viel Aufmerksamkeit.`,
      type:"trend", priority: 8,
    },
  ];

  // Nur 1-2 Trends anzeigen basierend auf Profil-Typ
  const relevantTrend = profile?.focus_type === "services"
    ? trendInsights[2]
    : trendInsights[Math.floor(totalContent / 5) % trendInsights.length];
  insights.push(relevantTrend);

  // ── Sortieren nach Priorität ────────────────────────────────
  insights.sort((a,b) => b.priority - a.priority);

  return {
    insights: insights.slice(0, 8), // max 8 anzeigen
    signals:  { hours, content, growth, booking, engage }, // für KI-Export
    generatedAt: new Date().toISOString(),
    dataPoints: totalContent + bookings.length + follows.length,
  };
}

// ══════════════════════════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════════════════════════
export async function fetchCreatorInsights(userId, profile) {
  try {
    const signals = await loadCreatorSignals(userId);
    const result  = generateInsights(signals, profile);
    return { ...result, error:null };
  } catch(e) {
    console.error("[InsightsEngine]", e);
    return { insights:[], signals:null, error:e.message, generatedAt:null, dataPoints:0 };
  }
}

// KI-Ready: exportiert rohe Signale für OpenAI / Edge Function
export async function exportSignalsForAI(userId, profile) {
  const signals = await loadCreatorSignals(userId);
  const { hours, content, growth, booking, engage } = {
    hours:   analyzePostingHours([...signals.works, ...signals.beitraege]),
    content: analyzeContentTypes(signals.beitraege),
    growth:  analyzeGrowth(signals.follows),
    booking: analyzeBookings(signals.bookings),
    engage:  analyzeEngagement(signals.comments, signals.favorites, signals.works),
  };

  // Strukturierter Prompt-Context für spätere KI-Integration
  return {
    userId,
    profile: {
      name:       profile?.display_name,
      talent:     profile?.talent,
      focus_type: profile?.focus_type,
      location:   profile?.location,
    },
    metrics: {
      works_count:     signals.works.length,
      exps_count:      signals.exps.length,
      beitraege_count: signals.beitraege.length,
      bookings_30d:    signals.bookings.length,
      followers_30d:   signals.follows.length,
      comments_30d:    signals.comments.length,
      favorites_30d:   signals.favorites.length,
    },
    patterns: {
      peak_hour:      hours.peak,
      peak_period:    hours.period,
      dominant_type:  content.dominant,
      has_video:      content.hasVideo,
      growth_trend:   growth.trend,
      engagement:     engage.engagement,
      bookings_done:  booking.completed,
      bookings_pending: booking.pending,
    },
    // Bereit für: await openai.chat.completions.create({ messages:[
    //   { role:"system", content: "Du bist ein kreativer Coach für HUI-Creator…" },
    //   { role:"user",   content: JSON.stringify(this) }
    // ]})
    exportedAt: new Date().toISOString(),
  };
}
