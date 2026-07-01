// ContentDetailPage.jsx — Unified HUI Content Detail Experience
// Canonical detail surface for all bookable/purchasable content types.
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProfileService } from "../../services/db";
import { supabase } from "../../lib/supabaseClient";
import { normalizeProfileInput } from "../../lib/perfUtils";
import { useAuth } from "../../lib/AuthContext";
import { useAppState } from "../../lib/AppStateContext";
import { HUI } from "../../design/hui.design.js";
import { C, CSS } from "./tokens.js";
import { fmtPrice, getContentImages, formatGermanDate } from "./utils.js";
import { CONTENT_DETAIL_CONFIG, resolveContentType } from "./contentDetailConfig.js";
import Avatar from "./Avatar.jsx";
import ImageGallery from "./ImageGallery.jsx";
import IconBtn from "./IconBtn.jsx";
import RelatedCard from "./RelatedCard.jsx";
import ContentDetailSkeleton from "./ContentDetailSkeleton.jsx";
import { ContentTypeSection } from "./ContentTypeSections.jsx";

export default function ContentDetailPage({
  contentType: contentTypeProp = "work",
  onBuyWerk,
  onAddToKorb,
  onBookExperience,
  onViewCreator,
}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { toggleFollow } = useAppState();

  const contentType = resolveContentType(contentTypeProp);
  const config = CONTENT_DETAIL_CONFIG[contentType];

  const [item, setItem] = useState(null);
  const [creator, setCreator] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resonated, setResonated] = useState(false);
  const [resonanceCount, setResonanceCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [shareOk, setShareOk] = useState(false);
  const [following, setFollowing] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadSocial = useCallback(
    async (itemId, creatorId) => {
      if (!user?.id || !itemId || !config.supportsSocial) return;
      try {
        const { data: likeRow } = await supabase
          .from("work_likes")
          .select("id")
          .eq("work_id", itemId)
          .eq("user_id", user.id)
          .maybeSingle();
        setResonated(!!likeRow);

        const { count: lc } = await supabase
          .from("work_likes")
          .select("id", { count: "exact" })
          .eq("work_id", itemId);
        setResonanceCount(lc || 0);

        const { data: saveRow } = await supabase
          .from("work_saves")
          .select("id")
          .eq("work_id", itemId)
          .eq("user_id", user.id)
          .maybeSingle();
        setSaved(!!saveRow);

        if (creatorId) {
          const { data: followRow } = await supabase
            .from("follows")
            .select("id")
            .eq("follower_id", user.id)
            .eq("followed_id", creatorId)
            .maybeSingle();
          setFollowing(!!followRow);
        }

        const { data: cData } = await supabase
          .from("comments")
          .select("id, text, created_at, user_id, profiles(display_name, avatar_url, username)")
          .eq("work_id", itemId)
          .order("created_at", { ascending: true })
          .limit(50);
        setComments(cData || []);
        setCommentCount((cData || []).length);

        await supabase.rpc("increment_work_views", { work_id: itemId }).catch(() => {});
      } catch (e) {
        console.error("[ContentDetail] loadSocial:", e.message);
      }
    },
    [user?.id, config.supportsSocial]
  );

  const handleLike = useCallback(async () => {
    if (!user?.id || !config.supportsSocial) return;
    const newResonated = !resonated;
    setResonated(newResonated);
    setResonanceCount((c) => (newResonated ? c + 1 : Math.max(0, c - 1)));
    try {
      if (newResonated) {
        await supabase.from("work_likes").insert({ work_id: id, user_id: user.id });
      } else {
        await supabase.from("work_likes").delete().eq("work_id", id).eq("user_id", user.id);
      }
    } catch (e) {
      console.error("[ContentDetail] like:", e.message);
      setResonated(!newResonated);
      setResonanceCount((c) => (newResonated ? Math.max(0, c - 1) : c + 1));
    }
  }, [user?.id, id, resonated, config.supportsSocial]);

  const handleSave = useCallback(async () => {
    if (!user?.id || !config.supportsSocial) return;
    const newSaved = !saved;
    setSaved(newSaved);
    try {
      if (newSaved) {
        await supabase.from("work_saves").insert({ work_id: id, user_id: user.id });
      } else {
        await supabase.from("work_saves").delete().eq("work_id", id).eq("user_id", user.id);
      }
    } catch (e) {
      console.error("[ContentDetail] save:", e.message);
      setSaved(!newSaved);
    }
  }, [user?.id, id, saved, config.supportsSocial]);

  const handleFollow = useCallback(async () => {
    if (!user?.id || !creator?.id) return;
    const newFollowing = !following;
    setFollowing(newFollowing);
    await toggleFollow(creator.id);
  }, [user?.id, creator?.id, following, toggleFollow]);

  const handleComment = useCallback(async () => {
    const txt = commentInput.trim();
    if (!txt || !user?.id || !config.supportsSocial) return;
    setSubmittingComment(true);
    const optimistic = {
      id: "opt_" + Date.now(),
      text: txt,
      work_id: id,
      user_id: user.id,
      created_at: new Date().toISOString(),
      profiles: { display_name: user.user_metadata?.full_name || "Du", avatar_url: null, username: "" },
    };
    setComments((c) => [...c, optimistic]);
    setCommentCount((c) => c + 1);
    setCommentInput("");
    const { error: insertError } = await supabase.from("comments").insert({ work_id: id, user_id: user.id, text: txt });
    if (insertError) {
      console.error("[Comment] insert:", insertError.message);
      setComments((c) => c.filter((x) => x.id !== optimistic.id));
      setCommentCount((c) => c - 1);
    }
    setSubmittingComment(false);
  }, [commentInput, user?.id, id, config.supportsSocial]);

  const loadRelated = useCallback(
    async (category, userId, currentId) => {
      try {
        const queries = await Promise.allSettled([
          supabase
            .from(config.table)
            .select("id, title, price, cover_url, images, category, experience_type")
            .eq("status", "published")
            .eq("category", category || "")
            .neq("id", currentId)
            .limit(6),
          supabase
            .from(config.table)
            .select("id, title, price, cover_url, images, category, experience_type")
            .eq("status", "published")
            .eq("user_id", userId || "")
            .neq("id", currentId)
            .limit(4),
        ]);

        const catItems = queries[0].status === "fulfilled" ? queries[0].value.data || [] : [];
        const userItems = queries[1].status === "fulfilled" ? queries[1].value.data || [] : [];
        const seen = new Set();
        const merged = [...catItems, ...userItems]
          .filter((w) => {
            if (seen.has(w.id)) return false;
            seen.add(w.id);
            return true;
          })
          .slice(0, 8);

        setRelated(merged);
      } catch (e) {
        console.warn("[HUI] Related content error:", e.message);
      }
    },
    [config.table]
  );

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data: row, error: rowErr } = await supabase.from(config.table).select(config.select).eq("id", id).single();

      if (rowErr || !row) throw new Error(config.notFoundTitle);
      setItem(row);

      const creatorId = row.user_id || row.creator_id;
      if (creatorId) {
        const { data: prof } = await ProfileService.getById(creatorId);
        setCreator(prof || null);
      } else {
        setCreator(null);
      }

      await loadRelated(row.category, creatorId, id);
      if (user?.id) await loadSocial(id, creatorId);
    } catch (e) {
      console.error("[HUI] ContentDetail error:", e);
      setError(e.message || config.notFoundTitle);
    } finally {
      setLoading(false);
    }
  }, [id, config, user?.id, loadRelated, loadSocial]);

  useEffect(() => {
    load();
  }, [load]);

  const handleShare = () => {
    const url = window.location.href;
    const title = item?.title || `${config.typeLabel} auf HUI`;
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).catch(() => {});
    }
    setShareOk(true);
    setTimeout(() => setShareOk(false), 2000);
  };

  const handlePrimaryCommerce = () => {
    const payload = { ...item, img: getContentImages(item)[0], price: fmtPrice(item?.price) };
    if (contentType === "experience") {
      onBookExperience?.(payload);
      return;
    }
    onBuyWerk?.(payload);
  };

  const handleSecondaryCommerce = () => {
    const payload = { ...item, img: getContentImages(item)[0], price: fmtPrice(item?.price), type: contentType };
    onAddToKorb?.(payload);
  };

  if (loading) return <ContentDetailSkeleton />;

  if (error || !item) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: C.warm,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
        }}
      >
        <style>{CSS}</style>
        <div style={{ fontSize: 52, marginBottom: 16 }}>😕</div>
        <div style={{ fontWeight: 800, fontSize: 20, color: C.ink, marginBottom: 8 }}>{config.notFoundTitle}</div>
        <div style={{ fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 1.6, marginBottom: 24, maxWidth: 260 }}>
          {error || config.notFoundBody}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="cd-tap"
          style={{
            padding: "13px 28px",
            borderRadius: 16,
            background: `linear-gradient(135deg,${C.teal},${C.teal2})`,
            color: "white",
            border: "none",
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: `0 4px 18px ${C.tealGlow}`,
          }}
        >
          Zurück
        </button>
      </div>
    );
  }

  const images = getContentImages(item);
  const priceStr = fmtPrice(item.price);
  const displayName = creator?.display_name || creator?.username || "Unbekannter Creator";
  const username = creator?.username || "hui-user";
  const avatarUrl = creator?.avatar_url || null;
  const categoryLabel = item.category || item.experience_type || config.typeLabel;
  const isBuyable = contentType === "work" ? item.for_sale !== false : true;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.warm,
        fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
        maxWidth: 680,
        margin: "0 auto",
      }}
    >
      <style>{CSS}</style>

      <div
        style={{
          position: "fixed",
          top: "max(16px,env(safe-area-inset-top,16px))",
          left: 16,
          zIndex: 200,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="cd-tap"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.38)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white",
            fontSize: 18,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ‹
        </button>
      </div>

      <ImageGallery images={images} title={item.title || config.typeLabel} placeholderEmoji={config.placeholderEmoji} />

      <div style={{ padding: "0 0 120px", animation: "cdFadeUp 0.4s 0.1s both" }}>
        <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              background: C.coralPale,
              border: `1px solid ${C.coral}33`,
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 800,
              color: C.coral,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            {categoryLabel}
          </div>
          {priceStr && (
            <div style={{ fontSize: 26, fontWeight: 900, color: C.ink, letterSpacing: -0.5 }}>{priceStr}</div>
          )}
        </div>

        <div style={{ padding: "12px 20px 0" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(20px,2.2rem,30px)",
              fontWeight: 900,
              color: C.ink,
              letterSpacing: -0.8,
              lineHeight: 1.15,
            }}
          >
            {item.title || config.defaultTitle}
          </h1>
        </div>

        <div
          onClick={() =>
            onViewCreator ? onViewCreator(normalizeProfileInput(creator)) : navigate(`/profile/${username}`)
          }
          className="cd-tap"
          style={{
            margin: "16px 20px 0",
            padding: "14px 16px",
            background: C.card,
            borderRadius: 18,
            border: `1px solid ${C.border}`,
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
          }}
        >
          <Avatar url={avatarUrl} name={displayName} size={46} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 15,
                  color: C.ink,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {displayName}
              </span>
              {creator?.is_wirker && <span style={{ fontSize: 13 }}>✦</span>}
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>@{username}</div>
            {creator?.bio && (
              <div
                style={{
                  fontSize: 12,
                  color: C.ink2,
                  marginTop: 4,
                  lineHeight: 1.5,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {creator.bio}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
            {user?.id && creator?.id && user.id !== creator.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFollow();
                }}
                style={{
                  padding: "7px 14px",
                  background: following ? "rgba(0,0,0,0.06)" : "linear-gradient(135deg,#16D7C5,#11C5B7)",
                  border: "none",
                  borderRadius: 50,
                  fontSize: 12,
                  fontWeight: 700,
                  color: following ? "#888" : "white",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all .2s",
                }}
              >
                {following ? "Folge ich" : "Folgen"}
              </button>
            )}
            <div style={{ color: C.muted, fontSize: 18 }}>›</div>
          </div>
        </div>

        <div
          style={{
            margin: "16px 20px 0",
            padding: "8px 4px",
            background: C.card,
            borderRadius: 18,
            border: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-around",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <IconBtn
            icon="✦"
            label={resonanceCount > 0 ? String(resonanceCount) : "Resonanz"}
            active={resonated}
            color={C.coral}
            onPress={handleLike}
            disabled={!config.supportsSocial}
          />
          <IconBtn
            icon="💬"
            label={commentCount > 0 ? String(commentCount) : "Kommentar"}
            active={showComments}
            color={C.teal}
            onPress={() => setShowComments((s) => !s)}
            disabled={!config.supportsSocial}
          />
          <IconBtn icon={shareOk ? "✅" : "↗️"} label={shareOk ? "Kopiert!" : "Teilen"} active={shareOk} color={C.teal} onPress={handleShare} />
          <IconBtn
            icon={saved ? "🔖" : "📌"}
            label={saved ? "Gespeichert" : "Merken"}
            active={saved}
            color={C.gold}
            onPress={handleSave}
            disabled={!config.supportsSocial}
          />
        </div>

        {showComments && config.supportsSocial && (
          <div
            style={{
              margin: "12px 20px 0",
              background: C.card,
              borderRadius: 18,
              border: `1px solid ${C.border}`,
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", gap: 8, padding: "12px 14px", borderBottom: `1px solid ${C.border}` }}>
              <input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                placeholder="Dein Kommentar..."
                style={{
                  flex: 1,
                  border: `1px solid ${C.border}`,
                  borderRadius: 50,
                  padding: "9px 14px",
                  fontSize: 13,
                  color: HUI.COLOR.ink,
                  fontFamily: "inherit",
                  outline: "none",
                  background: HUI.COLOR.cream,
                }}
              />
              <button
                onClick={handleComment}
                disabled={!commentInput.trim() || submittingComment}
                style={{
                  padding: "9px 16px",
                  background: "linear-gradient(135deg,#16D7C5,#11C5B7)",
                  border: "none",
                  borderRadius: 50,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "white",
                  cursor: "pointer",
                  opacity: !commentInput.trim() ? 0.4 : 1,
                }}
              >
                →
              </button>
            </div>
            <div style={{ maxHeight: 280, overflowY: "auto" }}>
              {comments.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", fontSize: 13, color: "#888" }}>
                  Noch kein Kommentar. Sei der Erste.
                </div>
              ) : (
                (comments || [])
                  .filter((c) => c && (c.id || c.user_id))
                  .map((c) => (
                    <div
                      key={c.id}
                      style={{
                        display: "flex",
                        gap: 10,
                        padding: "10px 14px",
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: "linear-gradient(135deg,#16D7C544,#FF8A6B44)",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 13,
                          color: HUI.COLOR.teal,
                        }}
                      >
                        {c.profiles?.avatar_url ? (
                          <img src={c.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          c.profiles?.display_name?.[0] || "?"
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "baseline", marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: 12, color: HUI.COLOR.ink }}>
                            {c.profiles?.display_name || "Nutzer"}
                          </span>
                          <span style={{ fontSize: 10, color: "#BBB" }}>
                            {new Date(c.created_at).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: HUI.COLOR.ink2, lineHeight: 1.5 }}>{c.text}</div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {item.description && (
          <div
            style={{
              margin: "16px 20px 0",
              padding: "18px",
              background: C.card,
              borderRadius: 18,
              border: `1px solid ${C.border}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: C.muted,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Beschreibung
            </div>
            <p style={{ margin: 0, fontSize: 14.5, color: C.ink2, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
              {item.description}
            </p>
          </div>
        )}

        <ContentTypeSection contentType={contentType} item={item} />

        <div style={{ margin: "12px 20px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {categoryLabel && (
            <div style={{ padding: "14px 16px", background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: C.muted,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                {contentType === "experience" ? "Typ" : "Kategorie"}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{categoryLabel}</div>
            </div>
          )}
          {item.created_at && (
            <div style={{ padding: "14px 16px", background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: C.muted,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                Erstellt
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{formatGermanDate(item.created_at)}</div>
            </div>
          )}
          {item.location_text && contentType === "work" && (
            <div style={{ padding: "14px 16px", background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: C.muted,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                Standort
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{item.location_text}</div>
            </div>
          )}
        </div>

        {related.length > 0 && (
          <div style={{ margin: "24px 0 0" }}>
            <div style={{ padding: "0 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: C.ink }}>{config.relatedTitle}</div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>
                {related.length} {config.typeLabel === "Werk" ? "Werke" : "Erlebnisse"}
              </div>
            </div>
            <div className="cd-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 20px 4px" }}>
              {(related || [])
                .filter((w) => w && typeof w === "object")
                .map((w) => (
                  <RelatedCard
                    key={w.id}
                    item={w}
                    label={config.typeLabel}
                    onClick={(relatedId) => navigate(config.detailPath(relatedId))}
                  />
                ))}
            </div>
          </div>
        )}
      </div>

      {isBuyable && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: 680,
            padding: "12px 20px",
            paddingBottom: "max(12px,env(safe-area-inset-bottom,12px))",
            background: "rgba(249,247,244,0.96)",
            backdropFilter: "blur(16px)",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            gap: 10,
            zIndex: 150,
          }}
        >
          <button
            onClick={handleSecondaryCommerce}
            className="cd-tap"
            style={{
              flex: 1,
              padding: "14px",
              background: "none",
              border: `1.5px solid ${C.coral}55`,
              borderRadius: 16,
              color: C.coral,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {config.commerce.secondaryLabel}
          </button>
          <button
            onClick={handlePrimaryCommerce}
            className="cd-tap"
            style={{
              flex: 2,
              padding: "14px",
              background: `linear-gradient(135deg,${C.coral},${C.coral2})`,
              border: "none",
              borderRadius: 16,
              color: "white",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: `0 4px 18px ${C.coralGlow}`,
            }}
          >
            {config.commerce.primaryLabel}
          </button>
        </div>
      )}
    </div>
  );
}
