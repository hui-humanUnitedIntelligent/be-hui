import React, { useState, useRef, useCallback } from "react";

/* ─── Design Tokens ──────────────────────────────────── */
const C = {
  coral:   "#FF6B5B",
  teal:    "#2ABFAC",
  gold:    "#F5A623",
  purple:  "#A78BFA",
  ink:     "#1A1A2E",
  muted:   "#6B7280",
  surface: "#F8F7F5",
  card:    "#FFFFFF",
  border:  "#EEECE8",
  green:   "#10B981",
};

const SKILL_SUGGESTIONS = [
  "Fotografie","Video","Keramik","Yoga","Coaching","Handwerk",
  "Design","Musik","Kochen","Backen","Nähen","Holzarbeit",
  "Malen","Schreiben","Programmieren","Marketing","Leder",
  "Töpfern","Illustration","Catering",
];

/* ─── Kleine Helfer ──────────────────────────────────── */
function StepDots({ total, current }) {
  return (
    <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === current ? 20 : 6,
          height: 6, borderRadius: 999,
          background: i <= current ? C.teal : `${C.teal}25`,
          transition: "all 0.3s ease",
        }} />
      ))}
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.muted,
        marginBottom: 7, letterSpacing: 0.3 }}>
        {label}{required && <span style={{ color: C.coral }}> *</span>}
      </div>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, multiline, rows = 4, type = "text" }) {
  const shared = {
    width: "100%", boxSizing: "border-box",
    padding: "14px 16px", fontSize: 15, color: C.ink,
    background: C.surface, border: `1.5px solid ${C.border}`,
    borderRadius: 16, outline: "none", fontFamily: "inherit",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };
  return multiline
    ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
        style={{ ...shared, resize: "none", lineHeight: 1.6 }}
        onFocus={e => { e.target.style.borderColor = C.teal; e.target.style.boxShadow = `0 0 0 3px ${C.teal}14`; }}
        onBlur={e  => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }} />
    : <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={shared}
        onFocus={e => { e.target.style.borderColor = C.teal; e.target.style.boxShadow = `0 0 0 3px ${C.teal}14`; }}
        onBlur={e  => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }} />;
}

/* ─── SCHRITT 0: Typ wählen ──────────────────────────── */
function StepChooseType({ onSelect }) {
  const [pressed, setPressed] = useState(null);

  const types = [
    {
      key: "wirker",
      icon: "🤝",
      title: "Wirker",
      sub: "Erlebnis oder Dienstleistung",
      desc: "Du bietest deine Zeit, dein Wissen oder deine Fähigkeiten an.",
      color: C.teal,
      bg: `linear-gradient(160deg, ${C.teal}18, ${C.teal}08)`,
      border: `${C.teal}30`,
    },
    {
      key: "werk",
      icon: "🎨",
      title: "Werk",
      sub: "Handgemacht oder kreativ",
      desc: "Du verkaufst ein physisches oder digitales Produkt.",
      color: C.gold,
      bg: `linear-gradient(160deg, ${C.gold}18, ${C.gold}08)`,
      border: `${C.gold}30`,
    },
  ];

  return (
    <div style={{ padding: "32px 24px 24px" }}>
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <div style={{ fontWeight: 900, fontSize: 22, color: C.ink,
          marginBottom: 8, lineHeight: 1.3 }}>
          Neuer Beitrag
        </div>
        <div style={{ fontSize: 15, color: C.muted, lineHeight: 1.6 }}>
          Was möchtest du der Welt anbieten?
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {types.map(t => (
          <button key={t.key}
            onClick={() => onSelect(t.key)}
            onTouchStart={() => setPressed(t.key)}
            onTouchEnd={() => setPressed(null)}
            onMouseDown={() => setPressed(t.key)}
            onMouseUp={() => setPressed(null)}
            style={{
              background: t.bg, border: `2px solid ${t.border}`,
              borderRadius: 24, padding: "22px 22px",
              cursor: "pointer", textAlign: "left",
              transform: pressed === t.key ? "scale(0.975)" : "scale(1)",
              boxShadow: pressed === t.key
                ? `0 2px 8px ${t.color}20`
                : `0 4px 20px ${t.color}15`,
              transition: "all 0.15s ease",
              WebkitTapHighlightColor: "transparent",
            }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                background: `${t.color}15`,
                border: `1.5px solid ${t.color}30`,
                display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 24,
              }}>
                {t.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: 18,
                  color: C.ink, marginBottom: 3 }}>{t.title}</div>
                <div style={{ fontSize: 12, fontWeight: 700,
                  color: t.color, marginBottom: 6 }}>{t.sub}</div>
                <div style={{ fontSize: 13, color: C.muted,
                  lineHeight: 1.55 }}>{t.desc}</div>
              </div>
              <div style={{ color: t.color, fontSize: 20, marginTop: 2 }}>→</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── SCHRITT 1: Basics ──────────────────────────────── */
function StepBasics({ type, data, onChange }) {
  const isWirker = type === "wirker";
  const color    = isWirker ? C.teal : C.gold;

  return (
    <div style={{ padding: "28px 24px 16px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8,
          background: `${color}12`, borderRadius: 20,
          padding: "6px 14px", marginBottom: 14,
          border: `1px solid ${color}25` }}>
          <span style={{ fontSize: 15 }}>{isWirker ? "🤝" : "🎨"}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color }}>
            {isWirker ? "Wirker – Erlebnis / Service" : "Werk – Produkt"}
          </span>
        </div>
        <div style={{ fontWeight: 900, fontSize: 20, color: C.ink, lineHeight: 1.3 }}>
          Erzähl uns davon
        </div>
      </div>

      <Field label="Titel" required>
        <Input value={data.title} onChange={e => onChange("title", e.target.value)}
          placeholder={isWirker ? "z. B. Keramik-Workshop für Anfänger" : "z. B. Handgedrehte Vase aus Steinzeugton"} />
      </Field>

      <Field label="Beschreibung" required>
        <Input multiline rows={4} value={data.description}
          onChange={e => onChange("description", e.target.value)}
          placeholder={isWirker
            ? "Was erwartet die Teilnehmenden? Was macht dein Angebot besonders?"
            : "Was steckt hinter diesem Stück? Wie ist es entstanden?"} />
      </Field>

      {isWirker ? (
        <>
          <Field label="Stundensatz / Preis" required>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 16, top: "50%",
                transform: "translateY(-50%)", color: C.muted, fontWeight: 700, fontSize: 15 }}>€</span>
              <input type="number" min="0" value={data.price}
                onChange={e => onChange("price", e.target.value)}
                placeholder="55"
                style={{ width: "100%", boxSizing: "border-box",
                  padding: "14px 16px 14px 36px", fontSize: 15,
                  color: C.ink, background: C.surface,
                  border: `1.5px solid ${C.border}`, borderRadius: 16, outline: "none" }}
                onFocus={e => { e.target.style.borderColor = C.teal; }}
                onBlur={e  => { e.target.style.borderColor = C.border; }} />
              <span style={{ position: "absolute", right: 16, top: "50%",
                transform: "translateY(-50%)", fontSize: 12,
                color: C.muted, fontWeight: 600 }}>/Std.</span>
            </div>
          </Field>
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field label="Verkaufspreis" required>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 16, top: "50%",
                    transform: "translateY(-50%)", color: C.muted, fontWeight: 700 }}>€</span>
                  <input type="number" min="0" value={data.price}
                    onChange={e => onChange("price", e.target.value)}
                    placeholder="65"
                    style={{ width: "100%", boxSizing: "border-box",
                      padding: "14px 16px 14px 36px", fontSize: 15,
                      color: C.ink, background: C.surface,
                      border: `1.5px solid ${C.border}`, borderRadius: 16, outline: "none" }}
                    onFocus={e => e.target.style.borderColor = C.gold}
                    onBlur={e  => e.target.style.borderColor = C.border} />
                </div>
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Versandkosten">
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 16, top: "50%",
                    transform: "translateY(-50%)", color: C.muted, fontWeight: 700 }}>€</span>
                  <input type="number" min="0" value={data.shipping}
                    onChange={e => onChange("shipping", e.target.value)}
                    placeholder="4,90"
                    style={{ width: "100%", boxSizing: "border-box",
                      padding: "14px 16px 14px 36px", fontSize: 15,
                      color: C.ink, background: C.surface,
                      border: `1.5px solid ${C.border}`, borderRadius: 16, outline: "none" }}
                    onFocus={e => e.target.style.borderColor = C.gold}
                    onBlur={e  => e.target.style.borderColor = C.border} />
                </div>
              </Field>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── SCHRITT 2: Skills ──────────────────────────────── */
function StepSkills({ type, data, onChange }) {
  const [custom, setCustom] = useState("");
  const color = type === "wirker" ? C.teal : C.gold;
  const selected = data.skills || [];

  function toggle(skill) {
    if (selected.includes(skill)) {
      onChange("skills", selected.filter(s => s !== skill));
    } else if (selected.length < 6) {
      onChange("skills", [...selected, skill]);
    }
  }

  function addCustom() {
    const s = custom.trim();
    if (s && !selected.includes(s) && selected.length < 6) {
      onChange("skills", [...selected, s]);
      setCustom("");
    }
  }

  return (
    <div style={{ padding: "28px 24px 16px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 900, fontSize: 20, color: C.ink, marginBottom: 6 }}>
          Deine Skills
        </div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.55 }}>
          Wähle bis zu 6 passende Tags. Sie helfen Entdeckern, dich zu finden.
        </div>
      </div>

      {/* Ausgewählte */}
      {selected.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
            marginBottom: 8, letterSpacing: 0.3 }}>AUSGEWÄHLT ({selected.length}/6)</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {selected.map(s => (
              <button key={s} onClick={() => toggle(s)}
                style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)`,
                  color: "white", border: "none", borderRadius: 20,
                  padding: "7px 14px", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  WebkitTapHighlightColor: "transparent" }}>
                {s}
                <span style={{ fontSize: 11, opacity: 0.8 }}>✕</span>
              </button>
            ))}
          </div>
          <div style={{ height: 1, background: C.border, margin: "16px 0" }} />
        </div>
      )}

      {/* Vorschläge */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {SKILL_SUGGESTIONS.filter(s => !selected.includes(s)).map(s => (
          <button key={s} onClick={() => toggle(s)}
            disabled={selected.length >= 6}
            style={{ background: selected.length >= 6 ? `${C.border}` : `${color}10`,
              color: selected.length >= 6 ? C.muted : color,
              border: `1.5px solid ${selected.length >= 6 ? C.border : color + "30"}`,
              borderRadius: 20, padding: "7px 14px", fontSize: 13,
              fontWeight: 600, cursor: selected.length >= 6 ? "default" : "pointer",
              transition: "all 0.15s",
              WebkitTapHighlightColor: "transparent" }}>
            {s}
          </button>
        ))}
      </div>

      {/* Eigener Skill */}
      <div style={{ display: "flex", gap: 8 }}>
        <input value={custom} onChange={e => setCustom(e.target.value)}
          placeholder="Eigenen Skill eingeben…"
          onKeyDown={e => e.key === "Enter" && addCustom()}
          style={{ flex: 1, padding: "12px 16px", fontSize: 14, color: C.ink,
            background: C.surface, border: `1.5px solid ${C.border}`,
            borderRadius: 14, outline: "none" }}
          onFocus={e => e.target.style.borderColor = color}
          onBlur={e  => e.target.style.borderColor = C.border} />
        <button onClick={addCustom} disabled={!custom.trim() || selected.length >= 6}
          style={{ padding: "12px 18px", borderRadius: 14, border: "none",
            background: custom.trim() && selected.length < 6
              ? `linear-gradient(135deg, ${color}, ${color}CC)`
              : C.border,
            color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
            transition: "all 0.15s",
            WebkitTapHighlightColor: "transparent" }}>
          + Hinzu
        </button>
      </div>
    </div>
  );
}

/* ─── SCHRITT 3: Medien ──────────────────────────────── */
function StepMedia({ data, onChange }) {
  const inputRef  = useRef(null);
  const [delIdx, setDelIdx] = useState(null);

  function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    const previews = files.map(f => ({
      file: f,
      url: URL.createObjectURL(f),
      type: f.type.startsWith("video") ? "video" : "foto",
      name: f.name,
    }));
    onChange("media", [...(data.media || []), ...previews].slice(0, 8));
    e.target.value = "";
  }

  function confirmDelete(i) { setDelIdx(i); }
  function doDelete() {
    const next = (data.media || []).filter((_, i) => i !== delIdx);
    onChange("media", next);
    setDelIdx(null);
  }

  return (
    <div style={{ padding: "28px 24px 16px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 900, fontSize: 20, color: C.ink, marginBottom: 6 }}>
          Zeig was du kannst
        </div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.55 }}>
          Fotos und Videos machen den Unterschied. Bis zu 8 Medien.
        </div>
      </div>

      {/* Upload-Button */}
      <input ref={inputRef} type="file" accept="image/*,video/*"
        multiple style={{ display: "none" }} onChange={handleFiles} />

      <button onClick={() => inputRef.current?.click()}
        style={{ width: "100%", padding: "22px 20px", marginBottom: 20,
          background: `linear-gradient(160deg, ${C.teal}10, ${C.coral}06)`,
          border: `2px dashed ${C.teal}40`, borderRadius: 20,
          cursor: "pointer", transition: "all 0.2s",
          WebkitTapHighlightColor: "transparent" }}
        onMouseEnter={e => e.currentTarget.style.background = `linear-gradient(160deg, ${C.teal}18, ${C.coral}10)`}
        onMouseLeave={e => e.currentTarget.style.background = `linear-gradient(160deg, ${C.teal}10, ${C.coral}06)`}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
        <div style={{ fontWeight: 800, fontSize: 15, color: C.teal, marginBottom: 3 }}>
          Fotos & Videos hinzufügen
        </div>
        <div style={{ fontSize: 12, color: C.muted }}>
          Tippe hier oder ziehe Dateien rein
        </div>
      </button>

      {/* Vorschau-Grid */}
      {(data.media || []).length > 0 && (
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {(data.media || []).map((m, i) => (
            <div key={i} style={{ position: "relative",
              borderRadius: 14, overflow: "hidden",
              aspectRatio: "1", background: "#000" }}>
              {m.type === "video"
                ? <video src={m.url} style={{ width: "100%", height: "100%",
                    objectFit: "cover" }} />
                : <img src={m.url} alt="" style={{ width: "100%", height: "100%",
                    objectFit: "cover" }} />
              }
              {/* Typ-Badge */}
              <div style={{ position: "absolute", top: 6, left: 6,
                background: "rgba(0,0,0,0.5)", borderRadius: 20,
                padding: "2px 7px", fontSize: 9, fontWeight: 700, color: "white" }}>
                {m.type === "video" ? "🎬" : "📷"}
              </div>
              {/* Löschen */}
              <button onClick={() => confirmDelete(i)}
                style={{ position: "absolute", top: 5, right: 5,
                  width: 26, height: 26, borderRadius: "50%",
                  background: "rgba(255,255,255,0.9)", border: "none",
                  cursor: "pointer", fontSize: 12,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  WebkitTapHighlightColor: "transparent" }}>✕</button>
            </div>
          ))}
          {/* Weiteres hinzufügen */}
          {(data.media || []).length < 8 && (
            <button onClick={() => inputRef.current?.click()}
              style={{ aspectRatio: "1", borderRadius: 14,
                background: `${C.teal}08`,
                border: `2px dashed ${C.teal}30`,
                cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 24, color: C.teal,
                WebkitTapHighlightColor: "transparent" }}>+</button>
          )}
        </div>
      )}

      {/* Löschen-Bestätigung */}
      {delIdx !== null && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500,
          background: "rgba(26,26,46,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 32px" }}>
          <div style={{ background: C.card, borderRadius: 24,
            padding: "28px 24px", textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)", width: "100%" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontWeight: 800, fontSize: 17, color: C.ink, marginBottom: 8 }}>
              Medium löschen?
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 22 }}>
              Das Medium wird aus deinem Beitrag entfernt.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDelIdx(null)}
                style={{ flex: 1, padding: "13px",
                  background: C.surface, border: `1.5px solid ${C.border}`,
                  borderRadius: 14, fontSize: 14, fontWeight: 600,
                  cursor: "pointer", color: C.muted }}>
                Abbrechen
              </button>
              <button onClick={doDelete}
                style={{ flex: 1, padding: "13px",
                  background: C.coral, border: "none",
                  borderRadius: 14, fontSize: 14, fontWeight: 800,
                  cursor: "pointer", color: "white" }}>
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── SCHRITT 4: Ort ─────────────────────────────────── */
function StepLocation({ data, onChange }) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError]     = useState("");

  function requestGPS() {
    if (!navigator.geolocation) {
      setGpsError("GPS nicht verfügbar");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        onChange("lat",  pos.coords.latitude);
        onChange("lng",  pos.coords.longitude);
        setGpsLoading(false);
        // Reverse-Geocode (Nominatim, kein Key nötig)
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
          .then(r => r.json())
          .then(d => {
            const city = d.address?.city || d.address?.town || d.address?.village || "";
            const region = d.address?.state || "";
            if (city) onChange("location", city + (region ? `, ${region}` : ""));
          })
          .catch(() => {});
      },
      () => { setGpsLoading(false); setGpsError("Standort konnte nicht ermittelt werden."); },
      { timeout: 8000 }
    );
  }

  return (
    <div style={{ padding: "28px 24px 16px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 900, fontSize: 20, color: C.ink, marginBottom: 6 }}>
          Wo bist du?
        </div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.55 }}>
          Entdecker in deiner Nähe finden dich einfacher.
        </div>
      </div>

      <Field label="Stadt oder Region" required>
        <Input value={data.location || ""}
          onChange={e => onChange("location", e.target.value)}
          placeholder="z. B. München, Berlin, Zürich" />
      </Field>

      {/* GPS-Button */}
      <button onClick={requestGPS} disabled={gpsLoading}
        style={{ width: "100%", padding: "14px",
          background: data.lat ? `${C.teal}12` : C.surface,
          border: `1.5px solid ${data.lat ? C.teal : C.border}`,
          borderRadius: 16, cursor: gpsLoading ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontSize: 14, fontWeight: 700,
          color: data.lat ? C.teal : C.muted,
          transition: "all 0.2s",
          WebkitTapHighlightColor: "transparent" }}>
        <span style={{ fontSize: 18 }}>
          {gpsLoading ? "⏳" : data.lat ? "✓" : "📍"}
        </span>
        {gpsLoading
          ? "Standort wird ermittelt…"
          : data.lat
            ? "GPS-Standort gespeichert"
            : "Aktuellen Standort verwenden"}
      </button>

      {gpsError && (
        <div style={{ fontSize: 12, color: C.coral, marginTop: 8,
          textAlign: "center" }}>{gpsError}</div>
      )}

      {/* Impact-Hinweis */}
      <div style={{ marginTop: 32, borderRadius: 20,
        background: `linear-gradient(160deg, ${C.teal}10, ${C.coral}06)`,
        border: `1.5px solid ${C.teal}20`,
        padding: "22px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🌱</div>
        <div style={{ fontWeight: 900, fontSize: 16, color: C.ink,
          marginBottom: 8, lineHeight: 1.4 }}>
          Du veränderst die Welt.
        </div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.65 }}>
          Mit jeder Buchung oder jedem Verkauf fließen automatisch
          <strong style={{ color: C.teal }}> 2,5 %</strong> in echte Impact-Projekte —
          ganz ohne Aufwand für dich.
        </div>
      </div>
    </div>
  );
}

/* ─── SCHRITT 5: Vorschau & Veröffentlichen ──────────── */
function StepPublish({ type, data, onPublish, publishing }) {
  const color    = type === "wirker" ? C.teal : C.gold;
  const isWirker = type === "wirker";
  const canPublish = data.title?.trim() && data.description?.trim() && data.price;

  return (
    <div style={{ padding: "28px 24px 16px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 900, fontSize: 20, color: C.ink, marginBottom: 6 }}>
          Fast fertig ✨
        </div>
        <div style={{ fontSize: 13, color: C.muted }}>
          So sieht dein Beitrag aus.
        </div>
      </div>

      {/* Vorschau-Karte */}
      <div style={{ background: C.card, borderRadius: 24,
        overflow: "hidden", marginBottom: 20,
        boxShadow: "0 4px 24px rgba(26,26,46,0.1)" }}>

        {/* Media-Preview */}
        {(data.media || []).length > 0 ? (
          <div style={{ height: 200, overflow: "hidden", background: "#000" }}>
            {data.media[0].type === "video"
              ? <video src={data.media[0].url} style={{ width: "100%", height: "100%",
                  objectFit: "cover" }} muted />
              : <img src={data.media[0].url} alt="" style={{ width: "100%", height: "100%",
                  objectFit: "cover" }} />
            }
            {data.media.length > 1 && (
              <div style={{ position: "absolute", top: 10, right: 10,
                background: "rgba(0,0,0,0.5)", color: "white",
                borderRadius: 20, padding: "3px 10px",
                fontSize: 11, fontWeight: 700 }}>
                +{data.media.length - 1}
              </div>
            )}
          </div>
        ) : (
          <div style={{ height: 120,
            background: `linear-gradient(160deg, ${color}25, ${color}10)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 48 }}>
            {isWirker ? "🤝" : "🎨"}
          </div>
        )}

        <div style={{ padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 17, color: C.ink }}>
                {data.title || "Dein Titel"}
              </div>
              {data.location && (
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  📍 {data.location}
                </div>
              )}
            </div>
            {data.price && (
              <div style={{ fontWeight: 900, fontSize: 16, color: color }}>
                € {data.price}{isWirker ? "/Std." : ""}
              </div>
            )}
          </div>
          {data.description && (
            <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6,
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {data.description}
            </div>
          )}
          {(data.skills || []).length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
              {data.skills.slice(0, 4).map((s, i) => (
                <span key={i} style={{ background: `${color}10`, color,
                  borderRadius: 20, padding: "3px 10px",
                  fontSize: 11, fontWeight: 600 }}>{s}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pflichtfeld-Hinweis */}
      {!canPublish && (
        <div style={{ background: `${C.coral}08`, borderRadius: 14,
          padding: "12px 16px", marginBottom: 16,
          border: `1px solid ${C.coral}20`,
          display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>ℹ️</span>
          <div style={{ fontSize: 12, color: C.coral, lineHeight: 1.55 }}>
            {!data.title?.trim() && "Titel fehlt. "}
            {!data.description?.trim() && "Beschreibung fehlt. "}
            {!data.price && "Preis fehlt."}
          </div>
        </div>
      )}

      {/* Veröffentlichen */}
      <button onClick={canPublish && !publishing ? onPublish : undefined}
        disabled={!canPublish || publishing}
        style={{ width: "100%", padding: "18px",
          background: canPublish
            ? `linear-gradient(135deg, ${C.coral}, ${C.teal})`
            : `${C.border}`,
          color: "white", border: "none", borderRadius: 20,
          fontSize: 16, fontWeight: 900,
          cursor: canPublish && !publishing ? "pointer" : "default",
          boxShadow: canPublish ? `0 8px 28px ${C.coral}30` : "none",
          transition: "all 0.25s",
          display: "flex", alignItems: "center",
          justifyContent: "center", gap: 10,
          WebkitTapHighlightColor: "transparent" }}>
        {publishing ? (
          <><span style={{ fontSize: 20 }}>⏳</span> Wird veröffentlicht…</>
        ) : (
          <><span style={{ fontSize: 20 }}>✨</span> Jetzt veröffentlichen</>
        )}
      </button>
    </div>
  );
}

/* ─── SUCCESS-Screen ─────────────────────────────────── */
function SuccessScreen({ type, data, onClose }) {
  const color = type === "wirker" ? C.teal : C.gold;
  return (
    <div style={{ padding: "60px 32px 32px", textAlign: "center",
      display: "flex", flexDirection: "column",
      alignItems: "center", minHeight: "60vh",
      justifyContent: "center" }}>
      <div className="hui-checkmark-pop" style={{ fontSize: 72, marginBottom: 20 }}>
        {type === "wirker" ? "🤝" : "🎨"}
      </div>
      <div style={{ fontWeight: 900, fontSize: 24, color: C.ink,
        marginBottom: 10, lineHeight: 1.3 }}>
        Dein Beitrag ist live!
      </div>
      <div style={{ fontWeight: 800, fontSize: 18, color, marginBottom: 14 }}>
        „{data.title}"
      </div>
      <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7,
        maxWidth: 280, marginBottom: 32 }}>
        Entdecker in deiner Nähe können dich jetzt finden.
        Mit jeder Buchung fließen automatisch <strong style={{ color: C.teal }}>2,5 %</strong> in echte Impact-Projekte.
      </div>
      <div style={{ background: `${C.teal}08`, borderRadius: 16,
        padding: "14px 20px", border: `1px solid ${C.teal}20`,
        marginBottom: 28 }}>
        <div style={{ fontSize: 13, color: C.teal, fontWeight: 700 }}>🌱 Du veränderst die Welt.</div>
      </div>
      <button onClick={onClose}
        style={{ padding: "16px 40px",
          background: `linear-gradient(135deg, ${C.coral}, ${C.teal})`,
          color: "white", border: "none", borderRadius: 18,
          fontSize: 15, fontWeight: 900, cursor: "pointer",
          boxShadow: `0 6px 20px ${C.coral}30`,
          WebkitTapHighlightColor: "transparent" }}>
        Zum Feed →
      </button>
    </div>
  );
}

/* ─── Haupt-CreateFlow ───────────────────────────────── */
export default function CreateFlow({ onClose }) {
  const STEPS = ["type", "basics", "skills", "media", "location", "publish"];
  const [stepIdx, setStepIdx] = useState(0);
  const [type,    setType]    = useState(null);  // "wirker" | "werk"
  const [data,    setData]    = useState({
    title: "", description: "", price: "",
    shipping: "", skills: [], media: [],
    location: "", lat: null, lng: null,
  });
  const [publishing, setPublishing] = useState(false);
  const [done,       setDone]       = useState(false);
  const contentRef = useRef(null);

  const step = STEPS[stepIdx];
  const isTypeStep = step === "type";
  const totalDots  = STEPS.length - 1; // "type" zählt nicht

  function change(key, val) {
    setData(d => ({ ...d, [key]: val }));
  }

  function next() {
    if (contentRef.current) contentRef.current.scrollTop = 0;
    setStepIdx(i => Math.min(i + 1, STEPS.length - 1));
  }
  function back() {
    if (stepIdx === 0) { onClose(); return; }
    if (contentRef.current) contentRef.current.scrollTop = 0;
    setStepIdx(i => i - 1);
  }

  function selectType(t) {
    setType(t);
    next();
  }

  async function handlePublish() {
    setPublishing(true);
    await new Promise(r => setTimeout(r, 1800));
    setPublishing(false);
    setDone(true);
  }

  // Kann man zum nächsten Schritt?
  const canNext = useCallback(() => {
    if (step === "basics") return data.title.trim() && data.price;
    return true;
  }, [step, data]);

  const color = type === "wirker" ? C.teal : type === "werk" ? C.gold : C.teal;
  const dotIdx = stepIdx - 1; // step 0 ist typeChoice, ab step 1 = dots 0..4

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300,
      background: C.surface, display: "flex",
      flexDirection: "column", overflowY: "hidden" }}>

      {/* ── Top Bar ── */}
      <div style={{ flexShrink: 0, background: C.card,
        borderBottom: `1px solid ${C.border}`,
        padding: "0 16px",
        display: "flex", alignItems: "center",
        height: 56, gap: 12 }}>

        {/* Zurück */}
        <button onClick={back}
          style={{ width: 36, height: 36, borderRadius: "50%",
            background: C.surface, border: `1.5px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 18, flexShrink: 0,
            WebkitTapHighlightColor: "transparent" }}>
          ←
        </button>

        {/* Titel + Dots */}
        <div style={{ flex: 1, textAlign: "center" }}>
          {!isTypeStep && !done && (
            <StepDots total={STEPS.length - 1} current={dotIdx} />
          )}
          {(isTypeStep || done) && (
            <div style={{ fontWeight: 800, fontSize: 15, color: C.ink }}>
              {done ? "Veröffentlicht ✨" : "Neuer Beitrag"}
            </div>
          )}
        </div>

        {/* Abbrechen */}
        <button onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 700, color: C.muted, flexShrink: 0,
            padding: "4px 8px",
            WebkitTapHighlightColor: "transparent" }}>
          ✕
        </button>
      </div>

      {/* ── Scrollbarer Content ── */}
      <div ref={contentRef}
        style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}
        className="scrollbar-hide">

        {done ? (
          <SuccessScreen type={type} data={data} onClose={onClose} />
        ) : step === "type" ? (
          <StepChooseType onSelect={selectType} />
        ) : step === "basics" ? (
          <StepBasics type={type} data={data} onChange={change} />
        ) : step === "skills" ? (
          <StepSkills type={type} data={data} onChange={change} />
        ) : step === "media" ? (
          <StepMedia data={data} onChange={change} />
        ) : step === "location" ? (
          <StepLocation data={data} onChange={change} />
        ) : step === "publish" ? (
          <StepPublish type={type} data={data}
            onPublish={handlePublish} publishing={publishing} />
        ) : null}
      </div>

      {/* ── Bottom Nav ── */}
      {!done && !isTypeStep && (
        <div style={{ flexShrink: 0, background: C.card,
          borderTop: `1px solid ${C.border}`,
          padding: "12px 20px max(16px, env(safe-area-inset-bottom))" }}>
          {step === "publish" ? null : (
            <div style={{ display: "flex", gap: 10 }}>
              {/* Überspringen (nur für optionale Schritte) */}
              {(step === "skills" || step === "media") && (
                <button onClick={next}
                  style={{ flex: 1, padding: "14px",
                    background: "none", border: `1.5px solid ${C.border}`,
                    borderRadius: 16, fontSize: 14, fontWeight: 600,
                    color: C.muted, cursor: "pointer",
                    WebkitTapHighlightColor: "transparent" }}>
                  Überspringen
                </button>
              )}
              <button onClick={canNext() ? next : undefined}
                disabled={!canNext()}
                style={{ flex: 2, padding: "15px",
                  background: canNext()
                    ? `linear-gradient(135deg, ${color}, ${color}CC)`
                    : `${C.border}`,
                  color: "white", border: "none", borderRadius: 16,
                  fontSize: 15, fontWeight: 800,
                  cursor: canNext() ? "pointer" : "default",
                  boxShadow: canNext() ? `0 4px 14px ${color}30` : "none",
                  transition: "all 0.2s",
                  WebkitTapHighlightColor: "transparent" }}>
                {step === "location" ? "Vorschau ansehen →" : "Weiter →"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
