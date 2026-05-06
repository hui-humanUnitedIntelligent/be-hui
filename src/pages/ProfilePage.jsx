import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Camera, Settings, Edit3, Star, MapPin, ChevronRight, Check, X, Upload, LogOut, Bell, Shield, HelpCircle, ChevronDown } from "lucide-react";

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";
const GOLD = "#F5A623";
const PURPLE = "#A78BFA";

const KATEGORIEN_LIST = ["🎨 Kunst", "📷 Foto & Video", "🎵 Musik", "✍️ Texte", "💪 Sport", "🧘 Wellness", "🍳 Kochen", "🔧 Handwerk", "💻 Digital", "📚 Bildung", "🌍 Sonstiges"];

export default function ProfilePage({ onTalentAnbieten, onLogout }) {
  const [supaUser, setSupaUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("profil"); // profil | einstellungen
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);

  // Edit-State
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editWebsite, setEditWebsite] = useState("");

  // Einstellungen-State
  const [notifBookings, setNotifBookings] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifImpact, setNotifImpact] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

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
        id: u.id,
        email: u.email,
        name,
        avatar_url: prof?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2ABFAC&color=fff&size=200`,
        header_url: prof?.header_url || null,
        bio: prof?.bio || "",
        location: prof?.location || "",
        website: prof?.website || "",
        role: prof?.role || "entdecker",
        recommendations: prof?.recommendations || 0,
        followers: prof?.followers || 0,
        following: prof?.following || 0,
      };
      setProfile(merged);
      setEditName(merged.name);
      setEditBio(merged.bio);
      setEditLocation(merged.location);
      setEditWebsite(merged.website);
      // Notification-Einstellungen laden
      if (prof?.notif_bookings !== undefined) setNotifBookings(prof.notif_bookings);
      if (prof?.notif_messages !== undefined) setNotifMessages(prof.notif_messages);
      if (prof?.notif_impact !== undefined) setNotifImpact(prof.notif_impact);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function uploadImage(file, bucket, folder) {
    const ext = file.name.split('.').pop();
    const path = `${folder}/${supaUser.id}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file || !supaUser) return;
    setUploadingAvatar(true);
    try {
      let url;
      try {
        url = await uploadImage(file, "avatars", "profile");
      } catch {
        // Fallback: base64 local preview + save as data URL
        url = await new Promise(resolve => {
          const r = new FileReader();
          r.onload = ev => resolve(ev.target.result);
          r.readAsDataURL(file);
        });
      }
      await supabase.from("profiles").upsert({ id: supaUser.id, avatar_url: url, updated_at: new Date().toISOString() });
      setProfile(p => ({ ...p, avatar_url: url }));
    } catch (e) { console.error(e); }
    setUploadingAvatar(false);
  }

  async function handleHeaderUpload(e) {
    const file = e.target.files[0];
    if (!file || !supaUser) return;
    setUploadingHeader(true);
    try {
      let url;
      try {
        url = await uploadImage(file, "headers", "profile");
      } catch {
        url = await new Promise(resolve => {
          const r = new FileReader();
          r.onload = ev => resolve(ev.target.result);
          r.readAsDataURL(file);
        });
      }
      await supabase.from("profiles").upsert({ id: supaUser.id, header_url: url, updated_at: new Date().toISOString() });
      setProfile(p => ({ ...p, header_url: url }));
    } catch (e) { console.error(e); }
    setUploadingHeader(false);
  }

  async function saveProfile() {
    if (!supaUser) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: supaUser.id,
        full_name: editName,
        bio: editBio,
        location: editLocation,
        website: editWebsite,
        updated_at: new Date().toISOString()
      });
      if (!error) {
        setProfile(p => ({ ...p, name: editName, bio: editBio, location: editLocation, website: editWebsite }));
        setEditing(false);
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function saveNotifSettings() {
    if (!supaUser) return;
    setSavingSettings(true);
    await supabase.from("profiles").upsert({
      id: supaUser.id,
      notif_bookings: notifBookings,
      notif_messages: notifMessages,
      notif_impact: notifImpact,
      updated_at: new Date().toISOString()
    });
    setSavingSettings(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    if (onLogout) onLogout();
    else window.location.href = "/login";
  }

  const isTalent = profile?.role === "wirker" || profile?.role === "talent";

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 32 }}>🌱</div>
    </div>
  );

  if (!profile) return (
    <div style={{ padding: 32, textAlign: "center", color: "#aaa" }}>Nicht eingeloggt</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8f8f8", paddingBottom: 90 }}>

      {/* ── HEADER BILD ── */}
      <div style={{ position: "relative", height: 160, background: profile.header_url ? "transparent" : `linear-gradient(135deg, ${TEAL}40, ${CORAL}30)`, overflow: "hidden" }}>
        {profile.header_url
          ? <img src={profile.header_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 40, opacity: 0.3 }}>🌿</span>
            </div>
        }
        {/* Header Upload Button */}
        <label style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.45)", borderRadius: 20, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "white", fontSize: 12, fontWeight: 600 }}>
          <Camera size={14} /> {uploadingHeader ? "..." : "Headerbild"}
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleHeaderUpload} />
        </label>
      </div>

      {/* ── AVATAR & NAME ── */}
      <div style={{ background: "white", padding: "0 20px 20px", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginTop: -40, marginBottom: 14 }}>
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: "3px solid white", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
              {uploadingAvatar
                ? <div style={{ width: "100%", height: "100%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⏳</div>
                : <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              }
            </div>
            <label style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, background: TEAL, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid white" }}>
              <Camera size={12} color="white" />
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
            </label>
          </div>

          {/* Name + Badge */}
          <div style={{ flex: 1, paddingTop: 44 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a" }}>{profile.name}</div>
            {isTalent && <span style={{ background: `${TEAL}15`, color: TEAL, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>✨ Talent</span>}
          </div>
        </div>

        {/* Bio */}
        {!editing && (
          <div style={{ fontSize: 13, color: profile.bio ? "#444" : "#bbb", lineHeight: 1.6, marginBottom: 10 }}>
            {profile.bio || "Noch keine Bio — tippe auf Bearbeiten"}
          </div>
        )}

        {/* Location + Website */}
        {!editing && (profile.location || profile.website) && (
          <div style={{ display: "flex", gap: 14, marginBottom: 12, flexWrap: "wrap" }}>
            {profile.location && <span style={{ fontSize: 12, color: "#888", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} />{profile.location}</span>}
            {profile.website && <span style={{ fontSize: 12, color: TEAL }}>{profile.website}</span>}
          </div>
        )}

        {/* Stats */}
        {!editing && (
          <div style={{ display: "flex", gap: 0, marginBottom: 16, background: "#f8f8f8", borderRadius: 14, overflow: "hidden" }}>
            {[["Empfehlungen", profile.recommendations], ["Follower", profile.followers], ["Folge ich", profile.following]].map(([label, val]) => (
              <div key={label} style={{ flex: 1, textAlign: "center", padding: "12px 8px" }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a" }}>{val}</div>
                <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── EDIT FORM ── */}
        {editing && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600, marginBottom: 4, marginTop: 8 }}>Name</div>
            <input value={editName} onChange={e => setEditName(e.target.value)}
              style={{ width: "100%", border: `1.5px solid ${TEAL}`, borderRadius: 12, padding: "11px 14px", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
            <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600, marginBottom: 4 }}>Bio</div>
            <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={3}
              style={{ width: "100%", border: "1.5px solid #eee", borderRadius: 12, padding: "11px 14px", fontSize: 13, outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "inherit", marginBottom: 10 }}
              placeholder="Was machst du? Was liebst du?" />
            <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600, marginBottom: 4 }}>Ort</div>
            <input value={editLocation} onChange={e => setEditLocation(e.target.value)}
              style={{ width: "100%", border: "1.5px solid #eee", borderRadius: 12, padding: "11px 14px", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 10 }}
              placeholder="z.B. München" />
            <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600, marginBottom: 4 }}>Website</div>
            <input value={editWebsite} onChange={e => setEditWebsite(e.target.value)}
              style={{ width: "100%", border: "1.5px solid #eee", borderRadius: 12, padding: "11px 14px", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14 }}
              placeholder="z.B. www.deinname.de" />
          </div>
        )}

        {/* ── ACTION BUTTONS ── */}
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
              <Edit3 size={15} /> Bearbeiten
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
        {[["profil", "👤", "Mein Profil"], ["einstellungen", "⚙️", "Einstellungen"]].map(([key, icon, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ flex: 1, background: "none", border: "none", padding: "14px 8px", fontSize: 12, fontWeight: tab === key ? 800 : 500, color: tab === key ? TEAL : "#aaa", cursor: "pointer", borderBottom: `2.5px solid ${tab === key ? TEAL : "transparent"}` }}>
            <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: PROFIL ── */}
      {tab === "profil" && (
        <div style={{ padding: "0 16px" }}>
          {/* Email-Info */}
          <div style={{ background: "white", borderRadius: 18, padding: "16px 20px", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600, marginBottom: 4 }}>E-Mail</div>
            <div style={{ fontSize: 14, color: "#444" }}>{profile.email}</div>
          </div>

          {/* Talent anbieten CTA (für Basis-Nutzer) */}
          {!isTalent && (
            <div onClick={onTalentAnbieten} style={{ background: `linear-gradient(135deg, ${CORAL}10, ${TEAL}10)`, border: `1.5px solid ${TEAL}30`, borderRadius: 18, padding: "18px 20px", marginBottom: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 32 }}>🌟</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a1a", marginBottom: 3 }}>Dein Talent anbieten</div>
                <div style={{ fontSize: 12, color: "#888" }}>Werde Teil der HUI-Community — teile dein Können, verdiene Geld, bewege etwas.</div>
              </div>
              <ChevronRight size={18} color="#ccc" />
            </div>
          )}

          {/* Impact-Übersicht */}
          <div style={{ background: "white", borderRadius: 18, padding: "16px 20px", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", marginBottom: 12 }}>🌱 Dein Impact</div>
            <div style={{ display: "flex", gap: 10 }}>
              {[["0 €", "Gesamt gespendet"], ["0", "Projekte unterstützt"], ["0", "Abstimmungen"]].map(([val, label]) => (
                <div key={label} style={{ flex: 1, background: "#f8f8f8", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: TEAL }}>{val}</div>
                  <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Buchungsverlauf Link */}
          <div style={{ background: "white", borderRadius: 18, overflow: "hidden", marginBottom: 12 }}>
            {[
              { icon: "📋", label: "Meine Buchungen", sub: "Alle vergangenen & offenen Buchungen" },
              { icon: "⭐", label: "Meine Empfehlungen", sub: "Feedbacks die du gegeben hast" },
              { icon: "💬", label: "Nachrichten", sub: "Chats mit Wirker" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 20px", borderBottom: i < 2 ? "1px solid #f5f5f5" : "none", cursor: "pointer" }}
                onClick={() => {}}>
                <div style={{ fontSize: 22 }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{item.sub}</div>
                </div>
                <ChevronRight size={16} color="#ccc" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: EINSTELLUNGEN ── */}
      {tab === "einstellungen" && (
        <div style={{ padding: "0 16px" }}>

          {/* Benachrichtigungen */}
          <div style={{ background: "white", borderRadius: 18, padding: "16px 20px", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <Bell size={16} color={TEAL} /> Benachrichtigungen
            </div>
            {[
              ["Buchungsanfragen", notifBookings, setNotifBookings],
              ["Neue Nachrichten", notifMessages, setNotifMessages],
              ["Impact & Abstimmungen", notifImpact, setNotifImpact],
            ].map(([label, val, setter]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                <span style={{ fontSize: 14, color: "#444" }}>{label}</span>
                <div onClick={() => { setter(!val); }} style={{ width: 46, height: 26, borderRadius: 13, background: val ? TEAL : "#e0e0e0", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: val ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                </div>
              </div>
            ))}
            <button onClick={saveNotifSettings} disabled={savingSettings} style={{ width: "100%", marginTop: 14, background: savingSettings ? "#f0f0f0" : `${TEAL}15`, color: TEAL, border: "none", borderRadius: 12, padding: "11px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              {savingSettings ? "Speichern..." : "Einstellungen speichern"}
            </button>
          </div>

          {/* Konto */}
          <div style={{ background: "white", borderRadius: 18, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", gap: 12 }}>
              <Shield size={16} color="#888" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>Datenschutz</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>Daten & Privatsphäre</div>
              </div>
              <ChevronRight size={16} color="#ccc" />
            </div>
            <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
              <HelpCircle size={16} color="#888" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>Hilfe & Support</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>Fragen, Feedback, Kontakt</div>
              </div>
              <ChevronRight size={16} color="#ccc" />
            </div>
          </div>

          {/* App-Info */}
          <div style={{ background: "white", borderRadius: 18, padding: "16px 20px", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#aaa", marginBottom: 4 }}>Version</div>
            <div style={{ fontSize: 14, color: "#666" }}>HUI Beta 0.9</div>
            <div style={{ fontSize: 11, color: "#ccc", marginTop: 4 }}>{profile.email}</div>
          </div>

          {/* Logout */}
          <button onClick={handleLogout} style={{ width: "100%", background: "white", color: "#FF4444", border: "1.5px solid #FFE0E0", borderRadius: 18, padding: "16px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
            <LogOut size={18} /> Ausloggen
          </button>
        </div>
      )}
    </div>
  );
}
