// src/feed/feedWelcomeHeaderUtils.js
// Small, side-effect-free helpers for the feed welcome header.

export function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12)  return "Guten Morgen";
  if (h >= 12 && h < 17) return "Guten Tag";
  if (h >= 17 && h < 22) return "Guten Abend";
  return "Hallo";
}

export function getGreetingIcon() {
  const h = new Date().getHours();
  return h >= 5 && h < 20 ? "☀️" : "🌙";
}

export function getFeedHeaderFirstName(currentUser) {
  return currentUser?.display_name?.split(" ")[0]
    || currentUser?.username
    || null;
}

export function getRecentMemberLiveText(recentMember) {
  const name = recentMember?.display_name || recentMember?.username || null;
  const city = recentMember?.city || null;

  return name
    ? `${name}${city ? ` aus ${city}` : ""} ist HUI beigetreten`
    : "Neue Mitglieder entdecken die Plattform";
}
