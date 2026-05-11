// CommentSection.jsx — HUI Phase 6
// Echte Supabase-Kommentare: insert, realtime, likes
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

const C = {
  teal:"#16D7C5", coral:"#FF8A6B", gold:"#F5A623",
  ink:"#1A1A1A", muted:"#888", border:"rgba(0,0,0,0.07)",
  card:"#FFFFFF", cream:"#F9F6F2",
};

function Avatar({ profile, size=32 }) {
  if (profile?.avatar_url)
    return <img src={profile.avatar_url} alt=""
      style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />;
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", flexShrink:0,
      background:"linear-gradient(135deg,#16D7C544,#FF8A6B44)",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:700, fontSize:size*0.4, color:C.teal }}>
      {profile?.display_name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

export default function CommentSection({ workId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const [likedMap, setLikedMap] = useState({});
  const inputRef = useRef(null);

  // Load comments
  useEffect(() => {
    if (!workId) return;
    let mounted = true;

    async function load() {
      const { data } = await supabase
        .from("comments")
        .select("id, text, created_at, user_id, profiles(display_name, avatar_url, username)")
        .eq("work_id", workId)
        .order("created_at", { ascending: true })
        .limit(100);
      if (mounted) { setComments(data || []); setLoading(false); }
    }
    load();

    // Realtime
    const channel = supabase.channel("comments:" + workId)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "comments",
        filter: `work_id=eq.${workId}`
      }, async (payload) => {
        // Fetch profile for new comment
        const { data: prof } = await supabase
          .from("profiles").select("display_name, avatar_url, username")
          .eq("id", payload.new.user_id).single();
        if (mounted) setComments(c => [...c, { ...payload.new, profiles: prof || {} }]);
      })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [workId]);

  async function submit() {
    const txt = input.trim();
    if (!txt || !user?.id || sending) return;
    setSending(true);
    setInput("");
    const { error } = await supabase.from("comments")
      .insert({ work_id: workId, user_id: user.id, text: txt });
    if (error) console.error("[Comment]", error.message);
    setSending(false);
  }

  function toggleLike(id) {
    setLikedMap(m => ({ ...m, [id]: !m[id] }));
  }

  if (loading) return (
    <div style={{ padding:"12px 16px", fontSize:13, color:C.muted }}>Lädt...</div>
  );

  return (
    <div style={{ background:C.card, borderRadius:18,
      border:`1px solid ${C.border}`, overflow:"hidden" }}>

      {/* Input */}
      <div style={{ display:"flex", gap:8, padding:"12px 14px",
        borderBottom: comments.length > 0 ? `1px solid ${C.border}` : "none" }}>
        <input ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==="Enter" && submit()}
          placeholder="Kommentar schreiben..."
          style={{ flex:1, border:`1px solid ${C.border}`, borderRadius:50,
            padding:"9px 14px", fontSize:13, color:C.ink,
            fontFamily:"inherit", outline:"none", background:C.cream }} />
        <button onClick={submit}
          disabled={!input.trim() || sending}
          style={{ padding:"9px 16px",
            background:`linear-gradient(135deg,${C.teal},#11C5B7)`,
            border:"none", borderRadius:50, fontSize:13, fontWeight:700,
            color:"white", cursor:"pointer",
            opacity: !input.trim() ? 0.4 : 1, transition:"opacity .2s" }}>
          {sending ? "…" : "→"}
        </button>
      </div>

      {/* List */}
      {comments.length === 0 ? (
        <div style={{ padding:"20px 16px", textAlign:"center",
          fontSize:13, color:C.muted }}>
          Noch kein Kommentar. Sei der Erste.
        </div>
      ) : (
        <div style={{ maxHeight:320, overflowY:"auto" }}>
          {comments.map(c => (
            <div key={c.id} style={{ display:"flex", gap:10,
              padding:"10px 14px", borderBottom:`1px solid ${C.border}` }}>
              <Avatar profile={c.profiles} />
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:6, alignItems:"baseline", marginBottom:2 }}>
                  <span style={{ fontWeight:700, fontSize:12, color:C.ink }}>
                    {c.profiles?.display_name || "Nutzer"}
                  </span>
                  {c.profiles?.username && (
                    <span style={{ fontSize:10, color:C.muted }}>@{c.profiles.username}</span>
                  )}
                  <span style={{ fontSize:10, color:"#CCC", marginLeft:"auto" }}>
                    {new Date(c.created_at).toLocaleDateString("de-DE",{day:"numeric",month:"short"})}
                  </span>
                </div>
                <div style={{ fontSize:13, color:"#3A3A3A", lineHeight:1.55 }}>{c.text}</div>
                <button onClick={() => toggleLike(c.id)}
                  style={{ marginTop:4, background:"none", border:"none",
                    fontSize:11, color: likedMap[c.id] ? C.coral : C.muted,
                    cursor:"pointer", padding:0, fontFamily:"inherit",
                    transition:"color .15s" }}>
                  {likedMap[c.id] ? "❤️" : "🤍"} Gefällt mir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
