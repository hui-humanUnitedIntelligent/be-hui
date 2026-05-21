// src/services/content.js
// ═══════════════════════════════════════════════════════════════
// HUI CONTENT SERVICE — Phase 2
//
// ZENTRALE SCHICHT für alle Content-Operationen:
//   posts (Gedanken)    — feed_posts
//   works (Werke)       — works
//   resonance           — resonances
//   feed                — kuratierter HomeFeed
//   discover            — resonanzbasierte Entdeckung
//   storage             — Media-Uploads
//
// PRINZIPIEN:
//   • Keine Like-Mechanik — nur Resonanz
//   • Kein Infinite-Feed — bewusst begrenzt (limit=12)
//   • Kein toxisches Ranking — Qualität vor Engagement
//   • Berechtigungen zentral geprüft (roles/index.js)
//   • Alle Fehler ruhig abgefangen — kein White Screen
//
// VERWENDUNG:
//   import { feedService, worksService, resonanceService, storageService }
//     from '../services/content';
// ═══════════════════════════════════════════════════════════════

import { supabase }      from '../lib/supabaseClient';
import { sentryCapture } from '../lib/sentry.js';
import { cachedQuery, safeQuery, CACHE_TTL } from '../lib/perfUtils.js';
import { createResonance, removeResonance, getResonanceSummary }
  from '../lib/resonance/index.js';
import { canCreateContent, canPublish, CONTENT_TYPES } from '../lib/roles/index.js';

// ─────────────────────────────────────────────────────────────
// FEED SERVICE — kuratierter HomeFeed
// Kein Infinite Scroll. Bewusste Auswahl. Ruhige Priorisierung.
// ─────────────────────────────────────────────────────────────
export const feedService = {

  // Lädt kuratierten Feed: Posts + Werke + Stories gemischt
  // Limit bewusst klein (12) — kein toxischer Endless-Feed
  async getHomeFeed({ userId, followedIds = [], limit = 12 } = {}) {
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 Tage

      // Parallele Queries
      const [postsRes, worksRes] = await Promise.all([

        // feed_posts: Gedanken (eigene + Followed)
        safeQuery(
          supabase.from('feed_posts')
            .select(`
              id, user_id, caption, media_url, media_type,
              mood, location, created_at,
              profile:user_id(id, display_name, avatar_url, talent, location_label)
            `)
            .eq('is_archived', false)
            .gte('created_at', since)
            .order('created_at', { ascending: false })
            .limit(limit)
        ),

        // works: Veröffentlichte Werke
        safeQuery(
          supabase.from('works')
            .select(`
              id, title, description, cover_url, category, price, status,
              creator_id, created_at,
              profile:creator_id(id, display_name, avatar_url, talent)
            `)
            .eq('status', 'published')
            .gte('created_at', since)
            .order('created_at', { ascending: false })
            .limit(Math.ceil(limit / 2))
        ),
      ]);

      // Zusammenführen + normalisieren
      const posts = (postsRes.data || []).map(p => ({
        ...p,
        _type:       'post',
        creator:     p.profile?.display_name || 'Anonym',
        creatorImg:  p.profile?.avatar_url   || null,
        creatorId:   p.profile?.id           || p.user_id,
        talent:      p.profile?.talent       || null,
        text:        p.caption,
        resonanz:    0,  // wird lazy geladen
      }));

      const works = (worksRes.data || []).map(w => ({
        ...w,
        _type:       'work',
        creator:     w.profile?.display_name || 'Anonym',
        creatorImg:  w.profile?.avatar_url   || null,
        creatorId:   w.profile?.id           || w.creator_id,
        talent:      w.profile?.talent       || null,
        img:         w.cover_url,
        resonanz:    0,
      }));

      // Zeitlich mischen (neueste zuerst)
      const merged = [...posts, ...works]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit);

      return { items: merged, total: merged.length, error: null };
    } catch (err) {
      sentryCapture(err, { context: 'feedService.getHomeFeed' });
      return { items: [], total: 0, error: err.message };
    }
  },

  // Gedanke/Post erstellen
  async createPost({ userId, caption, mediaUrl = null, mediaType = 'text', mood = null, location = null }) {
    if (!userId) return { error: 'Nicht eingeloggt' };
    if (!caption?.trim() && !mediaUrl) return { error: 'Inhalt fehlt' };

    try {
      const { data, error } = await supabase.from('feed_posts').insert({
        user_id:    userId,
        caption:    caption?.trim() || null,
        media_url:  mediaUrl,
        media_type: mediaType,
        mood,
        location,
        is_archived: false,
      }).select('id, created_at').single();

      if (error) throw error;
      return { data };
    } catch (err) {
      sentryCapture(err, { context: 'feedService.createPost' });
      return { error: err.message };
    }
  },

  // Post archivieren (kein hartes Löschen)
  async archivePost({ userId, postId }) {
    try {
      const { error } = await supabase.from('feed_posts')
        .update({ is_archived: true, updated_at: new Date().toISOString() })
        .eq('id', postId)
        .eq('user_id', userId); // RLS-Schutz: nur eigene Posts
      if (error) throw error;
      return { success: true };
    } catch (err) {
      sentryCapture(err, { context: 'feedService.archivePost' });
      return { error: err.message };
    }
  },
};

// ─────────────────────────────────────────────────────────────
// WORKS SERVICE — Werke erstellen, laden, veröffentlichen
// ─────────────────────────────────────────────────────────────
export const worksService = {

  // Werk mit Berechtigungsprüfung erstellen
  async createWork({ user, profile, workData }) {
    if (!user?.id) return { error: 'Nicht eingeloggt' };

    // Zentrale Berechtigungsprüfung
    const { allowed, reason } = canCreateContent(profile, CONTENT_TYPES.WORK);
    if (!allowed) return { error: reason };

    try {
      const { data, error } = await supabase.from('works').insert({
        creator_id:  user.id,
        title:       workData.title?.trim(),
        description: workData.description?.trim() || null,
        category:    workData.category   || 'kreativ',
        medium:      workData.medium     || null,
        price:       workData.price      || null,
        cover_url:   workData.coverUrl   || null,
        images:      workData.images     || [],
        tags:        workData.tags       || [],
        visibility:  workData.visibility || 'public',
        status:      workData.isDraft    ? 'draft' : 'published',
        location_text: workData.location || null,
      }).select('id, status, created_at').single();

      if (error) throw error;
      return { data };
    } catch (err) {
      sentryCapture(err, { context: 'worksService.createWork' });
      return { error: err.message };
    }
  },

  // Werk laden (mit Creator-Profil)
  async getWork(id) {
    try {
      const { data, error } = await supabase.from('works')
        .select(`
          id, title, description, cover_url, images, category, medium,
          price, status, visibility, tags, location_text, creator_id, created_at,
          profile:creator_id(id, display_name, avatar_url, talent, location_label, bio)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return { data };
    } catch (err) {
      sentryCapture(err, { context: 'worksService.getWork' });
      return { data: null, error: err.message };
    }
  },

  // Alle veröffentlichten Werke für Discovery
  async getPublishedWorks({ limit = 16, category = null, excludeIds = [] } = {}) {
    try {
      let q = supabase.from('works')
        .select(`
          id, title, cover_url, category, price, creator_id, created_at,
          profile:creator_id(id, display_name, avatar_url, talent)
        `)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (category) q = q.eq('category', category);
      if (excludeIds.length) q = q.not('id', 'in', `(${excludeIds.join(',')})`);

      const { data, error } = await q;
      if (error) throw error;

      return {
        works: (data || []).map(w => ({
          ...w,
          creator:    w.profile?.display_name || 'Anonym',
          creatorImg: w.profile?.avatar_url   || null,
          img:        w.cover_url,
        })),
      };
    } catch (err) {
      sentryCapture(err, { context: 'worksService.getPublishedWorks' });
      return { works: [], error: err.message };
    }
  },

  // Werk eines Creators laden
  async getCreatorWorks(creatorId, { limit = 12, includesDrafts = false } = {}) {
    try {
      let q = supabase.from('works')
        .select('id, title, cover_url, category, price, status, created_at')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!includesDrafts) q = q.eq('status', 'published');

      const { data, error } = await q;
      if (error) throw error;
      return { works: data || [] };
    } catch (err) {
      sentryCapture(err, { context: 'worksService.getCreatorWorks' });
      return { works: [], error: err.message };
    }
  },

  // Werk aktualisieren (nur Owner)
  async updateWork({ userId, workId, updates }) {
    try {
      const { data, error } = await supabase.from('works')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', workId)
        .eq('creator_id', userId) // RLS-Schutz
        .select('id, status').single();
      if (error) throw error;
      return { data };
    } catch (err) {
      sentryCapture(err, { context: 'worksService.updateWork' });
      return { error: err.message };
    }
  },

  // Werk veröffentlichen / als Entwurf speichern
  async publishWork({ userId, workId }) {
    return worksService.updateWork({ userId, workId, updates: { status: 'published' } });
  },

  async saveDraft({ userId, workId }) {
    return worksService.updateWork({ userId, workId, updates: { status: 'draft' } });
  },
};

// ─────────────────────────────────────────────────────────────
// RESONANZ SERVICE — Wrapper um resonance/index.js
// Sauber für UI-Verwendung
// ─────────────────────────────────────────────────────────────
export const resonanceService = {

  // Resonanz geben (idempotent)
  async give({ user, targetType, targetId, resonanceType = 'inspired' }) {
    if (!user?.id) return { error: 'Nicht eingeloggt' };

    const result = await createResonance({ user, targetType, targetId, resonanceType });

    // UI-Feedback: auch wenn alreadyExists → success für optimistic UI
    if (result.alreadyExists) return { success: true, alreadyExists: true };
    if (result.error) return { error: result.error };
    return { success: true, data: result.data };
  },

  // Resonanz zurückziehen
  async withdraw({ user, targetType, targetId, resonanceType = 'inspired' }) {
    if (!user?.id) return { error: 'Nicht eingeloggt' };

    const result = await removeResonance({ user, targetType, targetId, resonanceType });
    if (result.error) return { error: result.error };
    return { success: true };
  },

  // Toggle: gibt oder zieht zurück
  async toggle({ user, targetType, targetId, resonanceType = 'inspired', currentState = false }) {
    if (currentState) {
      return resonanceService.withdraw({ user, targetType, targetId, resonanceType });
    }
    return resonanceService.give({ user, targetType, targetId, resonanceType });
  },

  // Resonanz-Status für ein Target laden (für UI)
  async getStatus({ userId, targetIds, targetType }) {
    if (!userId || !targetIds?.length) return {};
    try {
      const { data } = await supabase.from('resonances')
        .select('target_id, resonance_type')
        .eq('user_id', userId)
        .eq('target_type', targetType)
        .in('target_id', targetIds);

      // Map: { [targetId]: Set<resonanceType> }
      const statusMap = {};
      (data || []).forEach(r => {
        if (!statusMap[r.target_id]) statusMap[r.target_id] = new Set();
        statusMap[r.target_id].add(r.resonance_type);
      });
      return statusMap;
    } catch (err) {
      sentryCapture(err, { context: 'resonanceService.getStatus' });
      return {};
    }
  },
};

// ─────────────────────────────────────────────────────────────
// STORAGE SERVICE — sichere Media-Uploads
// ─────────────────────────────────────────────────────────────
export const storageService = {

  // Bild/Datei uploaden — mit Progress-Callback
  async upload({ file, bucket = 'media', folder, userId, onProgress = null }) {
    if (!file || !userId) return { error: 'Datei oder User fehlt' };

    // Validierung
    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return { error: `Datei zu groß (max ${MAX_SIZE_MB}MB)` };
    }

    const ALLOWED = ['image/jpeg','image/png','image/webp','image/gif','video/mp4','application/pdf'];
    if (!ALLOWED.includes(file.type)) {
      return { error: 'Dateityp nicht unterstützt (JPEG, PNG, WebP, GIF, MP4, PDF)' };
    }

    try {
      const ext  = file.name.split('.').pop().toLowerCase();
      const path = `${folder || 'uploads'}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          contentType: file.type,
          upsert: false,  // kein stilles Überschreiben
        });

      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);

      return { url: publicUrl, path };
    } catch (err) {
      sentryCapture(err, { context: 'storageService.upload' });
      return { error: err.message };
    }
  },

  // Mehrere Bilder hochladen (für Werke)
  async uploadMultiple({ files, bucket = 'media', folder, userId }) {
    if (!files?.length) return { urls: [], paths: [] };

    const results = await Promise.allSettled(
      files.map(f => storageService.upload({ file: f, bucket, folder, userId }))
    );

    const urls  = [];
    const paths = [];
    const errors = [];

    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value.url) {
        urls.push(r.value.url);
        paths.push(r.value.path);
      } else {
        errors.push(`Datei ${i+1}: ${r.reason?.message || r.value?.error || 'Fehler'}`);
      }
    });

    return { urls, paths, errors: errors.length ? errors : null };
  },

  // Öffentliche URL aus Pfad erzeugen
  getPublicUrl(bucket, path) {
    if (!path) return null;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || null;
  },

  // Datei löschen (nur Owner via RLS)
  async remove({ bucket = 'media', path }) {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  },
};

// ─────────────────────────────────────────────────────────────
// DISCOVER SERVICE — resonanzbasierte Entdeckung
// Kein Viralitäts-Algorithmus. Menschliche Resonanz priorisiert.
// ─────────────────────────────────────────────────────────────
export const discoverService = {

  // Kuratierte Discover-Auswahl (bewusst begrenzt)
  async getDiscovery({ userId, category = null, limit = 12 } = {}) {
    try {
      const [talentsRes, worksRes, expRes] = await Promise.all([

        // Talente mit echten Profilen
        safeQuery(
          supabase.from('profiles')
            .select('id, display_name, avatar_url, talent, location_label, bio, is_wirker')
            .eq('has_talent_profile', true)
            .limit(8)
        ),

        // Werke: neueste veröffentlichte
        safeQuery(
          supabase.from('works')
            .select(`
              id, title, cover_url, category, price, creator_id,
              profile:creator_id(display_name, avatar_url)
            `)
            .eq('status', 'published')
            .eq('visibility', 'public')
            .order('created_at', { ascending: false })
            .limit(limit)
        ),

        // Erlebnisse
        safeQuery(
          supabase.from('experiences')
            .select(`
              id, title, cover_url, price, location_text, duration,
              profile:user_id(display_name, avatar_url)
            `)
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(Math.ceil(limit / 2))
        ),
      ]);

      return {
        talents:     talentsRes.data     || [],
        works:       (worksRes.data      || []).map(w => ({
          ...w,
          creator:    w.profile?.display_name || 'Anonym',
          creatorImg: w.profile?.avatar_url   || null,
          img:        w.cover_url,
          resonanz:   0,
        })),
        experiences: (expRes.data        || []).map(e => ({
          ...e,
          creator:    e.profile?.display_name || 'Anonym',
          creatorImg: e.profile?.avatar_url   || null,
          img:        e.cover_url,
        })),
        error: null,
      };
    } catch (err) {
      sentryCapture(err, { context: 'discoverService.getDiscovery' });
      return { talents: [], works: [], experiences: [], error: err.message };
    }
  },
};
