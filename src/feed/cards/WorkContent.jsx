import React from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";
import { useContentPreview } from "../../context/ContentPreviewContext.jsx";
import { formatNumberDE } from "../../lib/formatters.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { WERK_CAT_KEY_MAP, translateCategory } from "../../lib/categoryMaps.js";

const CORAL  = "#F47355";
const ORANGE = "#F05A28";
const TEAL   = "#0DC4B5";
const INK    = "#1A1A2E";
const INK3   = "rgba(26,26,46,0.42)";

function formatPrice(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return null;
  return formatNumberDE(n, { minimumFractionDigits:0 }) + " \u20ac";
}

export default function WorkContent({ item, onProfile, onReaction, onShare, onBuyWerk, onDetail }) {
  const { t } = useTranslation();
  if (!item) return null;

  const title    = item.title || item.text || "";
  const descRaw  = item._raw?.description || item._raw?.caption || null;
  // FIX: Normalizer setzt title=text.slice(0,60) wenn kein explizites Titel-Feld
  // existiert. In dem Fall wäre desc identisch mit title → Dopplung. Skip desc.
  const desc     = (descRaw && title && (descRaw.trim() === title.trim() || descRaw.trim().startsWith(title.trim()))) ? null : descRaw;
  const price    = item._raw?.price ?? item.price ?? null;
  const category = item._raw?.category ? translateCategory(item._raw.category, WERK_CAT_KEY_MAP, t) : null;
  const tags     = Array.isArray(item.tags) ? item.tags.slice(0,3) : [];
  const priceStr = formatPrice(price);

  // FIX: Kaufen-Button nur wenn for_sale explizit true oder nicht gesetzt (null/undefined)
  // for_sale = false → Werk als "Verkauft" markiert → kein Kaufen-Button
  const forSale  = item._raw?.for_sale;
  // FEED-SOLD-MARK-002 (2026-08-30, Michael-Request): Werk bleibt im Feed
  // sichtbar auch wenn verkauft (stock_available<=0) — nur nicht mehr kaufbar.
  // stock_available===null/undefined = kein Stock-Tracking (Altbestand/
  // unbegrenzt) → gilt NICHT als ausverkauft.
  const stockAvailRaw = item._raw?.stock_available;
  const isSoldOut = stockAvailRaw != null && stockAvailRaw <= 0;
  const isBuyable = forSale !== false && !isSoldOut;

  // OPEN.1 (2026-07-08): Karte antippen -> geteilte Vorschau (einheitlich
  // mit allen anderen Feed-Typen). Von dort aus fuehrt "Vollstaendige
  // Ansicht oeffnen" weiterhin zu /work/:id -- keine Funktion verloren.
  const { open } = useContentPreview();
  const handleCardClick = () => open({
    ...item,
    canOpenFull: true,
    fullPath: `/work/${item.id}`,
  });

  return (
    <BaseFeedCard
      item={item}
      onProfile={onProfile}
      onReaction={onReaction}
      onShare={onShare}
      onCardClick={handleCardClick}
      soldStamp={isSoldOut ? t("feed.sold") : null}
    >

      {/* Beschreibung (falls vorhanden, über dem Bild) */}
      {desc && (
        <p style={{ margin:"0 0 10px", fontSize:13.5, fontWeight:400, color:"rgba(26,26,46,0.65)", lineHeight:1.55,
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
          {desc}
        </p>
      )}

      {/* ── Badge · Titel — eigene volle Zeile (FIX 2026-08-08: Titel wurde
          durch den Kaufen-Button rechts abgeschnitten, siehe Screenshot
          "Wunderbarer Holzt…"). Button jetzt auf eigener Zeile darunter. ── */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:10 }}>
        {/* WERK-Badge */}
        <span style={{
          flexShrink:0, marginTop:2,
          fontSize:10.5, fontWeight: 600, color:CORAL,
          background:"rgba(244,115,85,0.10)",
          border:"1px solid rgba(244,115,85,0.22)",
          borderRadius:99, padding:"3px 9px",
          letterSpacing:0.2, whiteSpace:"nowrap",
        }}>{t("feed.badgeWerk")}</span>
        {/* Titel */}
        {title ? (
          <span style={{
            fontSize:15, fontWeight: 600, color:INK,
            lineHeight:1.3, letterSpacing:"-0.02em",
            whiteSpace:"normal", wordBreak:"break-word",
          }}>{title}</span>
        ) : null}
      </div>

      {/* Verfügbarkeits-Badge (COMMERCE-STOCK-001) + VARIANTS-001 */}
      {(() => {
        // VARIANTS-001: Wenn Varianten existieren, zeige Bestand pro Variante
        const variants = item._raw?.variants;
        const hasVariants = item._raw?.has_variants && Array.isArray(variants) && variants.length > 0;
        if (hasVariants) {
          return (
            <div style={{ marginBottom:8 }}>
              <div style={{
                fontSize:11, fontWeight: 600, color: TEAL,
                background: "rgba(13,196,181,0.08)",
                border: "1px solid rgba(13,196,181,0.18)",
                borderRadius: 99, padding: "3px 9px",
                whiteSpace: "nowrap", display: "inline-block", marginBottom: 6,
              }}>{t("feed.variantsAvailable", {count: variants.length})}</div>
              {variants.map((v, i) => (
                <div key={v.id || i} style={{
                  fontSize: 11.5, color: "rgba(26,26,46,0.55)",
                  lineHeight: 1.6, display: "flex", alignItems: "center", gap: 4,
                }}>
                  <span style={{ fontWeight: 600, color: INK }}>{v.name}</span>
                  <span style={{ color: "rgba(26,26,46,0.35)" }}>·</span>
                  <span style={{
                    color: v.stock_available > 0 ? TEAL : "rgba(26,26,46,0.35)",
                    fontWeight: 600,
                  }}>{t("feed.stockAvailable", {avail: v.stock_available, total: v.stock_total})}</span>
                  {v.price != null && v.price > 0 && (
                    <>
                      <span style={{ color: "rgba(26,26,46,0.35)" }}>·</span>
                      <span style={{ fontWeight: 600, color: CORAL }}>{formatPrice(v.price)}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          );
        }
        // Normaler Modus (keine Varianten)
        const isUnique = item._raw?.is_unique !== false;
        const stockTotal = item._raw?.stock_total ?? 1;
        const stockAvail = item._raw?.stock_available ?? 1;
        // FIX (2026-08-16, Michael-Report "Langer Mast"): Bei Unikaten wurde
        // dieser Badge IMMER hartcodiert "1 von 1 verfuegbar" angezeigt --
        // auch wenn das Stueck bereits verkauft war (stock_available=0).
        // Das widersprach direkt dem "Verkauft"-Badge weiter unten (der
        // korrekt auf for_sale reagiert). Jetzt: echten Bestand anzeigen,
        // exakt wie im Nicht-Unikat-Zweig darunter.
        if (isUnique) {
          return (
            <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:8 }}>
              <span style={{
                fontSize:11.5, fontWeight:600,
                color: stockAvail > 0 ? TEAL : "rgba(26,26,46,0.35)",
                background: stockAvail > 0 ? "rgba(13,196,181,0.08)" : "rgba(26,26,46,0.05)",
                border:"1px solid rgba(13,196,181,0.18)",
                borderRadius:99, padding:"3px 9px", whiteSpace:"nowrap",
              }}>{t("feed.stockAvailable", {avail: stockAvail, total: stockTotal})}</span>
            </div>
          );
        }
        return (
          <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:8 }}>
            <span style={{
              fontSize:11.5, fontWeight:600,
              color: stockAvail > 0 ? TEAL : "rgba(26,26,46,0.35)",
              background: stockAvail > 0 ? "rgba(13,196,181,0.08)" : "rgba(26,26,46,0.05)",
              border:"1px solid rgba(13,196,181,0.18)",
              borderRadius:99, padding:"3px 9px", whiteSpace:"nowrap",
            }}>{t("feed.stockAvailable", {avail: stockAvail, total: stockTotal})}</span>
          </div>
        );
      })()}

      {/* CTA-Zeile — rechtsbündig, eigene Zeile */}
      {((onBuyWerk && isBuyable) || (onBuyWerk && !isBuyable && priceStr)) && (
        <div style={{ display:"flex", justifyContent:"center", marginBottom: category || priceStr ? 6 : 0 }}>
          {onBuyWerk && isBuyable && (
            <button
              onClick={(e) => { e.stopPropagation(); onBuyWerk(item); }}
              onTouchEnd={(e) => { e.stopPropagation(); }}
              style={{
                flexShrink:0,
                display:"flex", alignItems:"center", gap:7,
                background:"linear-gradient(135deg,#F47355,#F05A28)",
                color:"#fff", border:"none", borderRadius:99,
                padding:"9px 18px", fontSize:13, fontWeight: 600,
                cursor:"pointer", touchAction:"manipulation",
                boxShadow:"0 3px 10px rgba(240,90,40,0.35)",
                whiteSpace:"nowrap",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1C4 1 1.5 3.5 1.5 7C1.5 10.5 4 13 7 13C10 13 12.5 10.5 12.5 7C12.5 3.5 10 1 7 1ZM6 10L3.5 7.5L4.5 6.5L6 8L9.5 4.5L10.5 5.5L6 10Z" fill="white"/>
              </svg>
              {priceStr ? `${priceStr}  ${t("feed.buy")}` : t("feed.buy")}
            </button>
          )}

          {/* Verkauft-Badge wenn for_sale=false und Preis vorhanden */}
          {onBuyWerk && !isBuyable && priceStr && (
            <span style={{
              flexShrink:0,
              fontSize:10.5, fontWeight: 600, color:"rgba(26,26,46,0.35)",
              background:"rgba(26,26,46,0.06)",
              border:"1px solid rgba(26,26,46,0.12)",
              borderRadius:99, padding:"5px 12px",
              whiteSpace:"nowrap",
            }}>{t("feed.sold")}</span>
          )}
        </div>
      )}

      {/* Kategorie + Preis (Metazeile) */}
      {(category || priceStr) && !(onBuyWerk && isBuyable) && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginBottom:2 }}>
          {category && <span style={{ fontSize:12.5, fontWeight:600, color:CORAL }}>{category}</span>}

          {priceStr && <span style={{ fontSize:12.5, fontWeight:600, color:INK3 }}>{priceStr}</span>}
        </div>
      )}
      {/* Metazeile wenn Button vorhanden — NUR Kategorie, kein Preis (2026-08-10):
          Preis steht bereits im Kaufen-Button darüber ("20 € Kaufen"),
          die Wiederholung direkt darunter ("Handwerk 20 €") war redundant.
          Gilt nur für Werke-Karten (diese Datei) — Talente/Momente/Erlebnisse
          unverändert, siehe deren eigene Card-Komponenten. */}
      {category && onBuyWerk && isBuyable && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginBottom:2 }}>
          <span style={{ fontSize:12.5, fontWeight:600, color:CORAL }}>{category}</span>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:6 }}>
          {tags.map((t, i) => (
            <span key={i} style={{
              padding:"2px 9px", borderRadius:20,
              background:"rgba(244,115,85,0.07)",
              border:"1px solid rgba(244,115,85,0.15)",
              fontSize:11, color:CORAL, fontWeight:600,
            }}>{t}</span>
          ))}
        </div>
      )}
    </BaseFeedCard>
  );
}
