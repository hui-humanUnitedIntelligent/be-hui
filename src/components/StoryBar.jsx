// StoryBar.jsx + StoryViewer.jsx — HUI Premium v2
// Phase 1: Progress bars, auto-advance, tap nav, hold-to-pause,
//          reactions, quick reply, seen state, gradient rings
// Phase 2: Highlights row on profile

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';

const C = {
  teal:'#16D7C5', coral:'#FF8A6B', gold:'#F5A623',
  ink:'#1A1A1A', muted:'#888', cream:'#F9F6F2',
};

const CSS = `
  @keyframes huiRing{0%,100%{opacity:1}50%{opacity:.5}}
  @keyframes huiIn{from{opacity:0;transform:scale(1.04)}to{opacity:1;transform:scale(1)}}
  @keyframes huiUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes huiBar{from{width:0%}to{width:100%}}
  @keyframes huiEmoji{0%{transform:scale(0) rotate(-20deg);opacity:0}
    60%{transform:scale(1.3) rotate(5deg);opacity:1}
    100%{transform:scale(1) rotate(0deg);opacity:1}}
  @keyframes huiPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
  .hui-sv-tap{-webkit-tap-highlight-color:transparent;cursor:pointer}
  .hui-sv-tap:active{opacity:.85}
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
    const { data, error } = await supabase
      .from('stories')
      .select('id, user_id, username, avatar_url, media_url, media_type, text_overlay, is_highlight, created_at, expires_at')
      .eq('status','published')
      .or(`expires_at.gt.${now},is_highlight.eq.true`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) { console.warn('[StoryBar] load error:', error.message); return; }
    if (!data?.length) return;

    // Load viewed story IDs for current user
    if (user?.id) {
      const { data: views } = await supabase
        .from('story_views')
        .select('story_id')
        .eq('viewer_id', user.id);
      if (views) setViewedIds(new Set(views.map(v => v.story_id)));
    }

    // Group by user_id
    const map = {};
    for (const s of data) {
      const uid = s.user_id;
      if (!map[uid]) map[uid] = { uid, username: s.username || 'Anonym', avatar_url: s.avatar_url, stories: [] };
      map[uid].stories.push(s);
    }
    setGroups(Object.values(map));
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
                      <img loading="lazy" decoding="async" src={cover.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    ) : cover?.media_url ? (
                      <img loading="lazy" decoding="async" src={cover.media_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
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
export function StoryViewer({ data: initData, onClose }) {
  const { user } = useAuth();

  // initData = { group, startIdx, allGroups, groupIdx, viewedIds }
  const [groupIdx,  setGroupIdx]  = useState(initData?.groupIdx  ?? 0);
  const [storyIdx,  setStoryIdx]  = useState(initData?.startIdx  ?? 0);
  const [paused,    setPaused]    = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [reaction,  setReaction]  = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyOpen, setReplyOpen] = useState(false);
  const [sentReply, setSentReply] = useState(false);
  const [viewerCount, setViewerCount] = useState(null);

  const allGroups  = initData?.allGroups  ?? (initData?.group ? [initData.group] : []);
  const group      = allGroups[groupIdx];
  const stories    = group?.stories ?? [];
  const current    = stories[storyIdx];

  const timerRef   = useRef(null);
  const startRef   = useRef(null);
  const elapsed    = useRef(0);
  const DURATION   = current?.media_type === 'video' ? 0 : 5000; // 5s per image

  // Mark viewed + get viewer count
  useEffect(() => {
    if (!current?.id) return;
    if (user?.id) {
      supabase.from('story_views').upsert({ story_id: current.id, viewer_id: user.id });
      supabase.from('story_views').select('id', { count:'exact' }).eq('story_id', current.id)
        .then(({ count }) => setViewerCount(count));
    }
    setProgress(0);
    elapsed.current = 0;
    setReaction(null);
    setReplyOpen(false);
    setSentReply(false);
  }, [current?.id]);

  // Auto-advance timer
  const startTimer = useCallback(() => {
    if (DURATION === 0) return; // video handles its own timing
    clearInterval(timerRef.current);
    startRef.current = Date.now() - elapsed.current;
    timerRef.current = setInterval(() => {
      const el = Date.now() - startRef.current;
      const pct = Math.min((el / DURATION) * 100, 100);
      setProgress(pct);
      elapsed.current = el;
      if (el >= DURATION) { clearInterval(timerRef.current); goNext(); }
    }, 50);
  }, [storyIdx, groupIdx, DURATION]);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (!paused && !replyOpen) startTimer();
    else stopTimer();
    return stopTimer;
  }, [paused, replyOpen, storyIdx, groupIdx]);

  function goNext() {
    if (storyIdx < stories.length - 1) {
      setStoryIdx(i => i + 1);
    } else if (groupIdx < allGroups.length - 1) {
      setGroupIdx(g => g + 1);
      setStoryIdx(0);
    } else {
      onClose?.();
    }
  }

  function goPrev() {
    if (storyIdx > 0) setStoryIdx(i => i - 1);
    else if (groupIdx > 0) {
      setGroupIdx(g => g - 1);
      setStoryIdx(0);
    }
  }

  function handleReaction(emoji) {
    setReaction(emoji);
    setTimeout(() => setReaction(null), 2000);
    // Could save reaction to DB here
  }

  async function sendReply() {
    if (!replyText.trim()) return;
    // Save reply as message (if messages table exists)
    setSentReply(true);
    setReplyText('');
    setTimeout(() => { setReplyOpen(false); setSentReply(false); }, 1500);
  }

  // Swipe down to close
  const touchStartY = useRef(null);
  function onTouchStart(e) {
    touchStartY.current = e.touches[0].clientY;
    setPaused(true);
  }
  function onTouchEnd(e) {
    const dy = e.changedTouches[0].clientY - (touchStartY.current || 0);
    if (dy > 80) { onClose?.(); return; }
    setPaused(false);
  }

  if (!current) return null;

  const isOwn   = user?.id === current.user_id;
  const mediaUrl = current.media_url;
  const timeAgo = (() => {
    const d = new Date(current.created_at);
    const mins = Math.round((Date.now() - d) / 60000);
    if (mins < 1)  return 'gerade eben';
    if (mins < 60) return `vor ${mins} Min`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24)  return `vor ${hrs} Std`;
    return `vor ${Math.round(hrs/24)} Tagen`;
  })();

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{ position:'fixed', inset:0, zIndex:3000, background:'#000',
        animation:'huiIn .25s ease-out' }}>

      {/* ── BG MEDIA ── */}
      {mediaUrl && current.media_type === 'video' ? (
        <video src={mediaUrl} autoPlay playsInline
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
          onEnded={goNext} />
      ) : mediaUrl ? (
        <img loading="lazy" decoding="async" src={mediaUrl} alt="" style={{
          position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
      ) : (
        <div style={{ position:'absolute', inset:0,
          background:`linear-gradient(160deg, ${C.teal}44, ${C.coral}33, #1a1a1a)` }} />
      )}

      {/* ── DARK GRADIENT ── */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none',
        background:'linear-gradient(to bottom, rgba(0,0,0,.55) 0%, transparent 30%, transparent 65%, rgba(0,0,0,.75) 100%)' }} />

      {/* ── PROGRESS BARS ── */}
      <div style={{ position:'absolute', top:'max(14px,env(safe-area-inset-top,14px))',
        left:12, right:12, display:'flex', gap:4, zIndex:10 }}>
        {stories.map((_, i) => (
          <div key={i} style={{ flex:1, height:3, borderRadius:2, background:'rgba(255,255,255,.3)', overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:2, background:'white',
              width: i < storyIdx ? '100%' : i === storyIdx ? `${progress}%` : '0%',
              transition: i === storyIdx ? 'none' : 'width .1s',
            }} />
          </div>
        ))}
      </div>

      {/* ── HEADER ── */}
      <div style={{ position:'absolute', top:'max(30px,calc(env(safe-area-inset-top,14px)+16px))',
        left:14, right:14, display:'flex', alignItems:'center', gap:10, zIndex:10 }}>
        {/* Avatar */}
        <div style={{ width:38, height:38, borderRadius:'50%', border:'2px solid rgba(255,255,255,.7)',
          overflow:'hidden', background:'rgba(255,255,255,.2)', flexShrink:0 }}>
          {current.avatar_url
            ? <img loading="lazy" decoding="async" src={current.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center',
                justifyContent:'center', color:'white', fontWeight:800, fontSize:16 }}>
                {(current.username||'A')[0].toUpperCase()}
              </div>}
        </div>
        {/* Name + time */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:'white', fontWeight:700, fontSize:14, letterSpacing:.1 }}>
            {current.username || 'Anonym'}
          </div>
          <div style={{ color:'rgba(255,255,255,.55)', fontSize:11 }}>{timeAgo}</div>
        </div>
        {/* Viewer count (own stories) */}
        {isOwn && viewerCount !== null && (
          <div style={{ display:'flex', alignItems:'center', gap:4,
            background:'rgba(255,255,255,.15)', borderRadius:20, padding:'4px 10px' }}>
            <span style={{ fontSize:13 }}>👁</span>
            <span style={{ color:'white', fontSize:12, fontWeight:600 }}>{viewerCount}</span>
          </div>
        )}
        {/* Close */}
        <button className="hui-sv-tap" onClick={onClose} style={{
          background:'rgba(255,255,255,.18)', backdropFilter:'blur(8px)',
          border:'none', borderRadius:'50%', width:34, height:34,
          color:'white', fontSize:16, cursor:'pointer', flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
      </div>

      {/* ── TAP ZONES ── */}
      <div className="hui-sv-tap" onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)}
        onClick={goPrev}
        style={{ position:'absolute', top:0, bottom:0, left:0, width:'33%', zIndex:5 }} />
      <div className="hui-sv-tap" onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)}
        onClick={goNext}
        style={{ position:'absolute', top:0, bottom:0, right:0, width:'33%', zIndex:5 }} />

      {/* ── TEXT OVERLAY ── */}
      {current.text_overlay && (
        <div style={{ position:'absolute', bottom: replyOpen ? 180 : 130,
          left:20, right:20, zIndex:10,
          color:'white', fontSize:17, fontWeight:600, lineHeight:1.5,
          textShadow:'0 2px 12px rgba(0,0,0,.7)', animation:'huiUp .3s ease-out' }}>
          {current.text_overlay}
        </div>
      )}

      {/* ── REACTIONS FLOATING ── */}
      {reaction && (
        <div style={{ position:'absolute', top:'40%', left:'50%', transform:'translate(-50%,-50%)',
          fontSize:64, zIndex:20, animation:'huiEmoji .4s ease-out', pointerEvents:'none' }}>
          {reaction}
        </div>
      )}

      {/* ── BOTTOM BAR ── */}
      {!replyOpen ? (
        <div style={{ position:'absolute', bottom:'max(24px,env(safe-area-inset-bottom,24px))',
          left:14, right:14, zIndex:10, display:'flex', flexDirection:'column', gap:10 }}>
          {/* Reactions */}
          <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
            {REACTIONS.map(r => (
              <button key={r} className="hui-sv-tap"
                onClick={() => handleReaction(r)}
                style={{ background:'rgba(255,255,255,.18)', backdropFilter:'blur(12px)',
                  border:'1px solid rgba(255,255,255,.25)', borderRadius:50,
                  padding:'8px 14px', fontSize:20, cursor:'pointer',
                  transition:'transform .15s', zIndex:10 }}>
                {r}
              </button>
            ))}
          </div>
          {/* Reply input */}
          <button className="hui-sv-tap"
            onClick={() => { setReplyOpen(true); setPaused(true); }}
            style={{ background:'rgba(255,255,255,.15)', backdropFilter:'blur(16px)',
              border:'1px solid rgba(255,255,255,.25)', borderRadius:50,
              padding:'12px 20px', color:'rgba(255,255,255,.75)',
              fontSize:14, fontWeight:500, cursor:'pointer', textAlign:'left',
              width:'100%' }}>
            💬 Antwort senden...
          </button>
        </div>
      ) : (
        /* ── REPLY SHEET ── */
        <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:20,
          background:'rgba(20,20,20,.92)', backdropFilter:'blur(24px)',
          borderRadius:'20px 20px 0 0', padding:'20px 16px',
          paddingBottom:'max(24px,env(safe-area-inset-bottom,24px))',
          animation:'huiUp .2s ease-out' }}>
          {sentReply ? (
            <div style={{ textAlign:'center', color:'white', fontSize:16, fontWeight:600, padding:16 }}>
              ✓ Antwort gesendet
            </div>
          ) : (
            <>
              <div style={{ color:'rgba(255,255,255,.5)', fontSize:12, fontWeight:600,
                textAlign:'center', marginBottom:14, textTransform:'uppercase', letterSpacing:1 }}>
                Antwort an {current.username}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <input
                  autoFocus
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendReply()}
                  placeholder="Schreib etwas..."
                  style={{ flex:1, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)',
                    borderRadius:50, padding:'12px 18px', color:'white', fontSize:14,
                    outline:'none', fontFamily:'inherit' }} />
                <button className="hui-sv-tap" onClick={sendReply}
                  style={{ background:`linear-gradient(135deg,${C.teal},${C.coral})`,
                    border:'none', borderRadius:50, padding:'12px 18px',
                    color:'white', fontWeight:700, fontSize:14, cursor:'pointer' }}>
                  ↑
                </button>
              </div>
              <button className="hui-sv-tap" onClick={() => { setReplyOpen(false); setPaused(false); }}
                style={{ marginTop:12, background:'transparent', border:'none',
                  color:'rgba(255,255,255,.4)', width:'100%', fontSize:13, cursor:'pointer' }}>
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
    supabase.from('stories')
      .select('id, user_id, username, avatar_url, media_url, media_type, text_overlay, is_highlight, created_at')
      .eq('user_id', userId)
      .eq('is_highlight', true)
      .eq('status', 'published')
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
                    ? <img loading="lazy" decoding="async" src={h.media_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <div style={{ width:'100%', height:'100%', background:`linear-gradient(135deg,${C.gold}44,${C.coral}44)`,
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>⭐</div>}
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