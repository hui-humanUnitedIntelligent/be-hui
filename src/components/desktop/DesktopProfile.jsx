// ══════════════════════════════════════════════════════════════════════════════
// DesktopProfile.jsx — HUI Desktop V3 — Profil
// ══════════════════════════════════════════════════════════════════════════════
//
// Links (sticky): Avatar, Name, Talent, Ort, Mitgliedschaft, Impact, Follower,
// Bio, Skills, Aktionen. Rechts (scrollbar): Werke, Momente, Erlebnisse,
// Empfehlungen.
//
// DATEN: useProfileData(profileId), ProfileService.getByUsername() (unverändert)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';
import { useProfileData, filterWorksForPublic } from '../../hooks/useProfileData.js';
import { ProfileService } from '../../services/db.js';

import { WorksSection }       from '../profile/sections/WorksSection.jsx';
import { ExperiencesSection } from '../profile/sections/ExperiencesSection.jsx';
import { MomentsSection }     from '../profile/sections/MomentsSection.jsx';
import { RecommendationsSection } from '../profile/sections/RecommendationsSection.jsx';
import { TalentSection }      from '../profile/sections/TalentSection.jsx';
import { PublicTalentOffersSection } from '../profile/sections/PublicTalentOffersSection.jsx';
import { formatDateDE } from "../../lib/formatters.js";

function ProfileLoading() {
  return (
    <div className="prof-loading">
      <div className="prof-loading-avatar" />
      <div className="prof-loading-line" style={{ width: '60%' }} />
      <div className="prof-loading-line" style={{ width: '40%' }} />
    </div>
  );
}

function ProfileSidebar({ profile, followCounts, isOwner, onNavigate }) {
  if (!profile) return <ProfileLoading />;
  const displayName = profile.display_name || profile.username || 'HUI Mitglied';

  return (
    <div className="prof-side">
      {profile.avatar_url ? <img className="prof-avatar" src={profile.avatar_url} alt={displayName} /> : (
        <div className="prof-avatar prof-avatar-fallback">{displayName.charAt(0).toUpperCase()}</div>
      )}
      <h1 className="prof-name">{displayName}</h1>
      {profile.username && <p className="prof-username">@{profile.username}</p>}
      {profile.tagline && <p className="prof-tagline">{profile.tagline}</p>}

      {profile.talent && (
        <div className="prof-talent"><span>Talent</span><strong>{profile.talent}</strong></div>
      )}
      {profile.location && (
        <div className="prof-row">
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2a6 6 0 0 1 6 6c0 5-6 10-6 10S4 13 4 8a6 6 0 0 1 6-6z" /><circle cx="10" cy="8" r="2" /></svg>
          <span>{profile.location}</span>
        </div>
      )}
      {profile.membership_type && profile.membership_type !== 'free' && (
        <div className="prof-membership">{profile.membership_type === 'premium' ? 'Premium Mitglied' : profile.membership_type}</div>
      )}
      {(profile.impact_eur || 0) > 0 && (
        <div className="prof-impact"><span>{`€${profile.impact_eur.toFixed(2)}`}</span><small>Wirkung</small></div>
      )}
      <div className="prof-stats">
        <div><strong>{followCounts?.followers || 0}</strong><small>Follower</small></div>
        <div><strong>{followCounts?.following || 0}</strong><small>Folgt</small></div>
      </div>
      {profile.bio && <p className="prof-bio">{profile.bio}</p>}
      {profile.skills?.length > 0 && (
        <div className="prof-skills">{profile.skills.slice(0, 5).map((s, i) => <span key={i}>{s}</span>)}</div>
      )}
      <div className="prof-actions">
        {!isOwner ? (
          <>
            <button className="btn-primary">Folgen</button>
          </>
        ) : (
          <button className="btn-secondary" onClick={() => onNavigate('/profile/me/edit')}>Profil bearbeiten</button>
        )}
      </div>
      {profile.member_since && (
        <p className="prof-since">Dabei seit {formatDateDE(new Date(profile.member_since), { month: 'long', year: 'numeric' })}</p>
      )}
    </div>
  );
}

export default function DesktopProfile() {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileId, setProfileId] = useState(null);
  const [idLoading, setIdLoading] = useState(true);

  useEffect(() => {
    if (!username) { setProfileId(user?.id || null); setIdLoading(false); }
    else {
      setIdLoading(true);
      ProfileService.getByUsername(username)
        .then(p => setProfileId(p?.id || null))
        .catch(() => setProfileId(null))
        .finally(() => setIdLoading(false));
    }
  }, [username, user?.id]);

  const { profile, works, experiences, recommendations, moments, followCounts, loading, loadingLazy, error, loadLazy } = useProfileData(profileId);
  const isOwner = profileId === user?.id;

  useEffect(() => { if (profileId && !loading) loadLazy?.(); }, [profileId, loading, loadLazy]);

  const publicWorks = isOwner ? works : filterWorksForPublic(works);

  if (idLoading || (loading && !profile)) {
    return <div className="prof-page"><aside className="prof-left"><ProfileLoading /></aside></div>;
  }
  if (error || !profileId) {
    return <div className="prof-page"><div className="prof-error"><p>Profil konnte nicht geladen werden.</p></div></div>;
  }

  return (
    <div className="prof-page">
      <aside className="prof-left">
        <div className="prof-sticky">
          <ProfileSidebar profile={profile} followCounts={followCounts} isOwner={isOwner} onNavigate={navigate} />
        </div>
      </aside>
      <div className="prof-right">
        <div className="prof-content">
          {profile.has_talent_profile && <section><TalentSection profile={profile} isOwner={isOwner} loading={loading} noPadding /></section>}
          {profile.has_talent_profile && <section><PublicTalentOffersSection profileId={profileId} /></section>}
          <section>
            <h2 className="prof-section-title">Werke</h2>
            {publicWorks.length > 0 ? <WorksSection works={publicWorks} profile={profile} isOwner={isOwner} loading={loading} /> : <p className="v3-empty">Noch keine Werke vorhanden.</p>}
          </section>
          <section>
            <h2 className="prof-section-title">Momente</h2>
            {moments.length > 0 ? <MomentsSection moments={moments} isOwner={isOwner} loading={loadingLazy} /> : <p className="v3-empty">Noch keine Momente geteilt.</p>}
          </section>
          <section>
            <h2 className="prof-section-title">Erlebnisse</h2>
            {experiences.length > 0 ? <ExperiencesSection experiences={experiences} isOwner={isOwner} loading={loadingLazy} /> : <p className="v3-empty">Noch keine Erlebnisse angeboten.</p>}
          </section>
          <section>
            <h2 className="prof-section-title">Empfehlungen</h2>
            <RecommendationsSection recommendations={recommendations} isOwner={isOwner} loading={loadingLazy} profileOwnerId={profileId} profileOwnerName={profile?.display_name || ''} />
          </section>
        </div>
      </div>
    </div>
  );
}
