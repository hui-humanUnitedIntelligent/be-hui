// ══════════════════════════════════════════════════════════════════════════════
// DesktopProfile.jsx — HUI Desktop Profile (Phase 3 — Vollständig)
// ══════════════════════════════════════════════════════════════════════════════
//
// Kein Wrapper mehr. Echte Desktop-Split-Layout-Komponente.
//
// Links (320px, sticky):
//   Avatar, Name, Username, Talente, Ort, Impact, Buttons, Mitgliedschaft
//
// Rechts (scrollbar):
//   Werke, Momente, Erlebnisse, Empfehlungen, Talent
//
// DATEN:
//   useProfileData(profileId) — gleiche Hook wie Mobile
//   ProfileService.getByUsername() — für Username-Lookup
//   Section-Komponenten — gleiche wie Mobile (1:1)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';
import { useProfileData, filterWorksForPublic } from '../../hooks/useProfileData.js';
import { ProfileService } from '../../services/db.js';
import { useNotifCount } from '../../lib/AppStateContext.jsx';

// ── Profile Sections (gleich wie Mobile — 1:1) ───────────────────────────────
import { WorksSection }       from '../profile/sections/WorksSection.jsx';
import { ExperiencesSection } from '../profile/sections/ExperiencesSection.jsx';
import { MomentsSection }     from '../profile/sections/MomentsSection.jsx';
import { RecommendationsSection } from '../profile/sections/RecommendationsSection.jsx';
import { TalentSection }      from '../profile/sections/TalentSection.jsx';
import { PublicTalentOffersSection } from '../profile/sections/PublicTalentOffersSection.jsx';

// ── Loading Placeholder ──────────────────────────────────────────────────────
function ProfileLoading() {
  return (
    <div className="dp-loading">
      <div className="dp-loading-avatar" />
      <div className="dp-loading-line" style={{ width: '60%' }} />
      <div className="dp-loading-line" style={{ width: '40%' }} />
      <div className="dp-loading-line" style={{ width: '80%' }} />
    </div>
  );
}

// ── Left Sidebar ──────────────────────────────────────────────────────────────
function ProfileSidebar({ profile, followCounts, isOwner, onConnect, onMessage, onNavigate }) {
  if (!profile) return <ProfileLoading />;

  return (
    <div className="dp-sidebar">
      {/* Avatar */}
      <div className="dp-avatar-wrap">
        {profile.avatar_url ? (
          <img className="dp-avatar" src={profile.avatar_url} alt={profile.display_name || ''} />
        ) : (
          <div className="dp-avatar dp-avatar-fallback">
            {(profile.display_name || profile.username || '?').charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name + Username */}
      <h1 className="dp-name">{profile.display_name || profile.username || 'HUI Mitglied'}</h1>
      {profile.username && <p className="dp-username">@{profile.username}</p>}
      {profile.tagline && <p className="dp-tagline">{profile.tagline}</p>}

      {/* Talente */}
      {profile.talent && (
        <div className="dp-talent">
          <span className="dp-talent-label">Talent</span>
          <span className="dp-talent-value">{profile.talent}</span>
        </div>
      )}

      {/* Ort */}
      {profile.location && (
        <div className="dp-info-row">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 2a6 6 0 0 1 6 6c0 5-6 10-6 10S4 13 4 8a6 6 0 0 1 6-6z" /><circle cx="10" cy="8" r="2" />
          </svg>
          <span>{profile.location}</span>
        </div>
      )}

      {/* Mitgliedschaft */}
      {profile.membership_type && profile.membership_type !== 'free' && (
        <div className="dp-membership">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="10" cy="10" r="7" /><path d="M10 5l2 3-2 5-2-5 2-3z" />
          </svg>
          <span>{profile.membership_type === 'premium' ? 'Premium Mitglied' : profile.membership_type}</span>
        </div>
      )}

      {/* Impact */}
      {(profile.impact_eur || 0) > 0 && (
        <div className="dp-impact">
          <span className="dp-impact-value">€{profile.impact_eur.toFixed(2)}</span>
          <span className="dp-impact-label">Wirkung</span>
        </div>
      )}

      {/* Follower */}
      <div className="dp-stats">
        <div className="dp-stat">
          <span className="dp-stat-value">{followCounts?.followers || 0}</span>
          <span className="dp-stat-label">Follower</span>
        </div>
        <div className="dp-stat">
          <span className="dp-stat-value">{followCounts?.following || 0}</span>
          <span className="dp-stat-label">Folgt</span>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && <p className="dp-bio">{profile.bio}</p>}

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <div className="dp-skills">
          {profile.skills.slice(0, 5).map((skill, i) => (
            <span key={i} className="dp-skill">{skill}</span>
          ))}
        </div>
      )}

      {/* Buttons */}
      <div className="dp-actions">
        {!isOwner ? (
          <>
            <button className="dp-btn dp-btn-primary" onClick={onConnect}>
              Verbinden
            </button>
            <button className="dp-btn dp-btn-secondary" onClick={onMessage}>
              Nachricht
            </button>
          </>
        ) : (
          <button className="dp-btn dp-btn-secondary" onClick={() => onNavigate('/profile/me/edit')}>
            Profil bearbeiten
          </button>
        )}
      </div>

      {/* Mitglied seit */}
      {profile.member_since && (
        <p className="dp-member-since">
          Dabei seit {new Date(profile.member_since).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
        </p>
      )}
    </div>
  );
}

// ── Hauptkomponente ─═══════════════════════════════════════════════════════════
export default function DesktopProfile() {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileId, setProfileId] = useState(null);
  const [idLoading, setIdLoading] = useState(true);

  // Resolve profileId
  useEffect(() => {
    if (!username) {
      // /profile/me → use current user's ID
      setProfileId(user?.id || null);
      setIdLoading(false);
    } else {
      // /profile/:username → lookup by username
      setIdLoading(true);
      ProfileService.getByUsername(username)
        .then(p => setProfileId(p?.id || null))
        .catch(e => { console.error('[DesktopProfile] lookup:', e); setProfileId(null); })
        .finally(() => setIdLoading(false));
    }
  }, [username, user?.id]);

  // Load profile data (same hook as mobile)
  const {
    profile, works, experiences, recommendations, moments,
    followCounts, loading, loadingLazy, error, loadLazy,
  } = useProfileData(profileId);

  const isOwner = profileId === user?.id;

  // Lazy load sections when profile is ready
  useEffect(() => {
    if (profileId && !loading) {
      loadLazy?.();
    }
  }, [profileId, loading, loadLazy]);

  // Filter works for public view
  const publicWorks = isOwner ? works : filterWorksForPublic(works);

  if (idLoading || (loading && !profile)) {
    return (
      <div className="desktop-profile">
        <aside className="desktop-profile-left">
          <ProfileLoading />
        </aside>
      </div>
    );
  }

  if (error || !profileId) {
    return (
      <div className="desktop-profile">
        <div className="dp-error">
          <p>Profil konnte nicht geladen werden.</p>
          <button className="dp-btn dp-btn-secondary" onClick={() => navigate('/Home')}>Zurück</button>
        </div>
      </div>
    );
  }

  return (
    <div className="desktop-profile">
      {/* ── Left: Sticky Sidebar ─────────────────────────────────── */}
      <aside className="desktop-profile-left">
        <div className="dp-sidebar-sticky">
          <ProfileSidebar
            profile={profile}
            followCounts={followCounts}
            isOwner={isOwner}
            onConnect={() => {/* TODO: connection request */}}
            onMessage={() => {/* TODO: open chat */}}
            onNavigate={navigate}
          />
        </div>
      </aside>

      {/* ── Right: Scrollable Content ─────────────────────────────── */}
      <div className="desktop-profile-right">
        <div className="dp-content">
          {/* Talent Section */}
          {profile.has_talent_profile && (
            <section className="dp-section">
              <TalentSection profile={profile} isOwner={isOwner} loading={loading} noPadding />
            </section>
          )}

          {/* Talent Offers */}
          {profile.has_talent_profile && (
            <section className="dp-section">
              <PublicTalentOffersSection profileId={profileId} />
            </section>
          )}

          {/* Werke */}
          <section className="dp-section">
            <h2 className="dp-section-title">Werke</h2>
            {publicWorks.length > 0 ? (
              <WorksSection works={publicWorks} profile={profile} isOwner={isOwner} loading={loading} />
            ) : (
              <p className="dp-empty">Noch keine Werke vorhanden.</p>
            )}
          </section>

          {/* Momente */}
          <section className="dp-section">
            <h2 className="dp-section-title">Momente</h2>
            {moments.length > 0 ? (
              <MomentsSection moments={moments} isOwner={isOwner} loading={loadingLazy} />
            ) : (
              <p className="dp-empty">Noch keine Momente geteilt.</p>
            )}
          </section>

          {/* Erlebnisse */}
          <section className="dp-section">
            <h2 className="dp-section-title">Erlebnisse</h2>
            {experiences.length > 0 ? (
              <ExperiencesSection experiences={experiences} isOwner={isOwner} loading={loadingLazy} />
            ) : (
              <p className="dp-empty">Noch keine Erlebnisse angeboten.</p>
            )}
          </section>

          {/* Empfehlungen */}
          <section className="dp-section">
            <h2 className="dp-section-title">Empfehlungen</h2>
            <RecommendationsSection
              recommendations={recommendations}
              isOwner={isOwner}
              loading={loadingLazy}
              profileOwnerId={profileId}
              profileOwnerName={profile?.display_name || ''}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
