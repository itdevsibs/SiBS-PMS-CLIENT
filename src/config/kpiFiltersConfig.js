// Configuration and resolver functions for WFM KPI filter options.

export const PERIOD_OPTIONS = [
  {
    value: "weekly",
    label: "Weekly",
  },
  {
    value: "monthly",
    label: "Monthly",
  },
  {
    value: "quarterly",
    label: "Quarterly",
  },
  {
    value: "annually",
    label: "Annually",
  },
  {
    value: "custom",
    label: "Custom",
  },
];

export const SOURCE_OPTIONS = [
  {
    value: "FUSECOM",
    label: "Fusecom",
  },
  {
    value: "HERODASH",
    label: "HeroDash",
  },
];

export const TASK_ORDER_OPTIONS_BY_SOURCE = {
  US_VISA: [
    { value: "", label: "All Task Orders" },
    { value: "TO4", label: "TO4 - PAC" },
    { value: "TO10", label: "TO10 - SEASIA" },
    { value: "TO12", label: "TO12 - NICE" },
    { value: "TO14", label: "TO14 - NESAMI" },
    { value: "TO16", label: "TO16 - SEURECA" },
    { value: "TO18", label: "TO18 - NEA" },
    { value: "TO22", label: "TO22 - SAMI" },
    { value: "OTHER", label: "Other" },
  ],
  FUSECOM: [
    { value: "", label: "All Task Orders" },
    { value: "TO12", label: "TO12 - NICE" },
    { value: "TO16", label: "TO16 - SEURECA" },
    { value: "OTHER", label: "Other" },
  ],
  HERODASH: [
    { value: "", label: "All Task Orders" },
    { value: "TO4", label: "TO4 - PAC" },
    { value: "TO10", label: "TO10 - SEASIA" },
    { value: "OTHER", label: "Other" },
  ],
};

export const GENERIC_SKILL_OPTIONS = [
  { value: "All English", label: "All English", isCategory: true },
  { value: "English NIV", label: "English NIV", isCategory: true },
  { value: "English IV", label: "English IV", isCategory: true },
  { value: "English ACS", label: "English ACS", isCategory: true },
  { value: "Non English", label: "Non English", isCategory: true },
  { value: "Non English IV", label: "Non English IV", isCategory: true },
];

export const SKILL_OPTIONS = [
  { value: "", label: "All Skills" },
  ...GENERIC_SKILL_OPTIONS,
];

export const SKILLS_BY_COUNTRY = {
  Albania: [
    "GSS 2.0 :: Albania - Albanian NIV",
    "GSS 2.0 :: Albania - English NIV",
  ],
  Algeria: [
    "ALGERIA English IV",
    "ALGERIA English NIV",
  ],
  Armenia: [
    "GSS 2.0 :: Armenia - Armenian NIV",
    "GSS 2.0 :: Armenia - English IV",
    "GSS 2.0 :: Armenia - English NIV",
    "GSS 2.0 :: Armenia - Farsi NIV",
  ],
  Australia: [
    "GSS 2.0 :: Australia - English NIV",
    "GSS 2.0 :: Australia - English ACS",
    "GSS 2.0 :: Australia - English IV",
    "GSS 2.0 :: Australia - VCH English NIV",
  ],
  Austria: [
    "GSS 2.0 :: Austria - English NIV",
    "GSS 2.0 :: Austria - English IV",
    "GSS 2.0 :: Austria - German IV",
    "GSS 2.0 :: Austria - German NIV",
  ],
  Azerbaijan: [
    "GSS 2.0 :: Azerbaijan - Azerbaijani NIV",
    "GSS 2.0 :: Azerbaijan - English NIV",
    "GSS 2.0 :: Azerbaijan - Russian NIV",
  ],
  Bahrain: [
    "BAHRAIN English IV",
    "BAHRAIN English NIV",
  ],
  Bangladesh: [
    "BANGLADESH English IV",
    "BANGLADESH English NIV",
  ],
  "Bosnia and Herzegovina": [
    "GSS 2.0 :: Bosnia&Herzegovina - Bosnian ACS",
    "GSS 2.0 :: Bosnia&Herzegovina - Bosnian IV",
    "GSS 2.0 :: Bosnia&Herzegovina - Bosnian NIV",
    "GSS 2.0 :: Bosnia&Herzegovina - English ACS",
    "GSS 2.0 :: Bosnia&Herzegovina - English NIV",
  ],
  Bulgaria: [
    "GSS 2.0 :: Bulgaria - Bulgarian IV",
    "GSS 2.0 :: Bulgaria - Bulgarian NIV",
    "GSS 2.0 :: Bulgaria - English IV",
    "GSS 2.0 :: Bulgaria - English NIV",
  ],
  Cambodia: [
    "CAMBODIA English IV",
    "CAMBODIA English NIV",
    "CAMBODIA Khmer IV",
    "CAMBODIA Khmer NIV",
  ],
  China: [
    "GSS 2.0 :: China - Cantonese IV",
    "GSS 2.0 :: China - Cantonese NIV",
    "GSS 2.0 :: China - English IV",
    "GSS 2.0 :: China - English NIV",
    "GSS 2.0 :: China - Mandarin IV",
    "GSS 2.0 :: China - Mandarin NIV",
  ],
  Croatia: [
    "GSS 2.0 :: Croatia - Croatian IV",
    "GSS 2.0 :: Croatia - Croatian NIV",
    "GSS 2.0 :: Croatia - English IV",
    "GSS 2.0 :: Croatia - English NIV",
  ],
  Cyprus: [
    "GSS 2.0 :: Cyprus - English IV",
    "GSS 2.0 :: Cyprus - English NIV",
    "GSS 2.0 :: Cyprus - Greek IV",
    "GSS 2.0 :: Cyprus - Greek NIV",
    "GSS 2.0 :: Cyprus - Turkish IV",
    "GSS 2.0 :: Cyprus - Turkish NIV",
  ],
  "Czech Republic": [
    "GSS 2.0 :: Czech Republic - Czech IV",
    "GSS 2.0 :: Czech Republic - Czech NIV",
    "GSS 2.0 :: Czech Republic - English IV",
    "GSS 2.0 :: Czech Republic - English NIV",
    "GSS 2.0 :: Czech Republic - Russian IV",
    "GSS 2.0 :: Czech Republic - Russian NIV",
  ],
  Denmark: [
    "GSS 2.0 :: Denmark - Danish IV",
    "GSS 2.0 :: Denmark - Danish NIV",
    "GSS 2.0 :: Denmark - English IV",
    "GSS 2.0 :: Denmark - English NIV",
  ],
  Egypt: [
    "EGYPT Arabic IV",
    "EGYPT Arabic NIV",
    "EGYPT English IV",
    "EGYPT English NIV",
  ],
  Estonia: [
    "GSS 2.0 :: Estonia - English IV",
    "GSS 2.0 :: Estonia - English NIV",
    "GSS 2.0 :: Estonia - Estonian IV",
    "GSS 2.0 :: Estonia - Estonian NIV",
    "GSS 2.0 :: Estonia - Russian IV",
    "GSS 2.0 :: Estonia - Russian NIV",
  ],
  Fiji: [
    "GSS 2.0 :: Fiji - English IV",
    "GSS 2.0 :: Fiji - English NIV",
    "GSS 2.0 :: Fiji - Hindi NIV",
  ],
  Finland: [
    "GSS 2.0 :: Finland - English IV",
    "GSS 2.0 :: Finland - English NIV",
    "GSS 2.0 :: Finland - Finnish IV",
    "GSS 2.0 :: Finland - Finnish NIV",
    "GSS 2.0 :: Finland - Russian IV",
    "GSS 2.0 :: Finland - Russian NIV",
  ],
  Georgia: [
    "GSS 2.0 :: Georgia - English IV",
    "GSS 2.0 :: Georgia - English NIV",
    "GSS 2.0 :: Georgia - Georgian NIV",
    "GSS 2.0 :: Georgia - Russian NIV",
  ],
  Germany: [
    "GSS 2.0 :: Germany - English IV",
    "GSS 2.0 :: Germany - English NIV",
    "GSS 2.0 :: Germany - German IV",
    "GSS 2.0 :: Germany - German NIV",
    "GSS 2.0 :: Germany - Russian IV",
    "GSS 2.0 :: Germany - Russian NIV",
  ],
  Greece: [
    "GSS 2.0 :: Greece - English IV",
    "GSS 2.0 :: Greece - English NIV",
    "GSS 2.0 :: Greece - Greek IV",
    "GSS 2.0 :: Greece - Greek NIV",
  ],
  "Hong Kong": [
    "GSS 2.0 :: Hong Kong - Cantonese IV",
    "GSS 2.0 :: Hong Kong - Cantonese NIV",
    "GSS 2.0 :: Hong Kong - English IV",
    "GSS 2.0 :: Hong Kong - English NIV",
    "GSS 2.0 :: Hong Kong - Mandarin IV",
    "GSS 2.0 :: Hong Kong - Mandarin NIV",
  ],
  Hungary: [
    "GSS 2.0 :: Hungary - English IV",
    "GSS 2.0 :: Hungary - English NIV",
    "GSS 2.0 :: Hungary - Hungarian IV",
    "GSS 2.0 :: Hungary - Hungarian NIV",
  ],
  Indonesia: [
    "INDONESIA Bahasa Indonesia IV",
    "INDONESIA Bahasa Indonesia NIV",
    "INDONESIA English IV",
    "INDONESIA English NIV",
  ],
  Israel: [
    "GSS 2.0 :: Israel - Arabic IV",
    "GSS 2.0 :: Israel - Arabic NIV",
    "GSS 2.0 :: Israel - English IV",
    "GSS 2.0 :: Israel - English NIV",
    "GSS 2.0 :: Israel - Hebrew IV",
    "GSS 2.0 :: Israel - Hebrew NIV",
    "GSS 2.0 :: Israel - Russian IV",
    "GSS 2.0 :: Israel - Russian NIV",
  ],
  Japan: [
    "GSS 2.0 :: Japan - English ACS",
    "GSS 2.0 :: Japan - English IV",
    "GSS 2.0 :: Japan - English NIV",
    "GSS 2.0 :: Japan - Japanese ACS",
    "GSS 2.0 :: Japan - Japanese IV",
    "GSS 2.0 :: Japan - Japanese NIV",
  ],
  Jordan: [
    "JORDAN Arabic IV",
    "JORDAN Arabic NIV",
    "JORDAN English IV",
    "JORDAN English NIV",
  ],
  Korea: [
    "GSS 2.0 :: Korea - English ACS",
    "GSS 2.0 :: Korea - English IV",
    "GSS 2.0 :: Korea - English NIV",
    "GSS 2.0 :: Korea - Korean ACS",
    "GSS 2.0 :: Korea - Korean IV",
    "GSS 2.0 :: Korea - Korean NIV",
  ],
  Kosovo: [
    "GSS 2.0 :: Kosovo - Albanian IV",
    "GSS 2.0 :: Kosovo - Albanian NIV",
    "GSS 2.0 :: Kosovo - English IV",
    "GSS 2.0 :: Kosovo - English NIV",
    "GSS 2.0 :: Kosovo - Serbian IV",
    "GSS 2.0 :: Kosovo - Serbian NIV",
  ],
  Kuwait: [
    "KUWAIT Arabic IV",
    "KUWAIT Arabic NIV",
    "KUWAIT English IV",
    "KUWAIT English NIV",
  ],
  Laos: [
    "LAOS English IV",
    "LAOS English NIV",
    "LAOS Lao IV",
    "LAOS Lao NIV",
  ],
  Latvia: [
    "GSS 2.0 :: Latvia - English IV",
    "GSS 2.0 :: Latvia - English NIV",
    "GSS 2.0 :: Latvia - Latvian IV",
    "GSS 2.0 :: Latvia - Latvian NIV",
    "GSS 2.0 :: Latvia - Russian IV",
    "GSS 2.0 :: Latvia - Russian NIV",
  ],
  Lebanon: [
    "LEBANON Arabic IV",
    "LEBANON Arabic NIV",
    "LEBANON English IV",
    "LEBANON English NIV",
    "LEBANON French IV",
    "LEBANON French NIV",
  ],
  Malaysia: [
    "MALAYSIA English IV",
    "MALAYSIA English NIV",
    "MALAYSIA Malay IV",
    "MALAYSIA Malay NIV",
    "MALAYSIA Mandarin IV",
    "MALAYSIA Mandarin NIV",
  ],
  Mongolia: [
    "GSS 2.0 :: Mongolia - English IV",
    "GSS 2.0 :: Mongolia - English NIV",
    "GSS 2.0 :: Mongolia - Mongolian IV",
    "GSS 2.0 :: Mongolia - Mongolian NIV",
  ],
  Montenegro: [
    "GSS 2.0 :: Montenegro - English IV",
    "GSS 2.0 :: Montenegro - English NIV",
    "GSS 2.0 :: Montenegro - Montenegrin IV",
    "GSS 2.0 :: Montenegro - Montenegrin NIV",
  ],
  Morocco: [
    "MOROCCO Arabic IV",
    "MOROCCO Arabic NIV",
    "MOROCCO English IV",
    "MOROCCO English NIV",
    "MOROCCO French IV",
    "MOROCCO French NIV",
  ],
  Nepal: [
    "NEPAL English IV",
    "NEPAL English NIV",
  ],
  "New Zealand": [
    "GSS 2.0 :: New Zealand - English ACS",
    "GSS 2.0 :: New Zealand - English IV",
    "GSS 2.0 :: New Zealand - English NIV",
  ],
  "Northern Macedonia": [
    "GSS 2.0 :: North Macedonia - Albanian IV",
    "GSS 2.0 :: North Macedonia - Albanian NIV",
    "GSS 2.0 :: North Macedonia - English IV",
    "GSS 2.0 :: North Macedonia - English NIV",
    "GSS 2.0 :: North Macedonia - Macedonian IV",
    "GSS 2.0 :: North Macedonia - Macedonian NIV",
  ],
  Norway: [
    "GSS 2.0 :: Norway - English IV",
    "GSS 2.0 :: Norway - English NIV",
    "GSS 2.0 :: Norway - Norwegian IV",
    "GSS 2.0 :: Norway - Norwegian NIV",
  ],
  Oman: [
    "OMAN Arabic IV",
    "OMAN Arabic NIV",
    "OMAN English IV",
    "OMAN English NIV",
  ],
  Pakistan: [
    "PAKISTAN English IV",
    "PAKISTAN English NIV",
    "PAKISTAN Urdu IV",
    "PAKISTAN Urdu NIV",
  ],
  Philippines: [
    "PHILIPPINES English ACS",
    "PHILIPPINES English IV",
    "PHILIPPINES English NIV",
    "PHILIPPINES Tagalog ACS",
    "PHILIPPINES Tagalog IV",
    "PHILIPPINES Tagalog NIV",
  ],
  Poland: [
    "GSS 2.0 :: Poland - English IV",
    "GSS 2.0 :: Poland - English NIV",
    "GSS 2.0 :: Poland - Polish IV",
    "GSS 2.0 :: Poland - Polish NIV",
    "GSS 2.0 :: Poland - Russian IV",
    "GSS 2.0 :: Poland - Russian NIV",
  ],
  Qatar: [
    "QATAR Arabic IV",
    "QATAR Arabic NIV",
    "QATAR English IV",
    "QATAR English NIV",
  ],
  "Rep. of Moldova": [
    "GSS 2.0 :: Moldova - English IV",
    "GSS 2.0 :: Moldova - English NIV",
    "GSS 2.0 :: Moldova - Romanian IV",
    "GSS 2.0 :: Moldova - Romanian NIV",
    "GSS 2.0 :: Moldova - Russian IV",
    "GSS 2.0 :: Moldova - Russian NIV",
  ],
  Romania: [
    "GSS 2.0 :: Romania - English IV",
    "GSS 2.0 :: Romania - English NIV",
    "GSS 2.0 :: Romania - Romanian IV",
    "GSS 2.0 :: Romania - Romanian NIV",
    "GSS 2.0 :: Romania - Russian IV",
    "GSS 2.0 :: Romania - Russian NIV",
  ],
  "Saudi Arabia": [
    "SAUDI ARABIA Arabic IV",
    "SAUDI ARABIA Arabic NIV",
    "SAUDI ARABIA English IV",
    "SAUDI ARABIA English NIV",
  ],
  Serbia: [
    "GSS 2.0 :: Serbia - English IV",
    "GSS 2.0 :: Serbia - English NIV",
    "GSS 2.0 :: Serbia - Serbian IV",
    "GSS 2.0 :: Serbia - Serbian NIV",
  ],
  Singapore: [
    "SINGAPORE English IV",
    "SINGAPORE English NIV",
    "SINGAPORE Mandarin IV",
    "SINGAPORE Mandarin NIV",
  ],
  Slovakia: [
    "GSS 2.0 :: Slovakia - English IV",
    "GSS 2.0 :: Slovakia - English NIV",
    "GSS 2.0 :: Slovakia - Slovak IV",
    "GSS 2.0 :: Slovakia - Slovak NIV",
  ],
  "Sri Lanka": [
    "SRI LANKA English IV",
    "SRI LANKA English NIV",
    "SRI LANKA Sinhala IV",
    "SRI LANKA Sinhala NIV",
    "SRI LANKA Tamil IV",
    "SRI LANKA Tamil NIV",
  ],
  Sweden: [
    "GSS 2.0 :: Sweden - English IV",
    "GSS 2.0 :: Sweden - English NIV",
    "GSS 2.0 :: Sweden - Swedish IV",
    "GSS 2.0 :: Sweden - Swedish NIV",
  ],
  Switzerland: [
    "GSS 2.0 :: Switzerland - English IV",
    "GSS 2.0 :: Switzerland - English NIV",
    "GSS 2.0 :: Switzerland - French IV",
    "GSS 2.0 :: Switzerland - French NIV",
    "GSS 2.0 :: Switzerland - German IV",
    "GSS 2.0 :: Switzerland - German NIV",
    "GSS 2.0 :: Switzerland - Italian IV",
    "GSS 2.0 :: Switzerland - Italian NIV",
  ],
  Taiwan: [
    "TAIWAN English IV",
    "TAIWAN English NIV",
    "TAIWAN Mandarin IV",
    "TAIWAN Mandarin NIV",
  ],
  Thailand: [
    "THAILAND English IV",
    "THAILAND English NIV",
    "THAILAND Thai IV",
    "THAILAND Thai NIV",
  ],
  Tunisia: [
    "TUNISIA Arabic IV",
    "TUNISIA Arabic NIV",
    "TUNISIA English IV",
    "TUNISIA English NIV",
    "TUNISIA French IV",
    "TUNISIA French NIV",
  ],
  Turkiye: [
    "GSS 2.0 :: Turkiye - English IV",
    "GSS 2.0 :: Turkiye - English NIV",
    "GSS 2.0 :: Turkiye - Farsi IV",
    "GSS 2.0 :: Turkiye - Farsi NIV",
    "GSS 2.0 :: Turkiye - Turkish IV",
    "GSS 2.0 :: Turkiye - Turkish NIV",
  ],
  Ukraine: [
    "GSS 2.0 :: Ukraine - English IV",
    "GSS 2.0 :: Ukraine - English NIV",
    "GSS 2.0 :: Ukraine - Russian IV",
    "GSS 2.0 :: Ukraine - Russian NIV",
    "GSS 2.0 :: Ukraine - Ukrainian IV",
    "GSS 2.0 :: Ukraine - Ukrainian NIV",
  ],
  "United Arab Emirates": [
    "GSS 2.0 :: UAE - Arabic IV",
    "GSS 2.0 :: UAE - Arabic NIV",
    "GSS 2.0 :: UAE - English IV",
    "GSS 2.0 :: UAE - English NIV",
    "GSS 2.0 :: UAE - Farsi IV",
    "GSS 2.0 :: UAE - Farsi NIV",
  ],
  Vietnam: [
    "VIETNAM English IV",
    "VIETNAM English NIV",
    "VIETNAM Vietnamese IV",
    "VIETNAM Vietnamese NIV",
  ],
};

export const OTHER_COUNTRY_OPTIONS = [
  { value: "albania", label: "Albania" },
  { value: "armenia", label: "Armenia" },
  { value: "azerbaijan", label: "Azerbaijan" },
  { value: "bosnia and herzegovina", label: "Bosnia and Herzegovina" },
  { value: "bulgaria", label: "Bulgaria" },
  { value: "croatia", label: "Croatia" },
  { value: "cyprus", label: "Cyprus" },
  { value: "georgia", label: "Georgia" },
  { value: "greece", label: "Greece" },
  { value: "israel", label: "Israel" },
  { value: "kosovo", label: "Kosovo" },
  { value: "mongolia", label: "Mongolia" },
  { value: "northern macedonia", label: "Northern Macedonia" },
  { value: "poland", label: "Poland" },
  { value: "rep. of moldova", label: "Rep. of Moldova" },
  { value: "romania", label: "Romania" },
  { value: "serbia", label: "Serbia" },
  { value: "turkiye", label: "Turkiye" },
  { value: "ukraine", label: "Ukraine" },
  { value: "united arab emirates", label: "United Arab Emirates" },
];

export const COUNTRY_OPTIONS_BY_SOURCE_AND_TO = {
  US_VISA: {
    "": [
      { value: "", label: "All Countries" },
      { value: "algeria", label: "Algeria" },
      { value: "australia", label: "Australia" },
      { value: "austria", label: "Austria" },
      { value: "bahrain", label: "Bahrain" },
      { value: "bangladesh", label: "Bangladesh" },
      { value: "cambodia", label: "Cambodia" },
      { value: "china", label: "China" },
      { value: "czech republic", label: "Czech Republic" },
      { value: "denmark", label: "Denmark" },
      { value: "egypt", label: "Egypt" },
      { value: "estonia", label: "Estonia" },
      { value: "fiji", label: "Fiji" },
      { value: "finland", label: "Finland" },
      { value: "germany", label: "Germany" },
      { value: "hong kong", label: "Hong Kong" },
      { value: "hungary", label: "Hungary" },
      { value: "indonesia", label: "Indonesia" },
      { value: "japan", label: "Japan" },
      { value: "jordan", label: "Jordan" },
      { value: "korea", label: "Korea" },
      { value: "kuwait", label: "Kuwait" },
      { value: "laos", label: "Laos" },
      { value: "latvia", label: "Latvia" },
      { value: "lebanon", label: "Lebanon" },
      { value: "malaysia", label: "Malaysia" },
      { value: "montenegro", label: "Montenegro" },
      { value: "morocco", label: "Morocco" },
      { value: "nepal", label: "Nepal" },
      { value: "new zealand", label: "New Zealand" },
      { value: "norway", label: "Norway" },
      { value: "oman", label: "Oman" },
      { value: "pakistan", label: "Pakistan" },
      { value: "philippines", label: "Philippines" },
      { value: "qatar", label: "Qatar" },
      { value: "saudi arabia", label: "Saudi Arabia" },
      { value: "singapore", label: "Singapore" },
      { value: "slovakia", label: "Slovakia" },
      { value: "sri lanka", label: "Sri Lanka" },
      { value: "sweden", label: "Sweden" },
      { value: "switzerland", label: "Switzerland" },
      { value: "taiwan", label: "Taiwan" },
      { value: "thailand", label: "Thailand" },
      { value: "tunisia", label: "Tunisia" },
      { value: "vietnam", label: "Vietnam" },
    ],
    TO4: [
      { value: "", label: "All Countries (TO4)" },
      { value: "australia", label: "Australia" },
      { value: "fiji", label: "Fiji" },
      { value: "japan", label: "Japan" },
      { value: "korea", label: "Korea" },
      { value: "new zealand", label: "New Zealand" },
    ],
    TO10: [
      { value: "", label: "All Countries (TO10)" },
      { value: "cambodia", label: "Cambodia" },
      { value: "indonesia", label: "Indonesia" },
      { value: "laos", label: "Laos" },
      { value: "malaysia", label: "Malaysia" },
      { value: "philippines", label: "Philippines" },
      { value: "singapore", label: "Singapore" },
      { value: "taiwan", label: "Taiwan" },
      { value: "thailand", label: "Thailand" },
      { value: "vietnam", label: "Vietnam" },
    ],
    TO12: [
      { value: "", label: "All Countries (TO12)" },
      { value: "austria", label: "Austria" },
      { value: "czech republic", label: "Czech Republic" },
      { value: "denmark", label: "Denmark" },
      { value: "estonia", label: "Estonia" },
      { value: "finland", label: "Finland" },
      { value: "germany", label: "Germany" },
      { value: "hungary", label: "Hungary" },
      { value: "latvia", label: "Latvia" },
      { value: "montenegro", label: "Montenegro" },
      { value: "norway", label: "Norway" },
      { value: "slovakia", label: "Slovakia" },
      { value: "sweden", label: "Sweden" },
      { value: "switzerland", label: "Switzerland" },
    ],
    TO16: [
      { value: "", label: "All Countries (TO16)" },
      { value: "china", label: "China" },
      { value: "hong kong", label: "Hong Kong" },
    ],
    TO18: [
      { value: "", label: "All Countries (TO18)" },
      { value: "algeria", label: "Algeria" },
      { value: "bahrain", label: "Bahrain" },
      { value: "egypt", label: "Egypt" },
      { value: "jordan", label: "Jordan" },
      { value: "kuwait", label: "Kuwait" },
      { value: "lebanon", label: "Lebanon" },
      { value: "morocco", label: "Morocco" },
      { value: "oman", label: "Oman" },
      { value: "qatar", label: "Qatar" },
      { value: "saudi arabia", label: "Saudi Arabia" },
      { value: "tunisia", label: "Tunisia" },
    ],
    TO22: [
      { value: "", label: "All Countries (TO22)" },
      { value: "bangladesh", label: "Bangladesh" },
      { value: "nepal", label: "Nepal" },
      { value: "pakistan", label: "Pakistan" },
      { value: "sri lanka", label: "Sri Lanka" },
    ],
    OTHER: [
      { value: "", label: "All Other Countries" },
      ...OTHER_COUNTRY_OPTIONS,
    ],
  },
  FUSECOM: {
    "": [
      { value: "", label: "All Countries" },
      { value: "austria", label: "Austria" },
      { value: "china", label: "China" },
      { value: "czech republic", label: "Czech Republic" },
      { value: "denmark", label: "Denmark" },
      { value: "estonia", label: "Estonia" },
      { value: "finland", label: "Finland" },
      { value: "germany", label: "Germany" },
      { value: "hong kong", label: "Hong Kong" },
      { value: "hungary", label: "Hungary" },
      { value: "latvia", label: "Latvia" },
      { value: "montenegro", label: "Montenegro" },
      { value: "norway", label: "Norway" },
      { value: "slovakia", label: "Slovakia" },
      { value: "sweden", label: "Sweden" },
      { value: "switzerland", label: "Switzerland" },
      ...OTHER_COUNTRY_OPTIONS,
    ],
    TO12: [
      { value: "", label: "All Countries (TO12)" },
      { value: "austria", label: "Austria" },
      { value: "czech republic", label: "Czech Republic" },
      { value: "denmark", label: "Denmark" },
      { value: "estonia", label: "Estonia" },
      { value: "finland", label: "Finland" },
      { value: "germany", label: "Germany" },
      { value: "hungary", label: "Hungary" },
      { value: "latvia", label: "Latvia" },
      { value: "montenegro", label: "Montenegro" },
      { value: "norway", label: "Norway" },
      { value: "slovakia", label: "Slovakia" },
      { value: "sweden", label: "Sweden" },
      { value: "switzerland", label: "Switzerland" },
    ],
    TO16: [
      { value: "", label: "All Countries (TO16)" },
      { value: "china", label: "China" },
      { value: "hong kong", label: "Hong Kong" },
    ],
    OTHER: [
      { value: "", label: "All Other Countries" },
      ...OTHER_COUNTRY_OPTIONS,
    ],
  },
  HERODASH: {
    "": [
      { value: "", label: "All Countries" },
      { value: "australia", label: "Australia" },
      { value: "cambodia", label: "Cambodia" },
      { value: "fiji", label: "Fiji" },
      { value: "indonesia", label: "Indonesia" },
      { value: "japan", label: "Japan" },
      { value: "korea", label: "Korea" },
      { value: "laos", label: "Laos" },
      { value: "malaysia", label: "Malaysia" },
      { value: "new zealand", label: "New Zealand" },
      { value: "philippines", label: "Philippines" },
      { value: "singapore", label: "Singapore" },
      { value: "taiwan", label: "Taiwan" },
      { value: "thailand", label: "Thailand" },
      { value: "vietnam", label: "Vietnam" },
    ],
    TO4: [
      { value: "", label: "All Countries (TO4)" },
      { value: "australia", label: "Australia" },
      { value: "fiji", label: "Fiji" },
      { value: "japan", label: "Japan" },
      { value: "korea", label: "Korea" },
      { value: "new zealand", label: "New Zealand" },
    ],
    TO10: [
      { value: "", label: "All Countries (TO10)" },
      { value: "cambodia", label: "Cambodia" },
      { value: "indonesia", label: "Indonesia" },
      { value: "laos", label: "Laos" },
      { value: "malaysia", label: "Malaysia" },
      { value: "philippines", label: "Philippines" },
      { value: "singapore", label: "Singapore" },
      { value: "taiwan", label: "Taiwan" },
      { value: "thailand", label: "Thailand" },
      { value: "vietnam", label: "Vietnam" },
    ],
    OTHER: [
      { value: "", label: "All Other Countries" },
    ],
  },
};

export const LOB_OPTIONS = [
  { value: "", label: "All LOBs" },
  { value: "Call", label: "Call" },
  { value: "Case", label: "Case" },
];

export const DEFAULT_FILTERS = {
  sourceSystem: [],
  taskOrder: [],
  skill: [],
  country: [],
  lob: "",
  period: "weekly",
  referenceDate: "2026-07-31",
  from: "",
  to: "",
};

export function getTaskOrderOptions(sourceSystem) {
  const sources = Array.isArray(sourceSystem)
    ? sourceSystem.filter((s) => s && s !== "__NONE__")
    : [sourceSystem];

  if (
    !sources.length ||
    sources.includes("US_VISA") ||
    (sources.includes("FUSECOM") && sources.includes("HERODASH"))
  ) {
    return (TASK_ORDER_OPTIONS_BY_SOURCE.US_VISA || []).filter(
      (opt) => opt.value !== "",
    );
  }
  if (sources.includes("FUSECOM") && !sources.includes("HERODASH")) {
    return (TASK_ORDER_OPTIONS_BY_SOURCE.FUSECOM || []).filter(
      (opt) => opt.value !== "",
    );
  }
  if (sources.includes("HERODASH") && !sources.includes("FUSECOM")) {
    return (TASK_ORDER_OPTIONS_BY_SOURCE.HERODASH || []).filter(
      (opt) => opt.value !== "",
    );
  }
  return (TASK_ORDER_OPTIONS_BY_SOURCE.US_VISA || []).filter(
    (opt) => opt.value !== "",
  );
}

export function getTaskOrderLabel(sourceSystem, value) {
  if (!value || (Array.isArray(value) && !value.length)) return "All Task Orders";
  const list = Array.isArray(value)
    ? value.filter((v) => v && v !== "__NONE__")
    : String(value)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  if (!list.length) return "All Task Orders";

  const allOpts = getTaskOrderOptions(sourceSystem);
  return list
    .map((val) => allOpts.find((o) => o.value === val)?.label || val)
    .join(", ");
}

export function getSkillsForCountries(countryList = [], skillsMap = SKILLS_BY_COUNTRY) {
  const normalizedSelected = countryList
    .map((c) => String(c || "").trim().toLowerCase())
    .filter(Boolean);

  if (!normalizedSelected.length) return [];

  const matchedSkills = [];
  const mapToUse = skillsMap || SKILLS_BY_COUNTRY;
  for (const [countryName, skills] of Object.entries(mapToUse)) {
    if (normalizedSelected.includes(countryName.toLowerCase())) {
      for (const s of skills) {
        if (!matchedSkills.includes(s)) {
          matchedSkills.push(s);
        }
      }
    }
  }

  return matchedSkills;
}

export function getSkillOptions(sourceSystem, selectedCountries, selectedTaskOrders, skillsMap = SKILLS_BY_COUNTRY) {
  const genericOptions = GENERIC_SKILL_OPTIONS;

  const countryList = Array.isArray(selectedCountries)
    ? selectedCountries.filter((c) => c && c !== "__NONE__")
    : selectedCountries
      ? [selectedCountries]
      : [];

  if (countryList.length > 0) {
    const countrySkills = getSkillsForCountries(countryList, skillsMap);
    const specificOptions = countrySkills.map((s) => ({ value: s, label: s }));
    return [...genericOptions, ...specificOptions];
  }

  const toList = Array.isArray(selectedTaskOrders)
    ? selectedTaskOrders.filter((to) => to && to !== "__NONE__")
    : selectedTaskOrders
      ? [selectedTaskOrders]
      : [];

  if (toList.length > 0) {
    const toCountries = getCountryOptions(sourceSystem, toList).map((c) => c.value);
    const toSkills = getSkillsForCountries(toCountries, skillsMap);
    const specificOptions = toSkills.map((s) => ({ value: s, label: s }));
    return [...genericOptions, ...specificOptions];
  }

  const allCountrySkills = [];
  const seen = new Set();
  for (const skills of Object.values(skillsMap || SKILLS_BY_COUNTRY)) {
    for (const s of skills) {
      if (!seen.has(s)) {
        seen.add(s);
        allCountrySkills.push({ value: s, label: s });
      }
    }
  }

  return [...genericOptions, ...allCountrySkills];
}

export function getSkillLabel(sourceSystem, value, selectedCountries, selectedTaskOrders, skillsMap = SKILLS_BY_COUNTRY) {
  if (!value || (Array.isArray(value) && !value.length)) return "All Skills";
  const list = Array.isArray(value)
    ? value.filter((v) => v && v !== "__NONE__")
    : String(value)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  if (!list.length) return "All Skills";

  const allOpts = getSkillOptions(sourceSystem, selectedCountries, selectedTaskOrders, skillsMap);
  return list
    .map(
      (val) =>
        allOpts.find((o) => o.value.toLowerCase() === val.toLowerCase())
          ?.label ||
        SKILL_OPTIONS.find((o) => o.value.toLowerCase() === val.toLowerCase())
          ?.label ||
        val,
    )
    .join(", ");
}

export function getCountryOptions(sourceSystem, taskOrder) {
  const sources = Array.isArray(sourceSystem)
    ? sourceSystem.filter((s) => s && s !== "__NONE__")
    : [sourceSystem];

  const primarySource =
    !sources.length ||
      sources.includes("US_VISA") ||
      (sources.includes("FUSECOM") && sources.includes("HERODASH"))
      ? "US_VISA"
      : sources.includes("FUSECOM")
        ? "FUSECOM"
        : "HERODASH";

  const sourceCountries =
    COUNTRY_OPTIONS_BY_SOURCE_AND_TO[primarySource] ||
    COUNTRY_OPTIONS_BY_SOURCE_AND_TO.US_VISA ||
    {};

  const toList = Array.isArray(taskOrder)
    ? taskOrder.filter((to) => to && to !== "__NONE__")
    : taskOrder
      ? String(taskOrder)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
      : [];

  // If no specific task order is selected (All Task Orders)
  if (!toList.length) {
    return (sourceCountries[""] || []).filter((opt) => opt.value !== "");
  }

  // Combine countries for all selected task orders
  const countryMap = new Map();
  for (const to of toList) {
    const countriesForTo = sourceCountries[to] || [];
    for (const opt of countriesForTo) {
      if (opt.value && !countryMap.has(opt.value)) {
        countryMap.set(opt.value, opt);
      }
    }
  }

  return Array.from(countryMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

export function getCountryLabel(sourceSystem, taskOrder, value) {
  if (!value || (Array.isArray(value) && !value.length)) return "All Countries";
  const list = Array.isArray(value)
    ? value.filter((v) => v && v !== "__NONE__")
    : String(value)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  if (!list.length) return "All Countries";

  const allOpts = getCountryOptions(sourceSystem, taskOrder);
  return list
    .map((val) => allOpts.find((o) => o.value === val)?.label || val)
    .join(", ");
}
