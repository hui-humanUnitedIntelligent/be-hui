import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';

const C = {
  teal: '#16D7C5', coral: '#FF8A6B',
  ink: '#1A1A1A', muted: '#888888',
  cream: '#F9F6F2', card: '#FFFFFF',
};

// ── STORY BAR (horizontal scrollbar im HomeFeed) ────────────────────
export function StoryBar({ onStoryClick }) {
  const [stories, setStories] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    loadStories();
  }, []);

  async function loadStories() {
    const { data } = await supabase
      .from('stories')
      .select(`
        id, caption, expires_at, is_highlight, created_at,
        media:media_id ( storage_path, storage_bucket, type, thumbnail_path ),
        profile:user_id ( display_name, avatar_url ),
        wirker:wirker_profile_id ( slug, talent )
      `)
      .or(`expires_at.gt.${new Date().toISOString()},is_highlight.eq.true`)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setStories(data);
  }

  // Group by user
  const grouped = stories.reduce((acc, s) => {
    const uid = s.profile?.display_name || 'Anonym';
    if (!acc[uid]) acc[uid] = { ...s, count: 1 };
    else acc[uid].count++;
    return acc;
  }, {});

  const users = Object.values(grouped);
  if (users.length === 0) return null;

  return (
    <div style={{ padding: '16px 0 8px' }}>
      <div style={{
        display: 'flex', gap: 14, overflowX: 'auto',
        padding: '0 20px', scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        msOverflowStyle: 'none', scrollbarWidth: 'none',
      }}>
        {users.map((s, i) => {
          const thumbUrl = s.media?.storage_path
            ? supabase.storage
                .from(s.media.storage_bucket || 'stories')
                .getPublicUrl(s.media.thumbnail_path || s.media.storage_path)
                .data.publicUrl
            : null;

          return (
            <div key={i}
              onClick={() => onStoryClick?.(s)}
              style={{
                scrollSnapAlign: 'start', cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 6, flexShrink: 0,
                WebkitTapHighlightColor: 'transparent',
              }}>
              {/* Ring */}
              <div style={{
                width: 68, height: 68, borderRadius: '50%',
                padding: 3,
                background: s.is_highlight
                  ? `linear-gradient(135deg, #FFD700, ${C.coral})`
                  : `linear-gradient(135deg, ${C.teal}, ${C.coral})`,
              }}>
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  overflow: 'hidden', border: '3px solid white',
                }}>
                  {thumbUrl ? (
                    <img src={thumbUrl} alt="" style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                    }} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      background: C.cream, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 22,
                    }}>📸</div>
                  )}
                </div>
              </div>
              {/* Name */}
              <span style={{
                fontSize: 11, fontWeight: 600, color: C.ink,
                maxWidth: 72, textAlign: 'center',
                overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {s.profile?.display_name || 'Anonym'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── FULLSCREEN STORY VIEWER ──────────────────────────────────────────
export function StoryViewer({ story, stories = [], onClose }) {
  const [idx, setIdx] = useState(0);
  const current = stories.length > 0 ? stories[idx] : story;
  const { user } = useAuth();

  // Mark as viewed — must be before any early return
  useEffect(() => {
    if (user && current?.id) {
      supabase.from('story_views').upsert({
        story_id: current.id,
        viewer_id: user.id,
      }).then(() => {});
    }
  }, [current?.id, user?.id]);

  if (!current) return null;

  const mediaUrl = current.media?.storage_path
    ? supabase.storage
        .from(current.media.storage_bucket || 'stories')
        .getPublicUrl(current.media.storage_path)
        .data?.publicUrl
    : null;

  function next() {
    if (idx < stories.length - 1) setIdx(idx + 1);
    else onClose?.();
  }

  function prev() {
    if (idx > 0) setIdx(idx - 1);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: '#000',
    }}>
      {/* Media */}
      {current.media?.type === 'video' ? (
        <video src={mediaUrl} autoPlay playsInline muted
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onEnded={next} />
      ) : (
        <img src={mediaUrl} alt="" style={{
          width: '100%', height: '100%', objectFit: 'cover',
        }} />
      )}

      {/* Progress bar */}
      {stories.length > 1 && (
        <div style={{
          position: 'absolute', top: 'max(12px, env(safe-area-inset-top, 12px))',
          left: 12, right: 12, display: 'flex', gap: 4,
        }}>
          {stories.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= idx ? 'white' : 'rgba(255,255,255,0.3)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
      )}

      {/* Header */}
      <div style={{
        position: 'absolute', top: 'max(28px, env(safe-area-inset-top, 28px))',
        left: 16, right: 16,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: 'white', fontWeight: 800,
        }}>
          {(current.profile?.display_name || 'A')[0]}
        </div>
        <div>
          <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>
            {current.profile?.display_name || 'Anonym'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
            {current.wirker?.talent || ''}
          </div>
        </div>
        <button onClick={onClose} style={{
          marginLeft: 'auto', background: 'rgba(255,255,255,0.15)',
          border: 'none', borderRadius: '50%', width: 36, height: 36,
          color: 'white', fontSize: 18, cursor: 'pointer',
        }}>✕</button>
      </div>

      {/* Tap zones */}
      <div onClick={prev} style={{
        position: 'absolute', top: 0, bottom: 0, left: 0, width: '33%',
      }} />
      <div onClick={next} style={{
        position: 'absolute', top: 0, bottom: 0, right: 0, width: '33%',
      }} />

      {/* Caption */}
      {current.caption && (
        <div style={{
          position: 'absolute', bottom: 'max(32px, env(safe-area-inset-bottom, 32px))',
          left: 20, right: 20, color: 'white', fontSize: 15,
          fontWeight: 500, textShadow: '0 2px 8px rgba(0,0,0,0.6)',
          lineHeight: 1.5,
        }}>
          {current.caption}
        </div>
      )}
    </div>
  );
}