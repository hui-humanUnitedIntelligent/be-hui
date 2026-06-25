import { isProfileTalent } from "../../lib/profileUtils.js";
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
  console.group("extractAuthor");
  console.log(raw);
  console.log(raw.profile);
  console.log(raw.creator);
  console.log(raw.author);
  console.log(raw.user);
  console.groupEnd();
  const p=raw.profile||raw.creator||raw.author||raw.user||{};
  // Kapitel 2.5: Namens-Priorität — niemals "Human" wenn echter Name vorhanden
  // 1. display_name  2. full_name  3. name  4. username  5. letzter Fallback
  const _n1 = safeStr(p.display_name);
  const _n2 = safeStr(p.full_name);
  const _n3 = safeStr(p.name);
  const _n4 = safeStr(p.username||p.handle);
  const name = _n1||_n2||_n3||_n4||"Mitglied";
  // authorId: profile.id hat Priorität, rawItem.user_id als Fallback
  const authorId=safeStr(p.id||p.user_id||raw.user_id||raw.creator_id||raw.author_id);
  // avatar: profile.avatar_url hat Priorität, rawItem-Felder als Fallback
  const avatarUrl=safeUrl(p.avatar_url||p.avatar||p.img||raw.avatar_url||raw.src_thumb);
  const author={
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
  console.log(author);
  return author;
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
    event:"event",veranstaltung:"event",invitation:"event"};
  return map[t]||"moment";
}

export function toFeedItem(raw){
  if(!raw||!raw.id)return null;
  try{
    const type  =normalizeType(raw);
    const author=extractAuthor(raw);
    const media =extractMedia(raw);
    const text  =safeStr(raw.caption||raw.description||raw.story||raw.text);
    const title =safeStr(raw.title||raw.expTitle||raw.name||(text&&text.slice(0,60)));
    return{
      id:String(raw.id), type, author, title:title||null, text:text||null, media,
      createdAt:relTime(raw.created_at||raw.createdAt),
      location:safeStr(raw.location)||null,
      price:raw.price!=null?safeNum(raw.price):null,
      tags:Array.isArray(raw.tags)?raw.tags.filter(Boolean):[],
      isLive:safeBool(raw.isLive||raw.is_live),
      timeStart:safeStr(raw.time_start||raw.timeStart)||null,
      timeEnd:safeStr(raw.time_end||raw.timeEnd)||null,
      status:safeStr(raw.status)||null,
      duration:safeStr(raw.duration)||null,
      format:safeStr(raw.format)||null,
      bookingMode:safeStr(raw.booking_mode||raw.bookingMode,"direct"),
      _reactions:raw._reactions||{},
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
