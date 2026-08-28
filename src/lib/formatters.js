// src/lib/formatters.js
// ══════════════════════════════════════════════════════════════════
// SSOT: Deutsche Zahlen-/Datums-/Zeit-Formatierung — OHNE Intl/toLocaleString
// ══════════════════════════════════════════════════════════════════
// ROOT CAUSE (2026-08-09): Michael meldete + per Screenshot bestätigt,
// dass Zahlen auf seinem Android-Gerät mit sichtbaren Lücken zwischen
// JEDER Ziffer rendern (z.B. "22.745,50 €" → "2 2 . 7 4 5 , 5 0 €"),
// während Buchstaben normal rendern. Die Inter-Font-Dateien wurden
// per fontTools geprüft — alle Ziffern-Glyphen sind vorhanden, normale
// tabellarische Breite (Inter-Standarddesign). In Node/V8 liefert
// `toLocaleString("de-DE",{style:"currency",currency:"EUR"})` ein
// technisch einwandfreies Ergebnis ("22.745,50 €", ein einziges NBSP vor €).
// → Der Fehler liegt NICHT im Font und NICHT in einer offensichtlichen
// Unicode-Zeichen-Wahl, sondern höchstwahrscheinlich in einer
// degradierten/fehlerhaften ICU-Implementierung des Android-System-
// WebView auf diesem spezifischen Gerät (bekanntes Class von Bugs bei
// älteren/OEM-modifizierten WebView-Versionen).
//
// FIX: Alle deutschen Zahlen-/Datums-/Zeit-Ausgaben laufen ab jetzt
// über diese Datei — komplett ohne Intl/toLocaleString/toLocaleDateString/
// toLocaleTimeString. Deterministische, geräteunabhängige String-Bildung.
// Einzige Quelle der Wahrheit (Architektur-Charta Prinzip: keine zweite
// Wahrheit, keine Duplicate-Logic).
// ══════════════════════════════════════════════════════════════════

// Locale-aware month/weekday arrays
const LOCALE_DATA = {
  de: {
    monthsShort: ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"],
    monthsLong:  ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"],
    weekdaysShort: ["So","Mo","Di","Mi","Do","Fr","Sa"],
    weekdaysLong:  ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"],
  },
  en: {
    monthsShort: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    monthsLong:  ["January","February","March","April","May","June","July","August","September","October","November","December"],
    weekdaysShort: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
    weekdaysLong:  ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
  },
  es: {
    monthsShort: ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],
    monthsLong:  ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"],
    weekdaysShort: ["dom","lun","mar","mié","jue","vie","sáb"],
    weekdaysLong:  ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"],
  },
  fr: {
    monthsShort: ["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"],
    monthsLong:  ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"],
    weekdaysShort: ["dim","lun","mar","mer","jeu","ven","sam"],
    weekdaysLong:  ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"],
  },
  it: {
    monthsShort: ["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"],
    monthsLong:  ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"],
    weekdaysShort: ["dom","lun","mar","mer","gio","ven","sab"],
    weekdaysLong:  ["domenica","lunedì","martedì","mercoledì","giovedì","venerdì","sabato"],
  },
  tr: {
    monthsShort: ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"],
    monthsLong:  ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"],
    weekdaysShort: ["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"],
    weekdaysLong:  ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"],
  },
  pt: {
    monthsShort: ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"],
    monthsLong:  ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"],
    weekdaysShort: ["dom","seg","ter","qua","qui","sex","sáb"],
    weekdaysLong:  ["domingo","segunda","terça","quarta","quinta","sexta","sábado"],
  },
  sq: {
    monthsShort: ["jan","shk","mar","pri","maj","qer","kor","gus","sht","tet","nën","dhj"],
    monthsLong:  ["janar","shkurt","mars","prill","maj","qershor","korrik","gusht","shtator","tetor","nëntor","dhjetor"],
    weekdaysShort: ["Die","Hën","Mar","Mër","Enj","Pre","Sht"],
    weekdaysLong:  ["Dielë","Hënë","Martë","Mërkurë","Enjte","Premte","Shtunë"],
  },
};

// Global locale (defaults to 'de' for backwards compatibility)
let _formatLocale = 'de';

export function setFormatLocale(locale) {
  if (LOCALE_DATA[locale]) _formatLocale = locale;
}

export function getFormatLocale() {
  return _formatLocale;
}

// Backwards-compat constants (DE, used as fallback)
const MONTHS_SHORT = LOCALE_DATA.de.monthsShort;
const MONTHS_LONG  = LOCALE_DATA.de.monthsLong;
const WEEKDAYS_SHORT = LOCALE_DATA.de.weekdaysShort;
const WEEKDAYS_LONG  = LOCALE_DATA.de.weekdaysLong;

function pad2(n) { return String(n).padStart(2, "0"); }

// Gruppiert Ziffern mit '.' alle 3 Stellen von rechts (deutsche Konvention)
function groupThousands(intPartStr) {
  const neg = intPartStr.startsWith("-");
  const s = neg ? intPartStr.slice(1) : intPartStr;
  let out = "";
  for (let i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 === 0) out += ".";
    out += s[i];
  }
  return (neg ? "-" : "") + out;
}

/**
 * formatNumberDE(1234.5)                                  => "1.234,5"
 * formatNumberDE(1234.5, {minimumFractionDigits:2})        => "1.234,50"
 * formatNumberDE(1234,   {maximumFractionDigits:0})        => "1.234"
 */
export function formatNumberDE(value, opts = {}) {
  if (value == null || value === "" || Number.isNaN(Number(value))) return "0";
  const { minimumFractionDigits = 0, maximumFractionDigits } = opts;
  // Intl.NumberFormat-Default: maximumFractionDigits=3 wenn nicht angegeben
  const maxDec = maximumFractionDigits != null ? maximumFractionDigits : Math.max(minimumFractionDigits, 3);
  const num = Number(value);
  const fixed = num.toFixed(Math.max(maxDec, minimumFractionDigits, 0));
  let [intPart, decPart = ""] = fixed.split(".");
  if (decPart) {
    while (decPart.length > minimumFractionDigits && decPart.endsWith("0")) {
      decPart = decPart.slice(0, -1);
    }
  }
  const grouped = groupThousands(intPart);
  return decPart ? `${grouped},${decPart}` : grouped;
}

/**
 * formatEUR(1234.5)                         => "1.234,50 €"
 * formatEUR(1234.5, {minimumFractionDigits:0}) => "1.234,50 €" (Default 2 Dezimalstellen)
 * formatEUR(null)                            => "—"
 */
export function formatEUR(value, opts = {}) {
  if (value == null) return "—";
  const { minimumFractionDigits = 2, maximumFractionDigits = 2 } = opts;
  return `${formatNumberDE(value, { minimumFractionDigits, maximumFractionDigits })} €`;
}

/**
 * formatDateDE(iso, { day:"2-digit", month:"short", year:"2-digit" })
 * Unterstützt exakt die im Code verwendeten Kombinationen aus
 * day: "2-digit"|"numeric", month: "2-digit"|"numeric"|"short"|"long",
 * year: "2-digit"|"numeric", weekday: "short"|"long".
 */
export function formatDateDE(input, opts = {}) {
  if (!input) return "";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  const { day, month, year, weekday, locale } = opts;
  const loc = locale || _formatLocale;
  const locData = LOCALE_DATA[loc] || LOCALE_DATA.de;

  const weekdayStr = weekday
    ? (weekday === "long" ? locData.weekdaysLong[d.getDay()] : locData.weekdaysShort[d.getDay()])
    : "";

  // Nur Wochentag angefragt (z.B. { weekday: "short" })
  if (weekdayStr && !day && !month && !year) return weekdayStr;

  let dayStr = "";
  if (day === "2-digit") dayStr = pad2(d.getDate());
  else if (day === "numeric") dayStr = String(d.getDate());

  const numericMonth = (month === "2-digit" || month === "numeric");
  let monthStr = "";
  // For non-DE locales, short months don't get a trailing dot
  const shortMonthSuffix = (loc === 'de') ? "." : "";
  if (month === "short") monthStr = locData.monthsShort[d.getMonth()] + shortMonthSuffix;
  else if (month === "long") monthStr = locData.monthsLong[d.getMonth()];
  else if (month === "2-digit") monthStr = pad2(d.getMonth() + 1);
  else if (month === "numeric") monthStr = String(d.getMonth() + 1);

  let yearStr = "";
  if (year === "2-digit") yearStr = pad2(d.getFullYear() % 100);
  else if (year === "numeric") yearStr = String(d.getFullYear());

  let datePart = "";
  if (numericMonth) {
    // Rein numerisches Datum: 08.08.2026 / 8.8 / 08.08
    const segs = [dayStr, monthStr, yearStr].filter(Boolean);
    datePart = segs.join(".");
  } else {
    // Monat als Wort: "8. August 2026" / "8. Aug. 2026" / "August 2026"
    let dm = "";
    if (dayStr) dm += `${dayStr}.`;
    if (monthStr) dm += (dm ? " " : "") + monthStr;
    if (yearStr) dm += (dm ? " " : "") + yearStr;
    datePart = dm;
  }

  return weekdayStr ? `${weekdayStr}, ${datePart}` : datePart;
}

/**
 * formatTimeDE(iso, { hour12:false })  => "14:32"
 */
export function formatTimeDE(input, opts = {}) {
  if (!input) return "";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  const { hour12 = false, second } = opts;
  let h = d.getHours();
  let suffix = "";
  if (hour12) {
    suffix = h >= 12 ? " PM" : " AM";
    h = h % 12 || 12;
  }
  let out = `${pad2(h)}:${pad2(d.getMinutes())}`;
  if (second === "2-digit") out += `:${pad2(d.getSeconds())}`;
  return out + suffix;
}
