import React, { useState, useRef } from 'react';
import { supabase } from '.../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';

const C = {
  teal: '#16D7C5', coral: '#FF8A6B',
  ink: '#1A1A1A', muted: '#888888',
  cream: '#F9F6F2', card: '#FFFFFF',
};

// ── PLUS BUTTON (ersetzt HUI Button für Wirker) ──────────────────────
export function PlusButton({ onOpen }) {
  const { isWirker } = useAuth();
  return (
    <button
      onClick={onOpen}
      style={{
        width: 56, height: 56, borderRadius: '50%', border: 'none',
        background: isWirker
          ? `linear-gradient(135deg, ${C.teal}, ${C.coral})`
          : `linear-gradient(135deg, ${C.teal}, #11C5B7)`,
        color: 'white', fontSize: isWirker ? 28 : 22,
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(22,215,197,0.45)',
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform 0.15s',
      }}
    >
      {isWirker ? '+' : 'H'}
    </button>
  );
}

// ── BOTTOM SHEET ──────────────────────────────────────────────────────
export function CreateBottomSheet({ open, onClose, onSelect }) {
  const { isWirker } = useAuth();
  if (!open) return null;

  const options = isWirker
    ? [
        { icon: '📸', label: 'Story posten', key: 'story' },
        { icon: '🎨', label: 'Werk veröffentlichen', key: 'work' },
        { icon: '✨', label: 'Experience erstellen', key: 'experience' },
        { icon: '💬', label: 'Beitrag teilen', key: 'post' },
      ]
    : [
        { icon: '💬', label: 'Beitrag teilen', key: 'post' },
      ];

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 998, backdropFilter: 'blur(4px)',
      }} />
      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: C.card, borderRadius: '24px 24px 0 0',
        padding: '12px 24px 40px', zIndex: 999,
        boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
      }}>
        {/* Handle */}
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: '#E0DAD0', margin: '0 auto 24px',
        }} />
        <div style={{ fontWeight: 800, fontSize: 18, color: C.ink, marginBottom: 20 }}>
          Was möchtest du teilen?
        </div>
        {options.map(opt => (
          <button key={opt.key} onClick={() => { onSelect(opt.key); onClose(); }}
            style={{
              width: '100%', padding: '16px 20px', marginBottom: 10,
              background: C.cream, border: 'none', borderRadius: 16,
              display: 'flex', alignItems: 'center', gap: 16,
              cursor: 'pointer', fontFamily: 'inherit',
              WebkitTapHighlightColor: 'transparent',
            }}>
            <span style={{ fontSize: 24 }}>{opt.icon}</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{opt.label}</span>
            <span style={{ marginLeft: 'auto', color: C.muted }}>›</span>
          </button>
        ))}
      </div>
    </>
  );
}

// ── STORY UPLOAD MODAL ────────────────────────────────────────────────
export function StoryUploadModal({ open, onClose, onSuccess }) {
  const { user, wirkerProfile } = useAuth();
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  if (!open) return null;

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleUpload() {
    if (!file || !user) return;
    setUploading(true); setErr('');
    try {
      // 1. Upload to Supabase Storage
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('stories')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadErr) throw uploadErr;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(path);

      // 3. Save story — direkt mit publicUrl, ohne media-Zwischentabelle
      const isVideo = file.type.startsWith('video');
      console.log("[StoryUpload] publicUrl:", publicUrl, "isVideo:", isVideo);
      const { error: storyErr } = await supabase
        .from('stories')
        .insert({
          user_id:    user.id,
          media_url:  publicUrl,
          media_type: isVideo ? 'video' : 'image',
          caption:    caption.trim() || null,
          status:     'published',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      if (storyErr) {
        console.error("[StoryUpload] ❌ story insert:", storyErr.message, storyErr.code);
        throw storyErr;
      }
      console.log("[StoryUpload] ✓ story saved!");

      onSuccess?.();
      handleClose();
    } catch (e) {
      setErr(e.message || 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  }

  function handleClose() {
    setPreview(null); setFile(null);
    setCaption(''); setErr('');
    onClose();
  }

  return (
    <>
      <div onClick={handleClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        zIndex: 1000, backdropFilter: 'blur(8px)',
      }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: C.card, borderRadius: '24px 24px 0 0',
        padding: '12px 24px 48px', zIndex: 1001,
        maxHeight: '90dvh', overflowY: 'auto',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E0DAD0', margin: '0 auto 24px' }} />
        <div style={{ fontWeight: 800, fontSize: 20, color: C.ink, marginBottom: 20 }}>Story posten</div>

        {/* Preview */}
        {preview ? (
          <div style={{ position: 'relative', marginBottom: 16 }}>
            {file?.type.startsWith('video') ? (
              <video src={preview} controls style={{
                width: '100%', borderRadius: 16, maxHeight: 400, objectFit: 'cover',
              }} />
            ) : (
              <img src={preview} alt="Preview" style={{
                width: '100%', borderRadius: 16, maxHeight: 400, objectFit: 'cover',
              }} />
            )}
            <button onClick={() => { setPreview(null); setFile(null); }}
              style={{
                position: 'absolute', top: 10, right: 10,
                background: 'rgba(0,0,0,0.6)', color: 'white',
                border: 'none', borderRadius: '50%', width: 32, height: 32,
                cursor: 'pointer', fontSize: 16,
              }}>✕</button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()}
            style={{
              width: '100%', height: 200, border: '2px dashed #E0DAD0',
              borderRadius: 16, background: C.cream, cursor: 'pointer',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 8,
              marginBottom: 16,
            }}>
            <span style={{ fontSize: 40 }}>📸</span>
            <span style={{ fontSize: 15, color: C.muted, fontWeight: 600 }}>Foto oder Video wählen</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*,video/*"
          style={{ display: 'none' }} onChange={handleFile} />

        {/* Caption */}
        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Was möchtest du teilen? (optional)"
          rows={3}
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 16,
            border: '1.5px solid #E8E2D8', background: C.cream,
            fontSize: 15, color: C.ink, fontFamily: 'inherit',
            resize: 'none', outline: 'none', boxSizing: 'border-box',
            marginBottom: 16,
          }}
        />

        {err && <div style={{
          color: C.coral, fontSize: 13, padding: '10px 14px',
          background: '#FFF2EE', borderRadius: 12, marginBottom: 16,
        }}>{err}</div>}

        <button onClick={handleUpload} disabled={!file || uploading}
          style={{
            width: '100%', padding: '16px',
            background: (!file || uploading)
              ? '#E0DAD0'
              : `linear-gradient(135deg, ${C.teal}, #11C5B7)`,
            color: (!file || uploading) ? C.muted : 'white',
            border: 'none', borderRadius: 16, fontSize: 17,
            fontWeight: 800, cursor: (!file || uploading) ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            boxShadow: (!file || uploading) ? 'none' : '0 4px 20px rgba(22,215,197,0.4)',
          }}>
          {uploading ? 'Story wird hochgeladen…' : 'Story veröffentlichen ✦'}
        </button>
      </div>
    </>
  );
}
