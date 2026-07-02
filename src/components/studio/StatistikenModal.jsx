// StatistikenModal.jsx — Nutzer-Statistiken + PDF-Download
// ══════════════════════════════════════════════════════════
// Lädt alle relevanten Aktivitätsdaten des Nutzers aus Supabase
// und rendert eine kompakte Übersicht + PDF-Export via jsPDF
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { toast } from "../../lib/useToast.jsx";

// ── Design Tokens ──────────────────────────────────────────────────
const T = {
  bg:        "#F7F5F0",
  bgCard:    "#FFFFFF",
  teal:      "#0EC4B8",
  tealDeep:  "#0AADA3",
  tealSoft:  "rgba(14,196,184,0.10)",
  tealMid:   "rgba(14,196,184,0.22)",
  coral:     "#FF6B6B",
  coralSoft: "rgba(255,107,107,0.10)",
  green:     "#10B981",
  greenSoft: "rgba(16,185,129,0.10)",
  greenMid:  "rgba(16,185,129,0.22)",
  amber:     "#F59E0B",
  amberSoft: "rgba(245,158,11,0.10)",
  violet:    "#7C3AED",
  violetSoft:"rgba(124,58,237,0.10)",
  ink:       "#1A1A18",
  inkSoft:   "rgba(26,26,24,0.52)",
  inkFaint:  "rgba(26,26,24,0.32)",
  border:    "rgba(26,26,24,0.08)",
  r16: 16, r12: 12, r8: 8, r99: 99,
  card: "0 1px 6px rgba(26,26,24,0.07)",
  ff: "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
};

// ── Formatierung ───────────────────────────────────────────────────
const fmtEur = (n) => n == null ? "—" : `€${Number(n).toLocaleString("de-DE", { minimumFractionDigits: 0 })}`;
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("de-DE", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const fmtNum  = (n)   => n == null ? "0" : Number(n).toLocaleString("de-DE");

// ── Statistiken-Kategorien ─────────────────────────────────────────
const CATEGORIES = [
  { key: "community",  label: "Community",         icon: "👥", color: T.teal   },
  { key: "content",    label: "Inhalte & Werke",   icon: "🎨", color: T.violet },
  { key: "handel",     label: "Handel & Buchungen",icon: "💶", color: T.green  },
  { key: "impact",     label: "Impact & Wirkung",  icon: "🌱", color: T.teal   },
  { key: "engagement", label: "Engagement",        icon: "✨", color: T.amber  },
];

// ── Haupt-Komponente ───────────────────────────────────────────────
export default function StatistikenModal({ profile, onClose }) {
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [exporting,  setExporting]  = useState(false);
  const printRef = useRef(null);

  // ── Alle Statistiken laden ───────────────────────────────────────
  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    const uid = profile.id;
    try {
      // Parallel alle Counts laden
      const [
        { count: followingCount },
        { count: followerCount  },
        { count: likesGiven     },
        { count: likesSaved     },
        { count: commentsGiven  },
        { count: worksTotal     },
        { count: worksPublished },
        { count: storiesCount   },
        { count: momentsCount   },
        { count: beitraegeCount },
        { count: bookingsAsBuyer},
        { count: bookingsAsSeller},
        { count: ordersCount    },
        { count: impactVotes    },
        { count: projectSupports},
        { count: recsGiven      },
        { count: favCount       },
        { count: connections    },
        { count: profileRelations},
        { data: paymentsOut },
        { data: paymentsIn  },
        { data: profileData },
        { data: projSupportAmt},
      ] = await Promise.all([
        // Community
        supabase.from("follows").select("*", { count:"exact", head:true }).eq("follower_id", uid),
        supabase.from("follows").select("*", { count:"exact", head:true }).eq("followed_id", uid),
        supabase.from("work_likes").select("*", { count:"exact", head:true }).eq("user_id", uid),
        supabase.from("work_saves").select("*", { count:"exact", head:true }).eq("user_id", uid),
        supabase.from("comments").select("*", { count:"exact", head:true }).eq("user_id", uid),
        // Content
        supabase.from("works").select("*", { count:"exact", head:true }).eq("user_id", uid),
        supabase.from("works").select("*", { count:"exact", head:true }).eq("user_id", uid).eq("approval_status","published"),
        supabase.from("stories").select("*", { count:"exact", head:true }).eq("user_id", uid),
        supabase.from("moments").select("*", { count:"exact", head:true }).eq("user_id", uid),
        supabase.from("beitraege").select("*", { count:"exact", head:true }).eq("user_id", uid),
        // Handel
        supabase.from("bookings").select("*", { count:"exact", head:true }).eq("customer_id", uid),
        supabase.from("bookings").select("*", { count:"exact", head:true }).eq("wirker_id", uid),
        supabase.from("orders").select("*", { count:"exact", head:true }).eq("customer_id", uid),
        // Impact
        supabase.from("impact_votes").select("*", { count:"exact", head:true }).eq("voter_id", uid),
        supabase.from("project_support").select("*", { count:"exact", head:true }).eq("user_id", uid),
        // Engagement
        supabase.from("recommendations").select("*", { count:"exact", head:true }).eq("from_user_id", uid),
        supabase.from("favorites").select("*", { count:"exact", head:true }).eq("user_id", uid),
        supabase.from("connections").select("*", { count:"exact", head:true }).eq("user_id", uid),
        supabase.from("profile_relations").select("*", { count:"exact", head:true }).eq("requester_id", uid),
        // Zahlungen
        supabase.from("payments").select("amount_eur,impact_eur").eq("payer_id", uid).in("state",["released","completed","paid"]),
        supabase.from("payments").select("payout_eur").eq("recipient_id", uid).in("state",["released","completed","paid"]),
        // Profil
        supabase.from("profiles").select("profile_views,followers_count,trust_score,member_since,created_at,has_talent_profile,is_ambassador").eq("id", uid).single(), // Identity Contract v1.0
        // Project-Support Betrag
        supabase.from("project_support").select("amount_eur").eq("user_id", uid),
      ]);

      const totalAusgaben  = (paymentsOut||[]).reduce((s,r) => s+(r.amount_eur||0), 0);
      const totalEinnahmen = (paymentsIn||[]).reduce((s,r) => s+(r.payout_eur||0), 0);
      const totalImpactEur = (paymentsOut||[]).reduce((s,r) => s+(r.impact_eur||0), 0);
      const totalProjSupp  = (projSupportAmt||[]).reduce((s,r) => s+(r.amount_eur||0), 0);

      // Werke-Statistiken (Likes, Views auf eigene Werke)
      const { data: ownWorksStats } = await supabase
        .from("works")
        .select("likes_count,views_count,saves_count,comments_count")
        .eq("user_id", uid);
      const totalWorkLikes   = (ownWorksStats||[]).reduce((s,w) => s+(w.likes_count||0), 0);
      const totalWorkViews   = (ownWorksStats||[]).reduce((s,w) => s+(w.views_count||0), 0);
      const totalWorkSaves   = (ownWorksStats||[]).reduce((s,w) => s+(w.saves_count||0), 0);
      const totalWorkComments= (ownWorksStats||[]).reduce((s,w) => s+(w.comments_count||0), 0);

      setStats({
        // Profil
        memberSince:    profileData?.member_since || profileData?.created_at,
        profileViews:   profileData?.profile_views || 0,
        trustScore:     profileData?.trust_score || 0,
        isTalent:       profileData?.is_talent,
        isAmbassador:   profileData?.is_ambassador,
        // Community
        following:      followingCount || 0,
        followers:      followerCount  || profileData?.follower_count || 0,
        likesGiven:     likesGiven     || 0,
        likesSaved:     likesSaved     || 0,
        commentsGiven:  commentsGiven  || 0,
        connections:    connections    || 0,
        profileRelations: profileRelations || 0,
        favCount:       favCount       || 0,
        // Content
        worksTotal:     worksTotal     || 0,
        worksPublished: worksPublished || 0,
        storiesCount:   storiesCount   || 0,
        momentsCount:   momentsCount   || 0,
        beitraegeCount: beitraegeCount || 0,
        totalWorkLikes,
        totalWorkViews,
        totalWorkSaves,
        totalWorkComments,
        // Handel
        bookingsBuyer:  bookingsAsBuyer   || 0,
        bookingsSeller: bookingsAsSeller  || 0,
        ordersCount:    ordersCount       || 0,
        totalAusgaben,
        totalEinnahmen,
        // Impact
        impactVotes:    impactVotes    || 0,
        projectSupports:projectSupports|| 0,
        totalImpactEur,
        totalProjSupp,
        // Engagement
        recsGiven:      recsGiven      || 0,
      });
    } catch(e) {
      console.warn("[Statistiken] load:", e);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { load(); }, [load]);

  // ── PDF Export ───────────────────────────────────────────────────
  const handlePdfExport = async () => {
    if (!stats || exporting) return;
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210, M = 18, CW = W - M * 2;
      let y = 0;

      const addPage = () => { doc.addPage(); y = 18; };
      const checkY = (need = 12) => { if (y + need > 272) addPage(); };

      // ── Farben & Helfer ──
      const HEX = { teal:"#0EC4B8", ink:"#1A1A18", soft:"#888880", border:"#E8E4DC", card:"#F7F5F0" };

      const rect = (x,yy,w,h,col,r=3) => {
        doc.setFillColor(col);
        doc.roundedRect(x, yy, w, h, r, r, "F");
      };
      const text = (t,x,yy,opts={}) => {
        doc.setFontSize(opts.size||10);
        doc.setFont("helvetica", opts.bold ? "bold" : "normal");
        doc.setTextColor(opts.color||HEX.ink);
        doc.text(String(t), x, yy, { align: opts.align||"left", ...opts.textOpts });
      };

      // ── HEADER ──────────────────────────────────────────────────
      rect(0, 0, W, 38, HEX.teal, 0);
      text("HUI Platform", M, 14, { size:9, color:"#FFFFFF", bold:false });
      text("Statistik-Report", M, 22, { size:18, bold:true, color:"#FFFFFF" });
      text(profile.full_name || profile.display_name || profile.username || "Nutzer", M, 30, { size:11, color:"rgba(255,255,255,0.85)" });
      const nowStr = new Date().toLocaleDateString("de-DE", { day:"2-digit", month:"long", year:"numeric" });
      text(`Erstellt am ${nowStr}`, W-M, 30, { size:9, color:"rgba(255,255,255,0.7)", align:"right" });
      y = 46;

      // ── Mitglied seit ──
      text(`Mitglied seit: ${fmtDate(stats.memberSince)}   ·   ${stats.isTalent ? "HUI-Talent" : "HUI-Mitglied"}${stats.isAmbassador ? "  ·  Ambassador" : ""}`,
        M, y, { size:8.5, color:HEX.soft });
      y += 10;

      // ── Abschnitt-Renderer ───────────────────────────────────────
      const section = (label, icon) => {
        checkY(14);
        rect(M, y-4, CW, 10, HEX.card, 3);
        text(`${icon}  ${label}`, M+3, y+3, { size:10, bold:true, color:HEX.ink });
        y += 10;
      };

      // Kachel-Grid (2 Spalten)
      const kacheln = (items) => {
        const colW = CW / 2 - 3;
        let col = 0;
        items.forEach((item, i) => {
          checkY(18);
          const x = M + col * (colW + 6);
          rect(x, y, colW, 16, HEX.card, 3);
          // Wert
          doc.setFontSize(13); doc.setFont("helvetica","bold"); doc.setTextColor(item.color || HEX.teal);
          doc.text(String(item.val), x + colW/2, y + 7, { align:"center" });
          // Label
          doc.setFontSize(7.5); doc.setFont("helvetica","normal"); doc.setTextColor(HEX.soft);
          doc.text(item.label, x + colW/2, y + 13, { align:"center" });
          col++;
          if (col >= 2) { col = 0; y += 20; }
        });
        if (col > 0) y += 20;
        y += 4;
      };

      // ── 1. COMMUNITY ────────────────────────────────────────────
      section("Community & Netzwerk", "👥");
      kacheln([
        { label:"Follower",           val: fmtNum(stats.followers),    color:"#0EC4B8" },
        { label:"Folge ich",          val: fmtNum(stats.following),    color:"#0EC4B8" },
        { label:"Verbindungen",       val: fmtNum(stats.connections),  color:"#7C3AED" },
        { label:"Profil-Aufrufe",     val: fmtNum(stats.profileViews), color:"#F59E0B" },
        { label:"Likes vergeben",     val: fmtNum(stats.likesGiven),   color:"#FF6B6B" },
        { label:"Gespeichert",        val: fmtNum(stats.likesSaved),   color:"#FF6B6B" },
        { label:"Kommentare",         val: fmtNum(stats.commentsGiven),color:"#7C3AED" },
        { label:"Empfehlungen",       val: fmtNum(stats.recsGiven),    color:"#10B981" },
      ]);

      // ── 2. INHALTE & WERKE ──────────────────────────────────────
      section("Inhalte & Werke", "🎨");
      kacheln([
        { label:"Werke gesamt",       val: fmtNum(stats.worksTotal),     color:"#7C3AED" },
        { label:"Werke veröffentl.",  val: fmtNum(stats.worksPublished), color:"#10B981" },
        { label:"Stories",            val: fmtNum(stats.storiesCount),   color:"#F59E0B" },
        { label:"Momente",            val: fmtNum(stats.momentsCount),   color:"#F59E0B" },
        { label:"Beiträge",           val: fmtNum(stats.beitraegeCount), color:"#0EC4B8" },
        { label:"Werk-Aufrufe",       val: fmtNum(stats.totalWorkViews), color:"#7C3AED" },
        { label:"Werk-Likes erhalten",val: fmtNum(stats.totalWorkLikes), color:"#FF6B6B" },
        { label:"Werk-Saves erhalten",val: fmtNum(stats.totalWorkSaves), color:"#FF6B6B" },
      ]);

      // ── 3. HANDEL & BUCHUNGEN ───────────────────────────────────
      section("Handel & Buchungen", "💶");
      kacheln([
        { label:"Käufe / Buchungen",  val: fmtNum(stats.bookingsBuyer),  color:"#FF6B6B" },
        { label:"Verkäufe",           val: fmtNum(stats.bookingsSeller), color:"#10B981" },
        { label:"Bestellungen",       val: fmtNum(stats.ordersCount),    color:"#F59E0B" },
        { label:"Gesamt ausgegeben",  val: fmtEur(stats.totalAusgaben),  color:"#FF6B6B" },
        { label:"Gesamt eingenommen", val: fmtEur(stats.totalEinnahmen), color:"#10B981" },
        { label:"Saldo",
          val: `${stats.totalEinnahmen - stats.totalAusgaben >= 0 ? "+" : ""}${fmtEur(stats.totalEinnahmen - stats.totalAusgaben)}`,
          color: stats.totalEinnahmen - stats.totalAusgaben >= 0 ? "#10B981" : "#FF6B6B" },
      ]);

      // ── 4. IMPACT & WIRKUNG ─────────────────────────────────────
      section("Impact & Wirkung", "🌱");
      kacheln([
        { label:"Impact-Stimmen",     val: fmtNum(stats.impactVotes),     color:"#0EC4B8" },
        { label:"Projekte unterstützt",val:fmtNum(stats.projectSupports), color:"#10B981" },
        { label:"Impact-Beitrag",     val: fmtEur(stats.totalImpactEur),  color:"#0EC4B8" },
        { label:"Projekt-Support",    val: fmtEur(stats.totalProjSupp),   color:"#10B981" },
      ]);

      // ── FOOTER ──────────────────────────────────────────────────
      checkY(20);
      y += 6;
      rect(M, y, CW, 16, HEX.card, 3);
      doc.setFontSize(7.5); doc.setFont("helvetica","normal"); doc.setTextColor(HEX.soft);
      doc.text("Dieser Report wurde automatisch durch HUI erstellt · be-hui.com · Alle Daten aus deiner persönlichen HUI-Aktivität.",
        W/2, y+6, { align:"center" });
      doc.text(`Report-ID: HUI-${Date.now().toString(36).toUpperCase()} · ${nowStr}`,
        W/2, y+12, { align:"center" });

      // Seitenzahlen
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7); doc.setTextColor(HEX.soft);
        doc.text(`Seite ${i} / ${pageCount}`, W/2, 290, { align:"center" });
      }

      // Speichern
      const name = (profile.username || profile.full_name || "hui").replace(/\s+/g,"-").toLowerCase();
      doc.save(`HUI-Statistik-${name}-${new Date().getFullYear()}.pdf`);
    } catch(e) {
      console.warn("[PDF] Export Fehler:", e);
      toast.error("PDF-Export fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setExporting(false);
    }
  };

  // ── Modal ─────────────────────────────────────────────────────────
  const modal = (
    <div
      style={{ position:"fixed", inset:0, zIndex:9999,
        background:"rgba(26,26,24,0.52)", display:"flex", alignItems:"flex-end" }}
      onClick={e => { if(e.target===e.currentTarget) onClose?.(); }}
    >
      <div style={{
        width:"100%", maxWidth:480, margin:"0 auto",
        background:T.bg, borderRadius:"24px 24px 0 0",
        maxHeight:"92vh", overflow:"hidden",
        display:"flex", flexDirection:"column",
        boxShadow:"0 -4px 32px rgba(26,26,24,0.18)",
        fontFamily:T.ff,
      }}>
        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px" }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"rgba(26,26,24,0.12)" }} />
        </div>

        {/* Header */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"10px 20px 14px",
        }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>
              📊 Statistiken
            </div>
            <div style={{ fontSize:12, color:T.inkSoft, marginTop:2 }}>
              Deine gesamte HUI-Aktivität auf einen Blick
            </div>
          </div>
          <button onClick={onClose} style={{
            background:"rgba(26,26,24,0.07)", border:"none", cursor:"pointer",
            borderRadius:"50%", width:32, height:32,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, color:T.inkSoft,
          }}>✕</button>
        </div>

        {/* Scroll-Content */}
        <div ref={printRef} style={{ flex:1, overflowY:"auto", padding:"0 20px 100px",
          WebkitOverflowScrolling:"touch", scrollbarWidth:"none" }}>

          {loading && (
            <div style={{ textAlign:"center", padding:"48px 0", color:T.inkSoft }}>
              <div style={{ fontSize:24, marginBottom:10, animation:"spin 1.2s linear infinite", display:"inline-block" }}>📊</div>
              <div style={{ fontSize:14 }}>Statistiken werden geladen…</div>
            </div>
          )}

          {!loading && stats && (
            <>
              {/* ── Mitglied-Info ── */}
              <div style={{
                background: `linear-gradient(135deg, ${T.teal}18, ${T.teal}08)`,
                borderRadius:T.r16, border:`1px solid ${T.tealMid}`,
                padding:"14px 16px", marginBottom:16,
                display:"flex", justifyContent:"space-between", alignItems:"center",
              }}>
                <div>
                  <div style={{ fontSize:12, color:T.inkSoft }}>Mitglied seit</div>
                  <div style={{ fontSize:15, fontWeight:800, color:T.ink }}>
                    {fmtDate(stats.memberSince)}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:10, color:T.inkFaint }}>Status</div>
                  <div style={{ fontSize:13, fontWeight:700, color:T.teal }}>
                    {stats.isTalent ? "🎯 HUI-Talent" : "🌟 HUI-Mitglied"}
                    {stats.isAmbassador && " · 🏅 Ambassador"}
                  </div>
                </div>
              </div>

              {/* ── Kategorien ── */}
              <StatSection icon="👥" label="Community & Netzwerk" color={T.teal}>
                <KachelGrid items={[
                  { icon:"🔔", label:"Follower",          val: fmtNum(stats.followers),    col:T.teal   },
                  { icon:"➡️", label:"Folge ich",          val: fmtNum(stats.following),    col:T.teal   },
                  { icon:"🤝", label:"Verbindungen",       val: fmtNum(stats.connections),  col:T.violet },
                  { icon:"👁️", label:"Profil-Aufrufe",     val: fmtNum(stats.profileViews), col:T.amber  },
                  { icon:"❤️", label:"Likes vergeben",     val: fmtNum(stats.likesGiven),   col:T.coral  },
                  { icon:"🔖", label:"Gespeichert",        val: fmtNum(stats.likesSaved),   col:T.coral  },
                  { icon:"💬", label:"Kommentare",         val: fmtNum(stats.commentsGiven),col:T.violet },
                  { icon:"⭐", label:"Empfehlungen",       val: fmtNum(stats.recsGiven),    col:T.green  },
                ]} />
              </StatSection>

              <StatSection icon="🎨" label="Inhalte & Werke" color={T.violet}>
                <KachelGrid items={[
                  { icon:"🖼️", label:"Werke gesamt",       val: fmtNum(stats.worksTotal),     col:T.violet },
                  { icon:"✅", label:"Veröffentlicht",     val: fmtNum(stats.worksPublished), col:T.green  },
                  { icon:"📖", label:"Stories",            val: fmtNum(stats.storiesCount),   col:T.amber  },
                  { icon:"📸", label:"Momente",            val: fmtNum(stats.momentsCount),   col:T.amber  },
                  { icon:"📝", label:"Beiträge",           val: fmtNum(stats.beitraegeCount), col:T.teal   },
                  { icon:"👀", label:"Werk-Aufrufe",       val: fmtNum(stats.totalWorkViews), col:T.violet },
                  { icon:"❤️", label:"Likes erhalten",     val: fmtNum(stats.totalWorkLikes), col:T.coral  },
                  { icon:"🔖", label:"Saves erhalten",     val: fmtNum(stats.totalWorkSaves), col:T.coral  },
                ]} />
              </StatSection>

              <StatSection icon="💶" label="Handel & Buchungen" color={T.green}>
                <KachelGrid items={[
                  { icon:"🛒", label:"Käufe / Buchungen",  val: fmtNum(stats.bookingsBuyer),  col:T.coral  },
                  { icon:"💼", label:"Verkäufe",           val: fmtNum(stats.bookingsSeller), col:T.green  },
                  { icon:"📦", label:"Bestellungen",       val: fmtNum(stats.ordersCount),    col:T.amber  },
                  { icon:"↓",  label:"Ausgegeben",         val: fmtEur(stats.totalAusgaben),  col:T.coral  },
                  { icon:"↑",  label:"Eingenommen",        val: fmtEur(stats.totalEinnahmen), col:T.green  },
                  { icon:"⚖",  label:"Saldo",
                    val: `${stats.totalEinnahmen-stats.totalAusgaben>=0?"+":""}${fmtEur(stats.totalEinnahmen-stats.totalAusgaben)}`,
                    col: stats.totalEinnahmen-stats.totalAusgaben>=0 ? T.green : T.coral },
                ]} />
              </StatSection>

              <StatSection icon="🌱" label="Impact & Wirkung" color={T.teal}>
                <KachelGrid items={[
                  { icon:"🗳️", label:"Impact-Stimmen",      val: fmtNum(stats.impactVotes),     col:T.teal  },
                  { icon:"❤️", label:"Projekte unterstützt", val: fmtNum(stats.projectSupports), col:T.green },
                  { icon:"💧", label:"Impact-Beitrag",       val: fmtEur(stats.totalImpactEur),  col:T.teal  },
                  { icon:"🌍", label:"Projekt-Support",      val: fmtEur(stats.totalProjSupp),   col:T.green },
                ]} />
              </StatSection>
            </>
          )}

        </div>

        {/* ── PDF-Button (sticky bottom) ── */}
        {!loading && stats && (
          <div style={{ padding:"12px 20px 28px", borderTop:`1px solid ${T.border}`, background:T.bg }}>
            <button
              onClick={handlePdfExport}
              disabled={exporting}
              style={{
                width:"100%", padding:"14px",
                borderRadius:T.r16, border:"none", cursor: exporting ? "wait" : "pointer",
                background: exporting
                  ? "rgba(26,26,24,0.08)"
                  : `linear-gradient(135deg, ${T.teal}, ${T.tealDeep})`,
                color: exporting ? T.inkSoft : "#fff",
                fontSize:15, fontWeight:800, fontFamily:T.ff,
                letterSpacing:"-0.01em",
                boxShadow: exporting ? "none" : "0 4px 16px rgba(14,196,184,0.30)",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                transition:"all .2s",
              }}
            >
              {exporting ? (
                <>
                  <span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>⏳</span>
                  PDF wird erstellt…
                </>
              ) : (
                <>📄 Als PDF herunterladen</>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// ── Sub-Komponenten ────────────────────────────────────────────────
function StatSection({ icon, label, color, children }) {
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{
        display:"flex", alignItems:"center", gap:8, marginBottom:10,
      }}>
        <span style={{
          width:28, height:28, borderRadius:8, flexShrink:0,
          background:`${color}18`, display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:14,
        }}>{icon}</span>
        <span style={{ fontSize:13, fontWeight:800, color:"#1A1A18", letterSpacing:"-0.01em" }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function KachelGrid({ items }) {
  return (
    <div style={{
      display:"grid", gridTemplateColumns:"1fr 1fr",
      gap:8,
    }}>
      {items.map((item, i) => (
        <div key={i} style={{
          background:T.bgCard, borderRadius:T.r12,
          border:`1px solid ${T.border}`,
          padding:"12px 14px",
          boxShadow:T.card,
        }}>
          <div style={{
            fontSize:10, color:T.inkFaint, fontWeight:600,
            letterSpacing:"0.03em", marginBottom:4,
            display:"flex", alignItems:"center", gap:5,
          }}>
            <span>{item.icon}</span>
            {item.label.toUpperCase()}
          </div>
          <div style={{ fontSize:20, fontWeight:800, color:item.col || T.teal }}>
            {item.val}
          </div>
        </div>
      ))}
    </div>
  );
}
