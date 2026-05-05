import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Home, Video, Upload, Grid } from "lucide-react";

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";
const GOLD = "#F5A623";
const PURPLE = "#A78BFA";

function ProfilePage({ isNewUser, onViewOwnWirkerProfile, onTalentAnbieten, onOpenChats, following, toggleFollow, showTalentWelcomeHint }) {
  const TEAL = "#2ABFAC";
  const CORAL = "#FF6B6B";
  const GOLD = "#F59E0B";
  const PURPLE = "#A78BFA";

  const [tab, setTab] = React.useState("beitraege"); // beitraege | werke | einstellungen
  const [supaUser, setSupaUser] = React.useState(null);
  const [profile, setProfile] = React.useState(null);
  const [beitraege, setBeitraege] = React.useState([]);
  const [werke, setWerke] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editingHeader, setEditingHeader] = React.useState(false);
  const [editName, setEditName] = React.useState("");
  const [editBio, setEditBio] = React.useState("");
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [showAddWerk, setShowAddWerk] = React.useState(false);
  const [newWerk, setNewWerk] = React.useState({ titel: "", beschreibung: "", preis: "", bild: null });

  // Einstellungen State
  const [talentTyp, setTalentTyp] = React.useState("wirker");
  const [geschaeftsform, setGeschaeftsform] = React.useState("freiberuflich");
  const [kategorien, setKategorien] = React.useState([]);
  const [radius, setRadius] = React.useState(50);
  const [verfuegbarkeit, setVerfuegbarkeit] = React.useState([]);
  const [stundensatz, setStundensatz] = React.useState("");
  const [savingSettings, setSavingSettings] = React.useState(false);

  const kategorienList = ["🎨 Kunst", "📷 Foto & Video", "🎵 Musik", "✍️ Texte", "💪 Sport", "🧘 Wellness", "🍳 Kochen", "🔧 Handwerk", "💻 Digital", "📚 Bildung", "🌍 Sonstiges"];
  const wochentage = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      const u = session.user;
      setSupaUser(u);
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", u.id).single();
      const name = prof?.full_name || u.user_metadata?.full_name || u.email?.split("@")[0] || "Ich";
      const merged = {
        name,
        avatar_url: prof?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2ABFAC&color=fff&size=200`,
        bio: prof?.bio || "",
        talent: prof?.talent || "",
        role: prof?.role || "entdecker",
        talent_type: prof?.talent_type || "wirker",
        geschaeftsform: prof?.geschaeftsform || "freiberuflich",
        kategorien: prof?.kategorien || [],
        radius: prof?.radius || 50,
        verfuegbarkeit: prof?.verfuegbarkeit || [],
        stundensatz: prof?.stundensatz || "",
      };
      setProfile(merged);
      setEditName(merged.name);
      setEditBio(merged.bio);
      setTalentTyp(merged.talent_type);
      setGeschaeftsform(merged.geschaeftsform);
      setKategorien(merged.kategorien);
      setRadius(merged.radius);
      setVerfuegbarkeit(merged.verfuegbarkeit);
      setStundensatz(merged.stundensatz);
      // Lade Beiträge aus DB
      const { data: dbBeitraege } = await supabase
        .from("beitraege")
        .select("*")
        .eq("user_id", u.id)
        .order("created_at", { ascending: false });
      if (dbBeitraege && dbBeitraege.length > 0) setBeitraege(dbBeitraege);
      setLoading(false);
    }
    load();
  }, []);

  const saveProfileHeader = async () => {
    if (!supaUser) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: supaUser.id,
        full_name: editName,
        bio: editBio,
        updated_at: new Date().toISOString()
      });
      if (error) console.error("Profil speichern:", error);
      setProfile(p => ({ ...p, bio: editBio, full_name: editName, name: editName }));
    } catch(e) { console.error(e); }
    setSavingProfile(false);
    setEditingHeader(false);
  };

  const saveSettings = async () => {
    if (!supaUser) return;
    setSavingSettings(true);
    await supabase.from("profiles").upsert({
      id: supaUser.id,
      talent_type: talentTyp,
      geschaeftsform,
      kategorien,
      radius,
      verfuegbarkeit,
      stundensatz,
      updated_at: new Date().toISOString()
    });
    setSavingSettings(false);
    alert("Gespeichert ✅");
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const mediaType = isVideo ? "video" : "foto";
    // Sofort lokal anzeigen (optimistic UI)
    const localUrl = URL.createObjectURL(file);
    const tempId = "temp_" + Date.now();
    setBeitraege(prev => [{ id: tempId, src: localUrl, type: mediaType, uploading: true }, ...prev]);
    // Zeige sofort lokal (funktioniert immer)
    setBeitraege(prev => prev.map(b => b.id === tempId ? { ...b, uploading: false } : b));
    // Versuche im Hintergrund zu speichern
    try {
      const ext = (file.name.split(".").pop() || (isVideo ? "mp4" : "jpg")).toLowerCase();
      const filePath = `beitraege/${supaUser?.id || "anon"}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        console.warn("Storage Upload fehlgeschlagen:", uploadError.message);
        // Trotzdem lokal behalten — kein alert
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(filePath);
      // In DB speichern
      const { data: beitrag, error: dbErr } = await supabase.from("beitraege").insert({
        user_id: supaUser.id,
        src: publicUrl,
        type: mediaType,
        created_at: new Date().toISOString()
      }).select().single();
      if (dbErr) { console.warn("DB Insert fehlgeschlagen:", dbErr.message); return; }
      // Ersetze lokale URL mit persistenter URL
      setBeitraege(prev => prev.map(b => b.id === tempId ? { ...beitrag, src: publicUrl, type: mediaType, uploading: false } : b));
    } catch(err) {
      console.warn("Upload Fehler (ignoriert):", err);
    }
  };

  const handleWerkBild = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setNewWerk(w => ({ ...w, bild: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const addWerk = () => {
    if (!newWerk.titel.trim()) return;
    setWerke(prev => [{ id: Date.now(), ...newWerk }, ...prev]);
    setNewWerk({ titel: "", beschreibung: "", preis: "", bild: null });
    setShowAddWerk(false);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${TEAL}30`, borderTopColor: TEAL, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  const isTalent = profile?.role === "talent";

  return (
    <div style={{ paddingBottom: 80, minHeight: "100vh", background: "#fafafa" }}>

      {/* Talent Welcome Hint */}
      {showTalentWelcomeHint && (
        <div style={{ margin: "16px 16px 0", background: `linear-gradient(135deg, ${CORAL}15, ${TEAL}10)`, border: `1.5px solid ${CORAL}30`, borderRadius: 20, padding: "20px 20px 16px" }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>✨</div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a", marginBottom: 6 }}>Super! Leg hier dein Talent an.</div>
          <div style={{ fontSize: 13, color: "#666", lineHeight: 1.55, marginBottom: 16 }}>Damit andere dich finden können, erstelle jetzt dein Talent-Profil.</div>
          <button onClick={onTalentAnbieten} style={{ background: `linear-gradient(135deg, ${CORAL}, ${TEAL})`, color: "white", border: "none", borderRadius: 14, padding: "13px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%" }}>
            🌟 Talent anbieten
          </button>
        </div>
      )}

      {/* ── PROFIL HEADER ── */}
      <div style={{ background: "white", padding: "24px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img src={profile?.avatar_url} alt="Profil" style={{ width: 86, height: 86, borderRadius: "50%", objectFit: "cover", border: `3px solid ${TEAL}30` }} />
            <label style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, background: TEAL, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid white" }}>
              <span style={{ fontSize: 13, color: "white" }}>✏️</span>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                const file = e.target.files[0];
                if (file) { const r = new FileReader(); r.onload = ev => setProfile(p => ({ ...p, avatar_url: ev.target.result })); r.readAsDataURL(file); }
              }} />
            </label>
          </div>

          {/* Stats */}
          <div style={{ flex: 1 }}>
            {editingHeader ? (
              <input value={editName} onChange={e => setEditName(e.target.value)}
                style={{ width: "100%", border: `1.5px solid ${TEAL}`, borderRadius: 10, padding: "8px 12px", fontSize: 15, fontWeight: 700, marginBottom: 6, outline: "none", boxSizing: "border-box" }} />
            ) : (
              <div style={{ fontWeight: 800, fontSize: 17, color: "#1a1a1a", marginBottom: 6 }}>{profile?.name}</div>
            )}
            <div style={{ display: "flex", gap: 20 }}>
              {[["Beiträge", beitraege.length], ["Werke", werke.length], ["Empfehlungen", 0]].map(([label, val]) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a" }}>{val}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bio */}
        {editingHeader ? (
          <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={3}
            style={{ width: "100%", border: `1.5px solid ${TEAL}`, borderRadius: 12, padding: "10px 12px", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "none", marginBottom: 12 }}
            placeholder="Kurze Bio — was machst du, was liebst du?" />
        ) : (
          <div style={{ fontSize: 13, color: "#444", lineHeight: 1.6, marginBottom: 12 }}>
            {profile?.bio || <span style={{ color: "#ccc" }}>Noch keine Bio — tippe auf Bearbeiten</span>}
          </div>
        )}

        {/* Talent Badge */}
        {isTalent && (
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ background: `${TEAL}15`, color: TEAL, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>✨ Talent</span>
            {profile?.talent_type && <span style={{ background: "#f5f5f5", color: "#666", borderRadius: 20, padding: "4px 12px", fontSize: 12 }}>{profile.talent_type === "wirker" ? "🤝 Wirker" : profile.talent_type === "werke" ? "🎨 Werke" : "🤝🎨 Beides"}</span>}
          </div>
        )}

        {/* Edit / Save Buttons */}
        {editingHeader ? (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setEditingHeader(false)} style={{ flex: 1, background: "#f5f5f5", color: "#666", border: "none", borderRadius: 12, padding: "11px", fontSize: 14, cursor: "pointer" }}>Abbrechen</button>
            <button onClick={saveProfileHeader} disabled={savingProfile} style={{ flex: 2, background: `linear-gradient(135deg, ${CORAL}, ${TEAL})`, color: "white", border: "none", borderRadius: 12, padding: "11px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              {savingProfile ? "..." : "Speichern"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setEditingHeader(true)} style={{ flex: 1, background: "#f5f5f5", color: "#444", border: "none", borderRadius: 12, padding: "11px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>✏️ Bearbeiten</button>
            {!isTalent && (
              <button onClick={onTalentAnbieten} style={{ flex: 1, background: `linear-gradient(135deg, ${CORAL}, ${TEAL})`, color: "white", border: "none", borderRadius: 12, padding: "11px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>🌟 Talent anbieten</button>
            )}
          </div>
        )}
      </div>

      {/* ── TABS ── */}
      <div style={{ background: "white", borderBottom: "1px solid #f0f0f0", display: "flex", marginTop: 2 }}>
        {[["beitraege", "⊞", "Beiträge"], ["werke", "🎨", "Werke"], ...(isTalent ? [["einstellungen", "⚙️", "Einstellungen"]] : [])].map(([key, icon, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ flex: 1, background: "none", border: "none", padding: "14px 8px", fontSize: 12, fontWeight: tab === key ? 800 : 500, color: tab === key ? TEAL : "#aaa", cursor: "pointer", borderBottom: `2.5px solid ${tab === key ? TEAL : "transparent"}`, transition: "all 0.2s" }}>
            <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: BEITRÄGE ── */}
      {tab === "beitraege" && (
        <div style={{ padding: "16px" }}>
          {/* Upload Button */}
          <label style={{ display: "block", cursor: "pointer", marginBottom: 16 }}>
            <div style={{ background: `linear-gradient(135deg, ${CORAL}15, ${TEAL}10)`, border: `2px dashed ${TEAL}50`, borderRadius: 18, padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>📸</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: TEAL }}>Foto oder Video hochladen</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Erscheint auch im Home-Feed</div>
            </div>
            <input type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handlePhotoUpload} />
          </label>
          {/* Grid */}
          {beitraege.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#ccc" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📷</div>
              <div style={{ fontSize: 14 }}>Noch keine Beiträge</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3 }}>
              {beitraege.map(b => (
                <div key={b.id} style={{ aspectRatio: "1", borderRadius: 4, overflow: "hidden", position: "relative", background: "#111" }}>
                  {b.uploading && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                      <div style={{ color: "white", fontSize: 12 }}>⏳</div>
                    </div>
                  )}
                  {b.type === "video"
                    ? <video src={b.src} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline />
                    : <img src={b.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  }
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: WERKE ── */}
      {tab === "werke" && (
        <div style={{ padding: "16px" }}>
          {/* Werk hinzufügen */}
          {!showAddWerk ? (
            <button onClick={() => setShowAddWerk(true)} style={{ width: "100%", background: `linear-gradient(135deg, ${PURPLE}15, ${TEAL}10)`, border: `2px dashed ${PURPLE}50`, borderRadius: 18, padding: "20px", textAlign: "center", cursor: "pointer", marginBottom: 16 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🎨</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: PURPLE }}>Werk hinzufügen</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Mit Titel, Preis und Beschreibung</div>
            </button>
          ) : (
            <div style={{ background: "white", borderRadius: 20, padding: "20px", marginBottom: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Neues Werk</div>
              {/* Bild */}
              <label style={{ display: "block", cursor: "pointer", marginBottom: 14 }}>
                <div style={{ height: 160, borderRadius: 14, background: newWerk.bild ? "transparent" : "#f5f5f5", border: `2px dashed ${PURPLE}40`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {newWerk.bild ? <img src={newWerk.bild} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ textAlign: "center", color: "#aaa" }}><div style={{ fontSize: 30 }}>🖼️</div><div style={{ fontSize: 12, marginTop: 4 }}>Bild hochladen</div></div>}
                </div>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleWerkBild} />
              </label>
              <input value={newWerk.titel} onChange={e => setNewWerk(w => ({ ...w, titel: e.target.value }))} placeholder="Titel" style={{ width: "100%", border: "1.5px solid #eee", borderRadius: 12, padding: "12px 14px", fontSize: 14, marginBottom: 10, outline: "none", boxSizing: "border-box" }} />
              <textarea value={newWerk.beschreibung} onChange={e => setNewWerk(w => ({ ...w, beschreibung: e.target.value }))} placeholder="Beschreibung (optional)" rows={2} style={{ width: "100%", border: "1.5px solid #eee", borderRadius: 12, padding: "12px 14px", fontSize: 14, marginBottom: 10, outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "inherit" }} />
              <input value={newWerk.preis} onChange={e => setNewWerk(w => ({ ...w, preis: e.target.value }))} placeholder="Preis (z.B. 120 €)" style={{ width: "100%", border: "1.5px solid #eee", borderRadius: 12, padding: "12px 14px", fontSize: 14, marginBottom: 14, outline: "none", boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowAddWerk(false)} style={{ flex: 1, background: "#f5f5f5", color: "#666", border: "none", borderRadius: 12, padding: "12px", cursor: "pointer" }}>Abbrechen</button>
                <button onClick={addWerk} style={{ flex: 2, background: `linear-gradient(135deg, ${PURPLE}, ${TEAL})`, color: "white", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, cursor: "pointer" }}>Werk speichern</button>
              </div>
            </div>
          )}
          {/* Werke Liste */}
          {werke.length === 0 && !showAddWerk ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#ccc" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🎨</div>
              <div style={{ fontSize: 14 }}>Noch keine Werke — füge dein erstes hinzu!</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {werke.map(w => (
                <div key={w.id} style={{ background: "white", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  {w.bild && <img src={w.bild} alt={w.titel} style={{ width: "100%", height: 200, objectFit: "cover" }} />}
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{w.titel}</div>
                    {w.beschreibung && <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>{w.beschreibung}</div>}
                    {w.preis && <div style={{ fontWeight: 800, color: TEAL, fontSize: 15 }}>{w.preis}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: EINSTELLUNGEN ── */}
      {tab === "einstellungen" && (
        <div style={{ padding: "16px" }}>

          {/* Talenttyp */}
          <div style={{ background: "white", borderRadius: 18, padding: "18px 16px", marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>🎯 Art des Talents</div>
            {[["wirker", "🤝", "Wirker", "Fähigkeiten & Dienstleistungen"], ["werke", "🎨", "Werke & Erlebnisse", "Produkte & Erlebnisse verkaufen"], ["beides", "✨", "Beides", "Wirker & Werke kombiniert"]].map(([key, icon, label, sub]) => (
              <div key={key} onClick={() => setTalentTyp(key)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: key !== "beides" ? "1px solid #f5f5f5" : "none", cursor: "pointer" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: talentTyp === key ? `${TEAL}20` : "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: talentTyp === key ? TEAL : "#222" }}>{label}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{sub}</div>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${talentTyp === key ? TEAL : "#ddd"}`, background: talentTyp === key ? TEAL : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {talentTyp === key && <div style={{ width: 8, height: 8, background: "white", borderRadius: "50%" }} />}
                </div>
              </div>
            ))}
          </div>

          {/* Geschäftsform */}
          <div style={{ background: "white", borderRadius: 18, padding: "18px 16px", marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>🏢 Geschäftsform</div>
            {[["freiberuflich", "Selbstständig / Freiberuflich"], ["gewerbe", "Gewerbe"], ["verein", "Verein / Organisation"], ["hobby", "Hobby / Nebenberuflich"]].map(([key, label], i, arr) => (
              <div key={key} onClick={() => setGeschaeftsform(key)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: i < arr.length - 1 ? "1px solid #f5f5f5" : "none", cursor: "pointer" }}>
                <span style={{ fontSize: 14, fontWeight: geschaeftsform === key ? 700 : 400, color: geschaeftsform === key ? TEAL : "#444" }}>{label}</span>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${geschaeftsform === key ? TEAL : "#ddd"}`, background: geschaeftsform === key ? TEAL : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {geschaeftsform === key && <div style={{ width: 8, height: 8, background: "white", borderRadius: "50%" }} />}
                </div>
              </div>
            ))}
          </div>

          {/* Kategorien */}
          <div style={{ background: "white", borderRadius: 18, padding: "18px 16px", marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>🏷️ Kategorien</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {kategorienList.map(k => (
                <button key={k} onClick={() => setKategorien(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])}
                  style={{ background: kategorien.includes(k) ? `${TEAL}15` : "#f5f5f5", color: kategorien.includes(k) ? TEAL : "#666", border: `1.5px solid ${kategorien.includes(k) ? TEAL : "transparent"}`, borderRadius: 20, padding: "7px 14px", fontSize: 13, fontWeight: kategorien.includes(k) ? 700 : 400, cursor: "pointer" }}>
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Radius */}
          <div style={{ background: "white", borderRadius: 18, padding: "18px 16px", marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>📍 Reisebereitschaft</div>
            <div style={{ fontSize: 13, color: "#aaa", marginBottom: 14 }}>Bis wie weit bist du bereit zu reisen?</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <input type="range" min={5} max={200} value={radius} onChange={e => setRadius(Number(e.target.value))} style={{ flex: 1 }} />
              <span style={{ fontWeight: 800, color: TEAL, fontSize: 16, minWidth: 60 }}>{radius} km</span>
            </div>
          </div>

          {/* Verfügbarkeit */}
          <div style={{ background: "white", borderRadius: 18, padding: "18px 16px", marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>📅 Verfügbarkeit</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(d => (
                <button key={d} onClick={() => setVerfuegbarkeit(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                  style={{ width: 44, height: 44, borderRadius: 12, background: verfuegbarkeit.includes(d) ? TEAL : "#f5f5f5", color: verfuegbarkeit.includes(d) ? "white" : "#666", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Preise */}
          <div style={{ background: "white", borderRadius: 18, padding: "18px 16px", marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>💰 Preiseinstellungen</div>
            <div style={{ fontSize: 12, color: "#aaa", marginBottom: 8 }}>STUNDENSATZ</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <input value={stundensatz} onChange={e => setStundensatz(e.target.value)} placeholder="z.B. 85" style={{ flex: 1, border: "1.5px solid #eee", borderRadius: 12, padding: "12px 14px", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
              <span style={{ fontWeight: 700, color: "#444", fontSize: 15 }}>€ / Std.</span>
            </div>
            <div style={{ fontSize: 11, color: "#ccc" }}>Paketpreise kannst du bei deinen Werken einstellen</div>
          </div>

          {/* Speichern */}
          <button onClick={saveSettings} disabled={savingSettings} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${TEAL})`, color: "white", border: "none", borderRadius: 16, padding: "16px", fontSize: 16, fontWeight: 800, cursor: "pointer", marginBottom: 20 }}>
            {savingSettings ? "Wird gespeichert..." : "Einstellungen speichern"}
          </button>
        </div>
      )}
    </div>
  );
}



// ═══════════════════════════════════════════════════════
// WELCOME ONBOARDING
// ═══════════════════════════════════════════════════════

export default ProfilePage;
