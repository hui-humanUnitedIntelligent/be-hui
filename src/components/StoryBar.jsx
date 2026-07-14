import { HUIChatIcon } from '../design/icons/HuiInteractionIcons.jsx';
// StoryBar.jsx + StoryViewer.jsx — HUI Premium v2
// Phase 1: Progress bars, auto-advance, tap nav, hold-to-pause,
//          reactions, quick reply, seen state, gradient rings
// Phase 2: Highlights row on profile

import { HUIAnsichtIcon, HUIAwardIcon,
  HUILocationIcon,
} from '../design/icons/HuiSystemIcons.jsx';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { HUI } from "../design/hui.design.js";

const C = {
  teal:HUI.COLOR.teal, coral:HUI.COLOR.coral, gold:HUI.COLOR.gold,
  ink:HUI.COLOR.ink, muted:'#888', cream:HUI.COLOR.cream,
};

const CSS = `
  @keyframes huiRing{0%,100%{opacity:1}50%{opacity:.5}}
  @keyframes huiIn{from{opacity:0;transform:scale(1.03)}to{opacity:1;transform:scale(1)}}
  @keyframes huiUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
  @keyframes huiBar{from{width:0%}to{width:100%}}
  @keyframes huiEmoji{
    0%{transform:translate(-50%,-50%) scale(0) rotate(-20deg);opacity:0}
    60%{transform:translate(-50%,-50%) scale(1.25) rotate(4deg);opacity:1}
    100%{transform:translate(-50%,-50%) scale(1) rotate(0deg);opacity:1}}
  @keyframes huiPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
  @keyframes huiKenBurns{
    0%{transform:scale(1) translate(0,0)}
    100%{transform:scale(1.06) translate(-1%,-1%)}}
  @keyframes huiFadeIn{from{opacity:0}to{opacity:1}}
  .hui-sv-tap{-webkit-tap-highlight-color:transparent;cursor:pointer;user-select:none}
  .hui-sv-tap:active{opacity:.82}
  .hui-no-scroll::-webkit-scrollbar{display:none}
  .hui-no-scroll{-ms-overflow-style:none;scrollbar-width:none}
`;

// ── REACTIONS ────────────────────────────────────────────────────────
const REACTIONS = ['❤️','🔥','👏','😮'];

// ── STORY BAR ────────────────────────────────────────────────────────
export function StoryBar({ onStoryClick }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [viewedIds, setViewedIds] = useState(new Set());

  useEffect(() => { loadStories(); }, [user?.id]);

  async function loadStories() {
    const now = new Date().toISOString();
    // FIX: stories-Tabelle hat kein 'status'-Feld → war silent fail (0 Ergebnisse)
    // FIX: username/avatar_url nicht in stories → via profile join laden
    const { data, error } = await supabase
      .from('stories')
      .select(`
        id, user_id, media_url, media_type, caption, text_overlay,
        is_highlight, created_at, expires_at,
        profile:user_id(display_name, avatar_url)
      `)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false })
      .limit(50);
    console.info('[StoryBar] Query result:', { count: data?.length, error: error?.message });

    if (error) { console.warn('[StoryBar] load error:', error.message); return; }
    if (!data?.length) return;

    // Load viewed story IDs for current user
    if (user?.id) {
      const { data: views } = await supabase
        .from('story_views')
        .select('story_id')
        .eq('viewer_id', user.id);
      if (views && Array.isArray(views)) setViewedIds(new Set(views.filter(v=>v&&v.story_id).map(v => v.story_id)));
    }

    // Group by user_id
    // FIX: username/avatar_url kommen jetzt aus profile-join
    const map = {};
    for (const s of data) {
      const uid = s.user_id;
      const displayName = s.profile?.display_name || 'Anonym';
      const avatarUrl   = s.profile?.avatar_url   || null;
      if (!map[uid]) map[uid] = { uid, username: displayName, avatar_url: avatarUrl, stories: [] };
      map[uid].stories.push({ ...s, username: displayName, avatar_url: avatarUrl });
    }
    console.info('[StoryBar] Groups built:', Object.keys(map||{}).length);
    setGroups(Object.values(map||{}));
  }

  if (!groups.length) return null;

  return (
    <>
      <style>{CSS}</style>
      <div style={{ padding:'16px 0 8px' }}>
        <div className="hui-no-scroll" style={{
          display:'flex', gap:14, overflowX:'auto',
          padding:'0 20px', scrollSnapType:'x mandatory',
          WebkitOverflowScrolling:'touch',
        }}>
          {groups.map((g, i) => {
            const hasUnread = g.stories.some(s => !viewedIds.has(s.id));
            const cover = g.stories[0];
            return (
              <div key={g.uid}
                className="hui-sv-tap"
                onClick={() => onStoryClick?.({ group: g, startIdx: 0, allGroups: groups, groupIdx: i, viewedIds })}
                style={{ scrollSnapAlign:'start', display:'flex', flexDirection:'column',
                  alignItems:'center', gap:6, flexShrink:0 }}>
                {/* Ring */}
                <div style={{
                  width:68, height:68, borderRadius:'50%', padding:3,
                  background: hasUnread
                    ? `linear-gradient(135deg, ${C.teal}, ${C.coral}, ${C.gold})`
                    : 'rgba(0,0,0,0.12)',
                  animation: hasUnread ? 'huiPulse 2.5s ease-in-out infinite' : 'none',
                }}>
                  <div style={{ width:'100%', height:'100%', borderRadius:'50%',
                    overflow:'hidden', border:'2.5px solid white', background: C.cream }}>
                    {cover?.avatar_url ? (
                      <img loading="eager" decoding="async" src={cover.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    ) : cover?.media_url ? (
                      <img loading="eager" decoding="async" src={cover.media_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    ) : (
                      <div style={{ width:'100%', height:'100%', background:`linear-gradient(135deg,${C.teal}22,${C.coral}22)`,
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>✦</div>
                    )}
                  </div>
                </div>
                {/* Name */}
                <span style={{ fontSize:11, fontWeight: hasUnread ? 700 : 500,
                  color: hasUnread ? C.ink : C.muted,
                  maxWidth:68, textAlign:'center',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {g.username}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── STORY VIEWER ─────────────────────────────────────────────────────
// v3 — Immersive, emotional, modern. HUI-Stil: ruhig, hochwertig.
// Neu: Ken-Burns, Story-Info-Ebene, verbesserter Header,
//      Hold-to-pause, Action-Bar (Reaction/Reply/Profil), kein Follow-Button
export function StoryViewer({ data: initData, onClose, onViewProfile }) {
  const { user } = useAuth();

  const [groupIdx,   setGroupIdx]   = useState(initData?.groupIdx  ?? 0);
  const [storyIdx,   setStoryIdx]   = useState(initData?.startIdx  ?? 0);
  const [paused,     setPaused]     = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [reaction,   setReaction]   = useState(null);    // floating emoji
  const [myReaction, setMyReaction] = useState(null);    // persisted reaction
  const [replyOpen,  setReplyOpen]  = useState(false);
  const [replyText,  setReplyText]  = useState('');
  const [sentReply,  setSentReply]  = useState(false);
  const [viewerCount,setViewerCount]= useState(null);
  const [imgLoaded,  setImgLoaded]  = useState(false);
  const [shareHint,  setShareHint]  = useState(false);

  const allGroups = initData?.allGroups ?? (initData?.group ? [initData.group] : []);
  const group     = allGroups[groupIdx];
  const stories   = group?.stories ?? [];
  const current   = stories[storyIdx];

  const timerRef   = useRef(null);
  const startRef   = useRef(null);
  const elapsed    = useRef(0);
  const holdTimer  = useRef(null);
  const DURATION   = current?.media_type === 'video' ? 0 : 5000;

  // ── Mark viewed + viewer count ──────────────────────────────────
  useEffect(() => {
    if (!current?.id) return;
    setImgLoaded(false);
    setProgress(0);
    elapsed.current = 0;
    setReaction(null);
    setReplyOpen(false);
    setSentReply(false);
    if (user?.id) {
      supabase.from('story_views').upsert({ story_id: current.id, viewer_id: user.id },
        { onConflict: 'story_id,viewer_id', ignoreDuplicates: true });
      supabase.from('story_views').select('id', { count:'exact' })
        .eq('story_id', current.id)
        .then(({ count }) => setViewerCount(count));
    }
  }, [current?.id, user?.id]);

  // ── Timer ────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (DURATION === 0) return;
    clearInterval(timerRef.current);
    startRef.current = Date.now() - elapsed.current;
    timerRef.current = setInterval(() => {
      const el = Date.now() - startRef.current;
      const pct = Math.min((el / DURATION) * 100, 100);
      setProgress(pct);
      elapsed.current = el;
      if (el >= DURATION) { clearInterval(timerRef.current); goNext(); }
    }, 40);
  }, [storyIdx, groupIdx, DURATION]);

  const stopTimer = useCallback(() => clearInterval(timerRef.current), []);

  useEffect(() => {
    if (!paused && !replyOpen && imgLoaded) startTimer();
    else stopTimer();
    return stopTimer;
  }, [paused, replyOpen, imgLoaded, storyIdx, groupIdx]);

  function goNext() {
    if (storyIdx < stories.length - 1) setStoryIdx(i => i + 1);
    else if (groupIdx < allGroups.length - 1) { setGroupIdx(g => g + 1); setStoryIdx(0); }
    else onClose?.();
  }
  function goPrev() {
    if (storyIdx > 0) setStoryIdx(i => i - 1);
    else if (groupIdx > 0) { setGroupIdx(g => g - 1); setStoryIdx(0); }
  }

  // ── Hold to pause ────────────────────────────────────────────────
  function onPointerDown() {
    holdTimer.current = setTimeout(() => setPaused(true), 120);
  }
  function onPointerUp() {
    clearTimeout(holdTimer.current);
    setPaused(false);
  }

  // ── Swipe down to close ──────────────────────────────────────────
  const touchStartY = useRef(null);
  const touchStartX = useRef(null);
  function onTouchStart(e) {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e) {
    const dy = e.changedTouches[0].clientY - (touchStartY.current || 0);
    if (dy > 90) { onClose?.(); return; }
  }

  // ── Reaction ─────────────────────────────────────────────────────
  function handleReaction(emoji) {
    setReaction(emoji);
    setMyReaction(emoji);
    setTimeout(() => setReaction(null), 2200);
  }

  // ── Reply ────────────────────────────────────────────────────────
  async function sendReply() {
    if (!replyText.trim() || !user?.id || !current) return;
    try {
      await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: current.user_id,
        text: `↩ Story: ${replyText.trim()}`,
        story_id: current.id,
        created_at: new Date().toISOString(),
      });
    } catch(_) { /* story transition — suppress */ }
    setSentReply(true);
    setReplyText('');
    setTimeout(() => { setReplyOpen(false); setSentReply(false); setPaused(false); }, 1500);
  }

  // ── Share ────────────────────────────────────────────────────────
  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: `${current?.username} auf HUI`, url: window.location.href })
        .catch(() => {});
    } else {
      setShareHint(true);
      setTimeout(() => setShareHint(false), 2000);
    }
  }

  if (!current) return null;

  const isOwn    = user?.id === current.user_id;
  const mediaUrl = current.media_url;
  const caption  = current.text_overlay || current.caption || null;
  const location = current.location_label || current.location || null;
  const mood     = current.mood || null;

  const timeAgo  = (() => {
    const d = new Date(current.created_at);
    const mins = Math.round((Date.now() - d) / 60000);
    if (mins < 1)  return 'gerade';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24)  return `${hrs}h`;
    return `${Math.round(hrs/24)}d`;
  })();

  // Creator talent/role für Subline
  const creatorRole = current.talent || current.focus_label || null;

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{ position:'fixed', inset:0, zIndex:10500   /* Z.story */, background:'#000',
        animation:'huiIn .22s ease-out', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>

      {/* ── BG MEDIA mit Ken-Burns ─────────────────────────────── */}
      <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
        {mediaUrl && current.media_type === 'video' ? (
          <video src={mediaUrl} autoPlay playsInline muted={false}
            style={{ width:'100%', height:'100%', objectFit:'cover' }}
            onEnded={goNext}
            onLoadedData={() => setImgLoaded(true)} />
        ) : mediaUrl ? (
          <img
            loading="eager"
            src={mediaUrl} alt=""
            onLoad={() => setImgLoaded(true)}
            style={{
              width:'100%', height:'100%', objectFit:'cover',
              // Ken-Burns: subtiler Zoom wenn Story läuft
              animation: !paused ? 'huiKenBurns 6s ease-out forwards' : 'none',
              transformOrigin: '50% 40%',
            }} />
        ) : (
          <div style={{ position:'absolute', inset:0,
            background:`linear-gradient(160deg, ${C.teal}44, ${C.coral}33, #111)` }}
            ref={() => setImgLoaded(true)} />
        )}
      </div>

      {/* ── Gradient-Overlay (top + bottom) ─────────────────────── */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none',
        background:`
          linear-gradient(to bottom,
            rgba(0,0,0,.58) 0%,
            rgba(0,0,0,.10) 28%,
            transparent 50%,
            rgba(0,0,0,.15) 65%,
            rgba(0,0,0,.80) 100%)` }} />

      {/* ── PROGRESS BARS ────────────────────────────────────────── */}
      <div style={{ position:'absolute', top:'max(10px,env(safe-area-inset-top,10px))',
        left:12, right:12, display:'flex', gap:3, zIndex:10 }}>
        {stories.map((_, i) => (
          <div key={i} style={{ flex:1, height:2.5, borderRadius:2,
            background:'rgba(255,255,255,.28)', overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:2,
              background: i < storyIdx
                ? 'rgba(255,255,255,.9)'
                : i === storyIdx
                  ? `linear-gradient(90deg,${C.teal},white)`
                  : 'transparent',
              width: i < storyIdx ? '100%' : i === storyIdx ? `${progress}%` : '0%',
              transition: i === storyIdx ? 'none' : 'none',
              boxShadow: i === storyIdx ? `0 0 6px rgba(22,215,197,.6)` : 'none',
            }} />
          </div>
        ))}
      </div>

      {/* ── HEADER ───────────────────────────────────────────────── */}
      <div style={{
        position:'absolute',
        top:'max(24px,calc(env(safe-area-inset-top,14px)+14px))',
        left:14, right:14,
        display:'flex', alignItems:'center', gap:10, zIndex:10 }}>

        {/* Avatar mit Glow-Ring */}
        <div style={{
          width:44, height:44, borderRadius:'50%', padding:2.5, flexShrink:0,
          background:`linear-gradient(135deg,${C.teal},${C.coral})`,
          boxShadow:`0 0 0 1px rgba(255,255,255,.2), 0 0 18px rgba(22,215,197,.35)`,
          cursor: onViewProfile ? 'pointer' : 'default',
        }}
          onClick={e => {
            e.stopPropagation();
            if (onViewProfile && current) onViewProfile(current);
          }}>
          <div style={{ width:'100%', height:'100%', borderRadius:'50%',
            overflow:'hidden', background:'#222' }}>
            {current.avatar_url
              ? <img loading="eager" src={current.avatar_url} alt=""
                  style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <div style={{ width:'100%', height:'100%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'white', fontWeight:900, fontSize:17,
                  background:`linear-gradient(135deg,${C.teal},${C.coral})` }}>
                  {(current.username||'A')[0].toUpperCase()}
                </div>}
          </div>
        </div>

        {/* Name + Rolle + Zeit */}
        <div style={{ flex:1, minWidth:0,
          cursor: onViewProfile ? 'pointer' : 'default' }}
          onClick={e => {
            e.stopPropagation();
            if (onViewProfile && current) onViewProfile(current);
          }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ color:'white', fontWeight:800, fontSize:15,
              letterSpacing:-.2, lineHeight:1.2,
              textShadow:'0 1px 6px rgba(0,0,0,.4)',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              maxWidth:140 }}>
              {current.username || 'Anonym'}
            </span>
            {creatorRole && (
              <span style={{ fontSize:10, fontWeight:700, color:C.teal,
                background:'rgba(22,215,197,.16)', borderRadius:50,
                padding:'1px 7px', backdropFilter:'blur(6px)',
                border:'1px solid rgba(22,215,197,.25)', whiteSpace:'nowrap' }}>
                {creatorRole}
              </span>
            )}
          </div>
          <div style={{ color:'rgba(255,255,255,.45)', fontSize:10.5,
            fontWeight:500, marginTop:1 }}>{timeAgo}</div>
        </div>

        {/* Viewer count (nur eigene Stories) */}
        {isOwn && viewerCount !== null && (
          <div style={{ display:'flex', alignItems:'center', gap:4,
            background:'rgba(255,255,255,.12)', backdropFilter:'blur(10px)',
            borderRadius:20, padding:'4px 10px',
            border:'1px solid rgba(255,255,255,.14)' }}>
            <HUIAnsichtIcon size={12} style={{opacity:0.7}} />
            <span style={{ color:'white', fontSize:12, fontWeight:600 }}>{viewerCount}</span>
          </div>
        )}

        {/* Close */}
        <button className="hui-sv-tap" onClick={onClose} style={{
          background:'rgba(0,0,0,.32)', backdropFilter:'blur(12px)',
          WebkitBackdropFilter:'blur(12px)',
          border:'1px solid rgba(255,255,255,.12)', borderRadius:'50%',
          width:34, height:34, color:'white', fontSize:15,
          cursor:'pointer', flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 2px 10px rgba(0,0,0,.25)' }}>✕</button>
      </div>

      {/* ── TAP ZONES (Hold = pause) ─────────────────────────────── */}
      <div className="hui-sv-tap"
        onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
        onClick={goPrev}
        style={{ position:'absolute', top:0, bottom:'25%', left:0, width:'35%', zIndex:5 }} />
      <div className="hui-sv-tap"
        onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
        onClick={goNext}
        style={{ position:'absolute', top:0, bottom:'25%', right:0, width:'35%', zIndex:5 }} />

      {/* ── PAUSED INDICATOR ─────────────────────────────────────── */}
      {paused && !replyOpen && (
        <div style={{ position:'absolute', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)', zIndex:15,
          pointerEvents:'none' }}>
          <div style={{ width:52, height:52, borderRadius:'50%',
            background:'rgba(0,0,0,.45)', backdropFilter:'blur(12px)',
            display:'flex', alignItems:'center', justifyContent:'center',
            border:'1px solid rgba(255,255,255,.2)' }}>
            <span style={{ fontSize:20, lineHeight:1 }}>⏸</span>
          </div>
        </div>
      )}

      {/* ── STORY INFO EBENE (unten links) ───────────────────────── */}
      {!replyOpen && (caption || location || mood) && (
        <div style={{
          position:'absolute',
          bottom:'max(120px,calc(env(safe-area-inset-bottom,0px)+120px))',
          left:18, right:80, zIndex:10,
          animation:'huiUp .35s ease-out' }}>
          {/* Caption */}
          {caption && (
            <div style={{ color:'white', fontSize:15, fontWeight:600,
              lineHeight:1.5, letterSpacing:-.1,
              textShadow:'0 2px 16px rgba(0,0,0,.65)',
              marginBottom: (location || mood) ? 8 : 0 }}>
              {caption}
            </div>
          )}
          {/* Meta-Chips */}
          {(location || mood) && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {location && (
                <span style={{ fontSize:11.5, color:'rgba(255,255,255,.85)',
                  background:'rgba(0,0,0,.32)', backdropFilter:'blur(10px)',
                  WebkitBackdropFilter:'blur(10px)',
                  border:'1px solid rgba(255,255,255,.14)',
                  borderRadius:50, padding:'4px 10px',
                  fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                  <HUILocationIcon size={11} style={{flexShrink:0}}/>{location}
                </span>
              )}
              {mood && (
                <span style={{ fontSize:11.5, color:'rgba(255,255,255,.85)',
                  background:'rgba(0,0,0,.32)', backdropFilter:'blur(10px)',
                  WebkitBackdropFilter:'blur(10px)',
                  border:'1px solid rgba(255,255,255,.14)',
                  borderRadius:50, padding:'4px 10px',
                  fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                  <span>✨</span>{mood}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── FLOATING REACTION ────────────────────────────────────── */}
      {reaction && (
        <div style={{ position:'absolute', top:'38%', left:'50%',
          transform:'translate(-50%,-50%)',
          fontSize:72, zIndex:20, animation:'huiEmoji .45s cubic-bezier(.34,1.56,.64,1)',
          pointerEvents:'none', filter:'drop-shadow(0 4px 16px rgba(0,0,0,.3))' }}>
          {reaction}
        </div>
      )}

      {/* ── SHARE HINT ───────────────────────────────────────────── */}
      {shareHint && (
        <div style={{ position:'absolute', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)', zIndex:25,
          background:'rgba(0,0,0,.75)', backdropFilter:'blur(16px)',
          borderRadius:16, padding:'12px 20px',
          color:'white', fontSize:13, fontWeight:600, pointerEvents:'none' }}>
          🔗 Link kopiert
        </div>
      )}

      {/* ── BOTTOM ACTION BAR ────────────────────────────────────── */}
      {!replyOpen && (
        <div style={{
          position:'absolute',
          bottom:'max(20px,env(safe-area-inset-bottom,20px))',
          left:14, right:14, zIndex:10,
          display:'flex', flexDirection:'column', gap:10 }}>

          {/* Quick Reactions */}
          <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
            {(REACTIONS||[]).filter(r=>r&&r.key).map(r => (
              <button key={r} className="hui-sv-tap"
                onClick={() => handleReaction(r)}
                style={{
                  background: myReaction === r
                    ? `rgba(22,215,197,.25)`
                    : 'rgba(0,0,0,.32)',
                  backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
                  border: myReaction === r
                    ? `1px solid rgba(22,215,197,.5)`
                    : '1px solid rgba(255,255,255,.18)',
                  borderRadius:50, padding:'8px 15px', fontSize:19,
                  cursor:'pointer', transition:'transform .15s, background .2s',
                  transform: myReaction === r ? 'scale(1.12)' : 'scale(1)',
                }}>
                {r}
              </button>
            ))}
          </div>

          {/* Action Row: Reply + Share + Profile */}
          <div style={{ display:'flex', gap:8 }}>
            {/* Reply */}
            <button className="hui-sv-tap"
              onClick={() => { setReplyOpen(true); setPaused(true); }}
              style={{ flex:1,
                background:'rgba(0,0,0,.28)', backdropFilter:'blur(16px)',
                WebkitBackdropFilter:'blur(16px)',
                border:'1px solid rgba(255,255,255,.18)', borderRadius:50,
                padding:'11px 16px', color:'rgba(255,255,255,.72)',
                fontSize:13.5, fontWeight:500, cursor:'pointer',
                textAlign:'left', display:'flex', alignItems:'center', gap:8 }}>
              <HUIChatIcon size={14} style={{opacity:0.65}} />
              <span>Antworten…</span>
            </button>
            {/* Share */}
            <button className="hui-sv-tap"
              onClick={handleShare}
              style={{ width:46, height:46, borderRadius:'50%',
                background:'rgba(0,0,0,.28)', backdropFilter:'blur(14px)',
                WebkitBackdropFilter:'blur(14px)',
                border:'1px solid rgba(255,255,255,.18)',
                color:'white', fontSize:17, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
              🔗
            </button>
            {/* Profil öffnen */}
            {!isOwn && onViewProfile && (
              <button className="hui-sv-tap"
                onClick={e => { e.stopPropagation(); onViewProfile(current); }}
                style={{ width:46, height:46, borderRadius:'50%',
                  background:'rgba(0,0,0,.28)', backdropFilter:'blur(14px)',
                  WebkitBackdropFilter:'blur(14px)',
                  border:'1px solid rgba(255,255,255,.18)',
                  color:'white', fontSize:17, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                👤
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── REPLY SHEET ──────────────────────────────────────────── */}
      {replyOpen && (
        <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:20,
          background:'rgba(12,12,12,.94)', backdropFilter:'blur(28px)',
          WebkitBackdropFilter:'blur(28px)',
          borderRadius:'22px 22px 0 0',
          padding:'20px 16px',
          paddingBottom:'max(28px,env(safe-area-inset-bottom,28px))',
          animation:'huiUp .22s ease-out',
          borderTop:'1px solid rgba(255,255,255,.08)' }}>
          {sentReply ? (
            <div style={{ textAlign:'center', padding:16 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>✓</div>
              <div style={{ color:'white', fontSize:15, fontWeight:700 }}>Antwort gesendet</div>
            </div>
          ) : (
            <>
              <div style={{ color:'rgba(255,255,255,.38)', fontSize:11.5, fontWeight:700,
                textAlign:'center', marginBottom:14, letterSpacing:.8 }}>
                ANTWORT AN {(current.username||'').toUpperCase()}
              </div>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <input
                  autoFocus
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                  placeholder="Schreib etwas…"
                  style={{ flex:1, background:'rgba(255,255,255,.08)',
                    border:'1px solid rgba(255,255,255,.15)',
                    borderRadius:50, padding:'13px 18px', color:'white', fontSize:14,
                    outline:'none', fontFamily:'inherit',
                    caretColor:C.teal }} />
                <button className="hui-sv-tap" onClick={sendReply}
                  style={{ width:46, height:46, borderRadius:'50%',
                    background:`linear-gradient(135deg,${C.teal},${C.coral})`,
                    border:'none', color:'white', fontWeight:900,
                    fontSize:18, cursor:'pointer',
                    boxShadow:`0 4px 16px rgba(22,215,197,.35)`,
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  ↑
                </button>
              </div>
              <button className="hui-sv-tap"
                onClick={() => { setReplyOpen(false); setPaused(false); }}
                style={{ marginTop:12, background:'transparent', border:'none',
                  color:'rgba(255,255,255,.3)', width:'100%', fontSize:13,
                  cursor:'pointer', padding:'8px 0', fontFamily:'inherit' }}>
                Abbrechen
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}


// ── HIGHLIGHTS ROW (für ProfilePage) ─────────────────────────────────
export function HighlightsRow({ userId }) {
  const [highlights, setHighlights] = useState([]);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    if (!userId) return;
    // FIX: stories hat kein status-Feld + kein username/avatar_url
    supabase.from('stories')
      .select(`
        id, user_id, media_url, media_type, caption, text_overlay,
        is_highlight, created_at, expires_at,
        profile:user_id(display_name, avatar_url)
      `)
      .eq('user_id', userId)
      .eq('is_highlight', true)
      // .eq('status','published') -- ENTFERNT: Spalte existiert nicht
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data?.length) setHighlights(data); });
  }, [userId]);

  if (!highlights.length) return null;

  const group = { uid: userId, username: highlights[0]?.username || 'Highlights', stories: highlights };

  return (
    <>
      {viewing && <StoryViewer data={{ group, startIdx: viewing, allGroups:[group], groupIdx:0 }} onClose={() => setViewing(null)} />}
      <div style={{ padding:'0 0 4px' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#888', padding:'0 20px 10px',
          textTransform:'uppercase', letterSpacing:.8 }}>Highlights</div>
        <div className="hui-no-scroll" style={{ display:'flex', gap:14, overflowX:'auto',
          padding:'0 20px', WebkitOverflowScrolling:'touch' }}>
          {highlights.map((h, i) => (
            <div key={h.id} onClick={() => setViewing(i)}
              style={{ flexShrink:0, cursor:'pointer', display:'flex', flexDirection:'column',
                alignItems:'center', gap:6 }}>
              <div style={{ width:64, height:64, borderRadius:'50%', padding:3,
                background:`linear-gradient(135deg, ${C.gold}, ${C.coral})` }}>
                <div style={{ width:'100%', height:'100%', borderRadius:'50%',
                  overflow:'hidden', border:'2px solid white', background:'#eee' }}>
                  {h.media_url
                    ? <img loading="eager" decoding="async" src={h.media_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <div style={{ width:'100%', height:'100%', background:`linear-gradient(135deg,${C.gold}44,${C.coral}44)`,
                        display:"flex", alignItems:"center", justifyContent:"center" }}><HUIAwardIcon size={20} style={{color:"rgba(245,158,11,0.8)"}}/></div>}
                </div>
              </div>
              <span style={{ fontSize:11, fontWeight:600, color:'#555', maxWidth:64,
                textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {h.text_overlay ? h.text_overlay.substring(0,12)+'…' : 'Highlight'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}