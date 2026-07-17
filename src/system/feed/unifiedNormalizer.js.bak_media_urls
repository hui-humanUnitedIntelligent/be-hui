import { isProfileTalent } from "../../lib/profileUtils.js";
import { OrbEngine } from "../../core/orbEngine.js";
// HUI Pillars: dezente Grundpfeiler-Zuordnung für Feed-Items
// Lazy-Import um keine Circular Dependencies zu erzeugen
let _pillars = null;
async function getPillars() {
  if (_pillars) return _pillars;
  try {
    _pillars = await import("../../core/hui.pillars.js");
    return _pillars;
  } catch { return null; }
}
// src/system/feed/unifiedNormalizer.js — HUI UNIFIED NORMALIZER (Phase 1)
const safeStr=(v,fb)=>{if(v==null||v==="")return fb!==undefined?fb:"";return String(v).trim();};
const safeNum=(v,fb)=>{const n=Number(v);return isNaN(n)?(fb!==undefined?fb:0):n;};
const safeBool=(v)=>Boolean(v);
const safeUrl=(v)=>(typeof v==="string"&&v.startsWith("http"))?v:null;

function relTime(ts){
  if(!ts)return"";
  try{
    const diff=Date.now()-new Date(ts).getTime();
    const mins=Math.floor(diff/60000);
    if(mins<1)return"gerade eben";
    if(mins<60)return"vor "+mins+" Min";
    const hrs=Math.floor(mins/60);
    if(hrs<24)return"vor "+hrs+" Std";
    const days=Math.floor(hrs/24);
    if(days<7)return"vor "+days+" Tagen";
    return new Date(ts).toLocaleDateString("de-DE",{day:"numeric",month:"short"});
  }catch{return"";}
}

function extractAuthor(raw){
  const p=raw.profile||raw.creator||raw.author||raw.user||{};
  // ── TRACE STEP 7 (nur erstes Work, DEV only) ────────────────────
  if (import.meta.env.DEV && !window.__HUI_STEP7_DONE__ && (raw.type === "work" || raw.title !== undefined)) {
    window.__HUI_STEP7_DONE__ = true;
    console.group("🔍 STEP 7 - extractAuthor");
    console.log("raw.profile:", raw.profile);
    console.log("p (resolved):", p);
    console.log("p.display_name:", p.display_name);
    console.log("p.full_name:", p.full_name);
    console.log("p.username:", p.username);
    console.log("p.avatar_url:", p.avatar_url);
    console.groupEnd();
  }
  // Namens-Priorität (4-stufig):
  // 1. profile.display_name  2. profile.full_name  3. profile.name/username
  // 4. raw-Felder (beitraege etc. haben keinen profile-Join)
  // 5. letzter Fallback — KEIN "Human"
  const _n1 = safeStr(p.display_name);
  const _n2 = safeStr(p.full_name);
  const _n3 = safeStr(p.name);
  const _n4 = safeStr(p.username||p.handle);
  // Stufe 5: raw-eigene Namensfelder (für beitraege ohne profile-Objekt)
  const _n5 = safeStr(raw.display_name||raw.full_name||raw.username);
  const name = _n1||_n2||_n3||_n4||_n5||"Mitglied";
  // authorId: profile.id hat Priorität, rawItem.user_id als Fallback
  const authorId=safeStr(p.id||p.user_id||raw.user_id||raw.creator_id||raw.author_id);
  // avatar: ausschließlich aus Profildaten — niemals Werkbilder
  // Sprint P0: raw.src_thumb + raw.cover_url entfernt (Werkbilder dürfen kein Profilbild sein)
  // raw.avatar_url bleibt als Fallback für beitraege-Rows ohne profile-Objekt
  const avatarUrl=safeUrl(
    p.avatar_url||p.avatar||p.img||
    raw.avatar_url
  );
  const _authorResult = {
    id:authorId,
    name, displayName:name,
    avatar:avatarUrl,
    username:safeStr(p.username||p.handle)||null,
    talent:safeStr(p.talent)||null,
    // Kapitel 2.3: Standort für HumanHeader
    location_label:safeStr(p.location_label||p.city||p.location)||null,
    // Kapitel 2.4: Bio + Mitglied-seit für Story Engine
    bio:safeStr(p.bio)||null,
    member_since:safeStr(p.member_since)||null,
    verified:safeBool(p.verified||p.is_verified),
    // Phase 4C: Membership fields für Feed-Badges
    membershipType:   safeStr(p.membership_type||p.role)||"base",
    membershipActive: safeBool(p.membership_active),
    membershipActive: !!(p.membership_active),
    isTalent: isProfileTalent(p), // Sprint F.4C: einzige Wahrheitsquelle
  };
  if (import.meta.env.DEV && window.__HUI_STEP7_DONE__ && !window.__HUI_STEP7b_DONE__) {
    window.__HUI_STEP7b_DONE__ = true;
    console.group("🔍 STEP 7b - author result");
    console.log("author.name:", _authorResult.name);
    console.log("author.avatar:", _authorResult.avatar);
    console.log("author.displayName:", _authorResult.displayName);
    console.log("full author:", _authorResult);
    console.groupEnd();
  }
  return _authorResult;
}

function extractMedia(raw){
  if(Array.isArray(raw.images)&&raw.images.length>0){
    return raw.images.map(img=>{
      const u=typeof img==="string"?img:(img&&img.url)?img.url:null;
      return safeUrl(u)?{type:"image",url:safeUrl(u)}:null;
    }).filter(Boolean);
  }
  if(Array.isArray(raw.media)&&raw.media.length>0){
    return raw.media.map(img=>{
      const u=typeof img==="string"?img:(img&&img.url)?img.url:null;
      return safeUrl(u)?{type:"image",url:safeUrl(u)}:null;
    }).filter(Boolean);
  }
  const candidates=[raw.src,raw.image_url,raw.cover_url,raw.media_url,raw.expImg,raw.coverUrl,raw.thumbnail,raw.banner];
  for(const c of candidates){const u=safeUrl(c);if(u)return[{type:"image",url:u}];}
  return[];
}

function normalizeType(raw){
  const t=safeStr(raw.type||raw.content_type||raw.item_type,"moment").toLowerCase();
  const map={moment:"moment",note:"moment",post:"moment",beitrag:"moment",
    experience:"experience",erlebnis:"experience",booking:"experience",
    work:"work",work_upload:"work",werk:"work",project:"work",
    event:"event",veranstaltung:"event",invitation:"event",
    // FEED-GLOBAL-001: Talente + Impact als eigene Typen
    talent:"talent",dienstleistung:"talent",angebot:"talent",
    impact:"impact",herzensprojekt:"impact",impact_project:"impact"};
  return map[t]||"moment";
}

export function toFeedItem(raw){
  if(!raw||!raw.id)return null;
  try{
    const type  =normalizeType(raw);
    // ── TRACE STEP 6 (nur erstes Work, DEV only) ────────────────────
    if (import.meta.env.DEV && type === "work" && !window.__HUI_STEP6_DONE__) {
      window.__HUI_STEP6_DONE__ = true;
      console.group("🔍 STEP 6 - normalizeWorkRow → toFeedItem");
      console.log("raw:", raw);
      console.log("raw.profile:", raw.profile);
      console.log("raw.profile?.avatar_url:", raw.profile?.avatar_url);
      console.log("raw.profile?.display_name:", raw.profile?.display_name);
      console.groupEnd();
    }
    const author=extractAuthor(raw);
    const media =extractMedia(raw);
    const text  =safeStr(raw.caption||raw.description||raw.story||raw.text);
    const title =safeStr(raw.title||raw.expTitle||raw.name||(text&&text.slice(0,60)));
    const pillar = raw.pillar || raw.primary_pillar || null;
    return{
      id:String(raw.id), type, author, title:title||null, text:text||null, media,
      createdAt:relTime(raw.created_at||raw.createdAt),
      location:safeStr(raw.location)||null,
      price:raw.price!=null?safeNum(raw.price):null,
      // Umkreissuche (2026-07-06): additiv, nur gesetzt wenn eine nearby_*-RPC
      // aufgerufen wurde (siehe useFeedStream.fetchSearchResults). null in
      // allen anderen Faellen -- keine Verhaltensaenderung fuer bestehende Karten.
      distanceKm:raw.distance_km!=null?safeNum(raw.distance_km):null,
      tags:Array.isArray(raw.tags)?raw.tags.filter(Boolean):[],
      isLive:safeBool(raw.isLive||raw.is_live),
      timeStart:safeStr(raw.time_start||raw.timeStart)||null,
      timeEnd:safeStr(raw.time_end||raw.timeEnd)||null,
      status:safeStr(raw.status)||null,
      duration:safeStr(raw.duration)||null,
      format:safeStr(raw.format)||null,
      bookingMode:safeStr(raw.booking_mode||raw.bookingMode,"direct"),
      _reactions:raw._reactions||{},
      // HUI Core Engine: dezenter Grundpfeiler-Hint — nur bei echten Pillar-Daten
      pillar,
      pillar_hint: raw.pillar_hint ?? (pillar ? OrbEngine.feedHint(pillar) : null),
      _raw:raw,
    };
  }catch(err){
    console.warn("[HUI_NORM_ERR]",raw?.id,err?.message);
    return{id:String(raw.id),type:"moment",
      author:{id:"",name:"Mitglied",displayName:"Mitglied",avatar:null},
      title:null,text:null,media:[],createdAt:"",_reactions:{},_raw:raw};
  }
}

export function toFeedItems(arr){
  if(!Array.isArray(arr))return[];
  return arr.map(toFeedItem).filter(Boolean);
}

export const normalizeMomentRow    =(raw)=>toFeedItem({...raw,type:"moment"});
export const normalizeExperienceRow=(raw)=>toFeedItem({...raw,type:"experience"});
export const normalizeWorkRow      =(raw)=>toFeedItem({...raw,type:"work"});
export const normalizeEventRow     =(raw)=>toFeedItem({...raw,type:"event"});
