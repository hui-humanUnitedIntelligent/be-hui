import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Camera, Settings, Edit3, ChevronRight, LogOut, Bell, Shield, HelpCircle, MapPin, Plus, X } from "lucide-react";

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";
const GOLD = "#F5A623";
const PURPLE = "#A78BFA";

export default function ProfilePage({ onTalentAnbieten, onLogout }) {
  const [supaUser, setSupaUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("profil");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);

  // Eigene Beiträge (für Talente)
  const [beitraege, setBeitraege] = useState([]);
  const [werke, setWerke] = useState([]);
  const [uploadingPost, setUploadingPost] = useState(false);
  const [showAddWerk, setShowAddWerk] = useState(false);
  const [newWerk, setNewWerk] = useState({ titel: "", beschreibung: "", preis: "", bild: null });

  // Edit-State
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editTalent, setEditTalent] = useState("");
  const [editStundensatz, setEditStundensatz] = useState("");
  const [editSkills, setEditSkills] = useState([]);
  const [editTalentType, setEditTalentType] = useState("wirker");

  // Einstellungen
  const [notifBookings, setNotifBookings] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifImpact, setNotifImpact] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      const u = session.user;
      setSupaUser(u);
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", u.id).single();
      const name = prof?.full_name || u.user_metadata?.full_name || u.email?.split("@")[0] || "Mein Profil";
      const merged = {
        id: u.id, email: u.email, name,
        avatar_url: prof?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2ABFAC&color=fff&size=200`,
        header_url: prof?.header_url || null,
        bio: prof?.bio || "",
        location: prof?.location || "",
        website: prof?.website || "",
        talent: prof?.talent || "",
        stundensatz: prof?.stundensatz || "",
        skills: prof?.skills || [],
        talent_type: prof?.talent_type || "wirker",
        role: prof?.role || "entdecker",
        recommendations: prof?.recommendations || 0,
        followers: prof?.followers || 0,
        following_count: prof?.following_count || 0,
        impact_eur: prof?.impact_eur || 0,
        notif_bookings: prof?.notif_bookings !== false,
        notif_messages: prof?.notif_messages !== false,
        notif_impact: prof?.notif_impact !== false,
      };
      setProfile(merged);
      setEditName(merged.name); setEditBio(merged.bio);
      setEditLocation(merged.location); setEditWebsite(merged.website);
      setEditTalent(merged.talent); setEditStundensatz(merged.stundensatz);
      setEditSkills(merged.skills); setEditTalentType(merged.talent_type);
      setNotifBookings(merged.notif_bookings);
      setNotifMessages(merged.notif_messages);
      setNotifImpact(merged.notif_impact);

      // Beiträge laden (für Talente)
      if (merged.role === "wirker" || merged.role === "talent") {
        const { data: b } = await supabase.from("beitraege").select("*").eq("user_id", u.id).order("created_at", { ascending: false });
        if (b) setBeitraege(b);
        const { data: w } = await supabase.from("werke").select("*").eq("user_id", u.id).order("created_at", { ascending: false });
        if (w) setWerke(w);
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  async function uploadToStorage(file, bucket, folder) {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${supaUser.id}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0]; if (!file) return;
    setUploadingAvatar(true);
    try {
      let url;
      try { url = await uploadToStorage(file, "avatars", "profile"); }
      catch { url = await new Promise(r => { const fr = new FileReader(); fr.onload = ev => r(ev.target.result); fr.readAsDataURL(file); }); }
      await supabase.from("profiles").upsert({ id: supaUser.id, avatar_url: url, updated_at: new Date().toISOString() });
      setProfile(p => ({ ...p, avatar_url: url }));
    } catch(e) { console.error(e); }
    setUploadingAvatar(false);
  }

  async function handleHeaderUpload(e) {
    const file = e.target.files[0]; if (!file) return;
    setUploadingHeader(true);
    try {
      let url;
      try { url = await uploadToStorage(file, "headers", "profile"); }
      catch { url = await new Promise(r => { const fr = new FileReader(); fr.onload = ev => r(ev.target.result); fr.readAsDataURL(file); }); }
      await supabase.from("profiles").upsert({ id: supaUser.id, header_url: url, updated_at: new Date().toISOString() });
      setProfile(p => ({ ...p, header_url: url }));
    } catch(e) { console.error(e); }
    setUploadingHeader(false);
  }

  // Post hochladen + in Feed einspeisen
  async function handlePostUpload(e) {
    const file = e.target.files[0]; if (!file || !supaUser) return;
    setUploadingPost(true);
    const isVideo = file.type.startsWith("video/");
    const localUrl = URL.createObjectURL(file);
    const tempItem = { id: "temp_" + Date.now(), src: localUrl, type: isVideo ? "video" : "foto", uploading: true };
    setBeitraege(prev => [tempItem, ...prev]);
    try {
      let url = localUrl;
      try { url = await uploadToStorage(file, "beitraege", "posts"); } catch {}
      const { data: b } = await supabase.from("beitraege").insert({
        user_id: supaUser.id,
        wirker_name: profile.name,
        src: url, url,
        type: isVideo ? "video" : "foto",
        caption: "",
        created_at: new Date().toISOString()
      }).select().single();
      setBeitraege(prev => prev.map(item => item.id === tempItem.id ? { ...(b || tempItem), uploading: false, src: url } : item));
    } catch(e) { console.error(e); setBeitraege(prev => prev.filter(item => item.id !== tempItem.id)); }
    setUploadingPost(false);
  }

  async function saveProfile() {
    if (!supaUser) return; setSaving(true);
    const isTalent = profile.role === "wirker" || profile.role === "talent";
    try {
      await supabase.from("profiles").upsert({
        id: supaUser.id, full_name: editName, bio: editBio,
        location: editLocation, website: editWebsite,
        ...(isTalent ? { talent: editTalent, stundensatz: editStundensatz, skills: editSkills, talent_type: editTalentType } : {}),
        updated_at: new Date().toISOString()
      });
      setProfile(p => ({ ...p, name: editName, bio: editBio, location: editLocation, website: editWebsite, talent: editTalent, stundensatz: editStundensatz, skills: editSkills, talent_type: editTalentType }));
      setEditing(false);
    } catch(e) { console.error(e); }
    setSaving(false);
  }

  async function saveNotifSettings() {
    if (!supaUser) return; setSavingSettings(true);
    await supabase.from("profiles").upsert({ id: supaUser.id, notif_bookings: notifBookings, notif_messages: notifMessages, notif_impact: notifImpact, updated_at: new Date().toISOString() });
    setSavingSettings(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    if (onLogout) onLogout(); else window.location.href = "/login";
  }

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontSize: 32 }}>🌱</div></div>;
  if (!profile) return <div style={{ padding: 32, textAlign: "center", color: "#aaa" }}>Nicht eingeloggt</div>;

  const isTalent = profile.role === "wirker" || profile.role === "talent";
  const typeColor = profile.talent_type === "beides" ? PURPLE : profile.talent_type === "werke" ? GOLD : TEAL;

  // Tabs je nach Rolle
  const tabs = [["profil", "👤", "Profil"], ["einstellungen", "⚙️", "Einstellungen"]];
  if (isTalent) {
    tabs.splice(1, 0, ["beitraege", "⊞", "Beiträge"]);
    if (profile.talent_type === "werke" || profile.talent_type === "beides") tabs.splice(2, 0, ["werke", "🎨", "Werke"]);
  }

  const SKILL_OPTIONS = ["🎨 Kunst", "📷 Foto & Video", "🎵 Musik", "✍️ Texte", "💪 Sport", "🧘 Wellness", "🍳 Kochen", "🔧 Handwerk", "💻 Digital", "📚 Bildung", "🌍 Sonstiges"];

  return (
    <div style={{ minHeight: "100vh", background: "#f8f8f8", paddingBottom: 90 }}>

      {/* ── HEADERBILD ── */}
      <div style={{ position: "relative", height: 160, background: profile.header_url ? "transparent" : `linear-gradient(135deg, ${typeColor}40, ${CORAL}25)`, overflow: "hidden" }}>
        {profile.header_url && <img src={profile.header_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        <label style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.45)", borderRadius: 20, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "white", fontSize: 12, fontWeight: 600 }}>
          <Camera size={13} /> {uploadingHeader ? "..." : "Headerbild ändern"}
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleHeaderUpload} />
        </label>
      </div>

      {/* ── AVATAR & BASIS-INFO ── */}
      <div style={{ background: "white", padding: "0 20px 20px", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginTop: -40, marginBottom: 14 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: "3px solid white", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
              {uploadingAvatar ? <div style={{ width: "100%", height: "100%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>⏳</div>
                : <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            </div>
            <label style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, background: TEAL, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid white" }}>
              <Camera size={12} color="white" />
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
            </label>
          </div>
          <div style={{ flex: 1, paddingTop: 44 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a" }}>{profile.name}</div>
            {isTalent ? (
              <span style={{ background: `${typeColor}15`, color: typeColor, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                {profile.talent_type === "beides" ? "🤝🎨 Wirker & Werke" : profile.talent_type === "werke" ? "🎨 Werke" : "🤝 Wirker"} · {profile.talent || "Talent"}
              </span>
            ) : (
              <span style={{ background: "#f5f5f5", color: "#888", borderRadius: 20, padding: "2px 10px", fontSize: 11 }}>Entdecker</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 0, marginBottom: 14, background: "#f8f8f8", borderRadius: 14, overflow: "hidden" }}>
          {(isTalent
            ? [["Beiträge", beitraege.length], ["Follower", profile.followers], ["Empfehlungen", profile.recommendations]]
            : [["Empfehlungen", profile.recommendations], ["Follower", profile.followers], ["Impact €", profile.impact_eur]]
          ).map(([label, val]) => (
            <div key={label} style={{ flex: 1, textAlign: "center", padding: "12px 8px" }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a" }}>{val}</div>
              <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Bio */}
        {!editing && (
          <div style={{ fontSize: 13, color: profile.bio ? "#444" : "#bbb", lineHeight: 1.6, marginBottom: profile.location || profile.website ? 8 : 14 }}>
            {profile.bio || "Noch keine Bio — tippe auf Bearbeiten"}
          </div>
        )}
        {!editing && (profile.location || profile.website) && (
          <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
            {profile.location && <span style={{ fontSize: 12, color: "#888", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} />{profile.location}</span>}
            {profile.website && <span style={{ fontSize: 12, color: TEAL }}>{profile.website}</span>}
          </div>
        )}

        {/* Edit Form */}
        {editing && (
          <div style={{ marginBottom: 14 }}>
            {[["Name", editName, setEditName, "text", "Dein Name"],
              ["Bio", editBio, setEditBio, "textarea", "Was machst du? Was liebst du?"],
              ["Ort", editLocation, setEditLocation, "text", "z.B. München"],
              ["Website", editWebsite, setEditWebsite, "text", "www.deinname.de"],
              ...(isTalent ? [
                ["Talent / Bezeichnung", editTalent, setEditTalent, "text", "z.B. Fotograf, Yogalehrer..."],
                ["Stundensatz (€)", editStundensatz, setEditStundensatz, "text", "z.B. 80"],
              ] : [])
            ].map(([label, val, setter, type, ph]) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600, marginBottom: 4 }}>{label}</div>
                {type === "textarea"
                  ? <textarea value={val} onChange={e => setter(e.target.value)} rows={3} placeholder={ph}
                      style={{ width: "100%", border: "1.5px solid #eee", borderRadius: 12, padding: "11px 14px", fontSize: 13, outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "inherit" }} />
                  : <input value={val} onChange={e => setter(e.target.value)} placeholder={ph}
                      style={{ width: "100%", border: `1.5px solid ${label === "Name" ? TEAL : "#eee"}`, borderRadius: 12, padding: "11px 14px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                }
              </div>
            ))}

            {/* Talent Type Auswahl (nur für Talente) */}
            {isTalent && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600, marginBottom: 8 }}>Was bietest du an?</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["wirker", "🤝 Wirker"], ["werke", "🎨 Werke"], ["beides", "🤝🎨 Beides"]].map(([key, label]) => (
                    <button key={key} onClick={() => setEditTalentType(key)}
                      style={{ flex: 1, padding: "10px 4px", borderRadius: 12, border: `2px solid ${editTalentType === key ? typeColor : "#eee"}`, background: editTalentType === key ? `${typeColor}12` : "white", fontSize: 11, fontWeight: 700, color: editTalentType === key ? typeColor : "#aaa", cursor: "pointer" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Skills (nur für Talente) */}
            {isTalent && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600, marginBottom: 8 }}>Skills</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {SKILL_OPTIONS.map(s => (
                    <button key={s} onClick={() => setEditSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                      style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${editSkills.includes(s) ? TEAL : "#eee"}`, background: editSkills.includes(s) ? `${TEAL}15` : "white", fontSize: 12, fontWeight: editSkills.includes(s) ? 700 : 400, color: editSkills.includes(s) ? TEAL : "#888", cursor: "pointer" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {editing ? (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setEditing(false)} style={{ flex: 1, background: "#f5f5f5", color: "#666", border: "none", borderRadius: 12, padding: 12, fontSize: 14, cursor: "pointer" }}>Abbrechen</button>
            <button onClick={saveProfile} disabled={saving} style={{ flex: 2, background: `linear-gradient(135deg, ${CORAL}, ${TEAL})`, color: "white", border: "none", borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              {saving ? "Speichern..." : "✓ Speichern"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setEditing(true)} style={{ flex: 1, background: "#f5f5f5", color: "#444", border: "none", borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Edit3 size={14} /> Bearbeiten
            </button>
            {!isTalent && (
              <button onClick={onTalentAnbieten} style={{ flex: 1.5, background: `linear-gradient(135deg, ${CORAL}, ${TEAL})`, color: "white", border: "none", borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                🌟 Talent anbieten
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── TABS ── */}
      <div style={{ background: "white", display: "flex", borderBottom: "1px solid #f0f0f0", marginBottom: 8 }}>
        {tabs.map(([key, icon, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ flex: 1, background: "none", border: "none", padding: "13px 4px", fontSize: 11, fontWeight: tab === key ? 800 : 500, color: tab === key ? typeColor : "#aaa", cursor: "pointer", borderBottom: `2.5px solid ${tab === key ? typeColor : "transparent"}` }}>
            <div style={{ fontSize: 15, marginBottom: 2 }}>{icon}</div>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: PROFIL ── */}
      {tab === "profil" && (
        <div style={{ padding: "0 16px" }}>
          <div style={{ background: "white", borderRadius: 18, padding: "16px 20px", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600, marginBottom: 4 }}>E-Mail</div>
            <div style={{ fontSize: 14, color: "#444" }}>{profile.email}</div>
          </div>

          {/* Talent CTA */}
          {!isTalent && (
            <div onClick={onTalentAnbieten} style={{ background: `linear-gradient(135deg, ${CORAL}10, ${TEAL}10)`, border: `1.5px solid ${TEAL}30`, borderRadius: 18, padding: "18px 20px", marginBottom: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 32 }}>🌟</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a1a", marginBottom: 3 }}>Dein Talent anbieten</div>
                <div style={{ fontSize: 12, color: "#888" }}>Werde Teil der HUI-Community — verdiene Geld, bewege etwas.</div>
              </div>
              <ChevronRight size={18} color="#ccc" />
            </div>
          )}

          {/* Impact */}
          <div style={{ background: "white", borderRadius: 18, padding: "16px 20px", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", marginBottom: 12 }}>🌱 Dein Impact</div>
            <div style={{ display: "flex", gap: 10 }}>
              {[[`${profile.impact_eur} €`, "Gesamt"], ["0", "Projekte"], ["0", "Stimmen"]].map(([val, label]) => (
                <div key={label} style={{ flex: 1, background: "#f8f8f8", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: TEAL }}>{val}</div>
                  <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "white", borderRadius: 18, overflow: "hidden", marginBottom: 12 }}>
            {[["📋", "Meine Buchungen", "Vergangene & offene Buchungen"],
              ["⭐", "Meine Empfehlungen", "Feedbacks die du gegeben hast"],
              ["💬", "Nachrichten", "Chats mit Wirker"]
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 20px", borderBottom: i < 2 ? "1px solid #f5f5f5" : "none", cursor: "pointer" }}>
                <div style={{ fontSize: 22 }}>{item[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{item[1]}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{item[2]}</div>
                </div>
                <ChevronRight size={16} color="#ccc" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: BEITRÄGE (Talent) ── */}
      {tab === "beitraege" && isTalent && (
        <div style={{ padding: "16px" }}>
          <label style={{ display: "block", cursor: "pointer", marginBottom: 16 }}>
            <div style={{ background: `linear-gradient(135deg, ${CORAL}12, ${TEAL}08)`, border: `2px dashed ${TEAL}50`, borderRadius: 18, padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{uploadingPost ? "⏳" : "📸"}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: TEAL }}>{uploadingPost ? "Wird hochgeladen..." : "Foto oder Video hochladen"}</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Erscheint automatisch im HUI-Feed</div>
            </div>
            <input type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handlePostUpload} disabled={uploadingPost} />
          </label>

          {beitraege.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#ccc" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📷</div>
              <div style={{ fontSize: 14 }}>Noch keine Beiträge</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>Deine Posts erscheinen auch im Feed deiner Follower</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3 }}>
              {beitraege.map((b, i) => (
                <div key={b.id || i} style={{ aspectRatio: "1", borderRadius: 4, overflow: "hidden", position: "relative", background: "#111" }}>
                  {b.uploading && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, fontSize: 20 }}>⏳</div>}
                  {b.type === "video"
                    ? <video src={b.src || b.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline />
                    : <img src={b.src || b.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  }
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: WERKE (Talent mit Werke-Typ) ── */}
      {tab === "werke" && isTalent && (
        <div style={{ padding: "16px" }}>
          <button onClick={() => setShowAddWerk(true)} style={{ width: "100%", background: `${GOLD}12`, border: `2px dashed ${GOLD}50`, borderRadius: 18, padding: "18px", textAlign: "center", cursor: "pointer", marginBottom: 16 }}>
            <div style={{ fontSize: 26, marginBottom: 4 }}>🎨</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: GOLD }}>Werk hinzufügen</div>
          </button>

          {werke.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 20px", color: "#ccc" }}>
              <div style={{ fontSize: 14 }}>Noch keine Werke</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {werke.map((w, i) => (
                <div key={w.id || i} style={{ background: "white", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  {(w.bild || w.image) && <img src={w.bild || w.image} alt="" style={{ width: "100%", height: 200, objectFit: "cover" }} />}
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a1a" }}>{w.titel || w.title}</div>
                    {(w.beschreibung || w.description) && <div style={{ fontSize: 13, color: "#777", marginTop: 4 }}>{w.beschreibung || w.description}</div>}
                    {(w.preis || w.price) && <div style={{ fontWeight: 900, fontSize: 17, color: GOLD, marginTop: 8 }}>{w.preis || w.price}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: EINSTELLUNGEN ── */}
      {tab === "einstellungen" && (
        <div style={{ padding: "0 16px" }}>
          <div style={{ background: "white", borderRadius: 18, padding: "16px 20px", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <Bell size={16} color={TEAL} /> Benachrichtigungen
            </div>
            {[["Buchungsanfragen", notifBookings, setNotifBookings],
              ["Neue Nachrichten", notifMessages, setNotifMessages],
              ["Impact & Abstimmungen", notifImpact, setNotifImpact]
            ].map(([label, val, setter]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                <span style={{ fontSize: 14, color: "#444" }}>{label}</span>
                <div onClick={() => setter(!val)} style={{ width: 46, height: 26, borderRadius: 13, background: val ? TEAL : "#e0e0e0", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: val ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                </div>
              </div>
            ))}
            <button onClick={saveNotifSettings} disabled={savingSettings} style={{ width: "100%", marginTop: 14, background: `${TEAL}15`, color: TEAL, border: "none", borderRadius: 12, padding: "11px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              {savingSettings ? "Speichern..." : "Einstellungen speichern"}
            </button>
          </div>

          <div style={{ background: "white", borderRadius: 18, overflow: "hidden", marginBottom: 12 }}>
            {[["🔒", "Datenschutz", "Daten & Privatsphäre"], ["❓", "Hilfe & Support", "Fragen, Feedback, Kontakt"]].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: i === 0 ? "1px solid #f5f5f5" : "none", cursor: "pointer" }}>
                <div style={{ fontSize: 20 }}>{item[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item[1]}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{item[2]}</div>
                </div>
                <ChevronRight size={16} color="#ccc" />
              </div>
            ))}
          </div>

          <div style={{ background: "white", borderRadius: 18, padding: "16px 20px", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#aaa", marginBottom: 3 }}>Version</div>
            <div style={{ fontSize: 14, color: "#666" }}>HUI Beta 0.9</div>
            <div style={{ fontSize: 11, color: "#ccc", marginTop: 4 }}>{profile.email}</div>
          </div>

          <button onClick={handleLogout} style={{ width: "100%", background: "white", color: "#FF4444", border: "1.5px solid #FFE0E0", borderRadius: 18, padding: "16px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
            <LogOut size={18} /> Ausloggen
          </button>
        </div>
      )}
    </div>
  );
}
