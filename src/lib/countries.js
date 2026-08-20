// src/lib/countries.js
// LÄNDERLISTE (Deutsch) — SSOT für alle Länder-Auswahlfelder in HUI.
// Kurzformen gemäß gängiger deutscher Bezeichnung (analog Auswärtiges Amt).
// Verwendung: ShippingAddressModal (Länder-Picker), ggf. weitere Adressformulare.

export const COUNTRIES_DE = [
  "Afghanistan","Ägypten","Albanien","Algerien","Andorra","Angola",
  "Antigua und Barbuda","Äquatorialguinea","Argentinien","Armenien",
  "Aserbaidschan","Äthiopien","Australien","Bahamas","Bahrain",
  "Bangladesch","Barbados","Belgien","Belize","Benin","Bhutan",
  "Bolivien","Bosnien und Herzegowina","Botsuana","Brasilien",
  "Brunei","Bulgarien","Burkina Faso","Burundi","Chile","China",
  "Costa Rica","Côte d'Ivoire","Dänemark","Deutschland","Dominica",
  "Dominikanische Republik","Dschibuti","Ecuador","El Salvador",
  "Eritrea","Estland","Eswatini","Fidschi","Finnland","Frankreich",
  "Gabun","Gambia","Georgien","Ghana","Grenada","Griechenland",
  "Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras",
  "Indien","Indonesien","Irak","Iran","Irland","Island","Israel",
  "Italien","Jamaika","Japan","Jemen","Jordanien","Kambodscha",
  "Kamerun","Kanada","Kap Verde","Kasachstan","Katar","Kenia",
  "Kirgisistan","Kiribati","Kolumbien","Komoren","Kongo (Republik)",
  "Kongo (Demokratische Republik)","Kroatien","Kuba","Kuwait","Laos",
  "Lesotho","Lettland","Libanon","Liberia","Libyen","Liechtenstein",
  "Litauen","Luxemburg","Madagaskar","Malawi","Malaysia","Malediven",
  "Mali","Malta","Marokko","Marshallinseln","Mauretanien","Mauritius",
  "Mexiko","Mikronesien","Moldau","Monaco","Mongolei","Montenegro",
  "Mosambik","Myanmar","Namibia","Nauru","Nepal","Neuseeland",
  "Nicaragua","Niederlande","Niger","Nigeria","Nordkorea",
  "Nordmazedonien","Norwegen","Oman","Österreich","Osttimor",
  "Pakistan","Palästina","Palau","Panama","Papua-Neuguinea",
  "Paraguay","Peru","Philippinen","Polen","Portugal","Ruanda",
  "Rumänien","Russland","Salomonen","Sambia","Samoa","San Marino",
  "São Tomé und Príncipe","Saudi-Arabien","Schweden","Schweiz",
  "Senegal","Serbien","Seychellen","Sierra Leone","Simbabwe",
  "Singapur","Slowakei","Slowenien","Somalia","Spanien","Sri Lanka",
  "St. Kitts und Nevis","St. Lucia","St. Vincent und die Grenadinen",
  "Südafrika","Sudan","Südkorea","Südsudan","Suriname","Syrien",
  "Tadschikistan","Tansania","Thailand","Togo","Tonga",
  "Trinidad und Tobago","Tschad","Tschechien","Tunesien","Türkei",
  "Turkmenistan","Tuvalu","Uganda","Ukraine","Ungarn","Uruguay",
  "Usbekistan","Vanuatu","Vatikanstadt","Venezuela",
  "Vereinigte Arabische Emirate","Vereinigtes Königreich",
  "Vereinigte Staaten","Vietnam","Weißrussland","Zentralafrikanische Republik",
  "Zypern",
];

/**
 * Sucht in der Länderliste nach einem Teilstring (case-insensitive, Umlaut-tolerant
 * über einfachen includes-Vergleich). Leerer Query gibt die volle Liste zurück.
 */
export function searchCountries(query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return COUNTRIES_DE;
  return COUNTRIES_DE.filter(c => c.toLowerCase().includes(q));
}
