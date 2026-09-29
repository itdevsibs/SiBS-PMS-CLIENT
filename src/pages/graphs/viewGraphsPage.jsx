import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  ChevronDown,
  Clock,
  Database,
  Filter,
  RefreshCw,
} from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AppHeader from "@/components/layout/AppHeader";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import LoadingModal from "@/components/ui/loading-modal";
import CallKpiDashboard from "@/components/kpi/CallKpiDashboard";
import DatePicker from "@/components/ui/Filter/DatePicker";
import MultiSelectDropdown from "@/components/ui/Filter/MultiSelectDropdown";
import SingleSelectDropdown from "@/components/ui/Filter/SingleSelectDropdown";
import useDashboardPage from "@/hooks/useDashboardPage";
import { getWfmCallKpis, getWfmCallSkills } from "@/lib/axios/wfm-kpis";

const PERIOD_OPTIONS = [
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

const SOURCE_OPTIONS = [
  {
    value: "FUSECOM",
    label: "Fusecom",
  },
  {
    value: "HERODASH",
    label: "HeroDash",
  },
];

const TASK_ORDER_OPTIONS_BY_SOURCE = {
  US_VISA: [
    { value: "", label: "All Task Orders" },
    { value: "TO4", label: "TO4 - PAC" },
    { value: "TO10", label: "TO10 - SEASIA" },
    { value: "TO12", label: "TO12 - NICE" },
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

const GENERIC_SKILL_OPTIONS = [
  { value: "All English", label: "All English", isCategory: true },
  { value: "English NIV", label: "English NIV", isCategory: true },
  { value: "English IV", label: "English IV", isCategory: true },
  { value: "English ACS", label: "English ACS", isCategory: true },
  { value: "Non English", label: "Non English", isCategory: true },
  { value: "Non English IV", label: "Non English IV", isCategory: true },
];

const SKILL_OPTIONS = [
  { value: "", label: "All Skills" },
  ...GENERIC_SKILL_OPTIONS,
];

const SKILLS_BY_COUNTRY = {
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
    "GSS 2.0 :: Bulgaria - English NIV",
  ],
  Cambodia: [
    "GSS 2.0 :: Cambodia - English NIV",
    "GSS 2.0 :: Cambodia - English IV",
    "GSS 2.0 :: Cambodia - Khmer IV",
    "GSS 2.0 :: Cambodia - Khmer NIV",
  ],
  Croatia: [
    "GSS 2.0 :: Croatia - English ACS",
    "GSS 2.0 :: Croatia - English NIV",
  ],
  Cyprus: [
    "GSS 2.0 :: Cyprus - English ACS",
    "GSS 2.0 :: Cyprus - English NIV",
    "GSS 2.0 :: Cyprus - Greek ACS",
    "GSS 2.0 :: Cyprus - Greek NIV",
  ],
  "Czech Republic": [
    "GSS 2.0 :: Czech Republic - English NIV",
    "GSS 2.0 :: Czech Republic - English IV",
    "GSS 2.0 :: Czech Republic - Czech IV",
    "GSS 2.0 :: Czech Republic - Czech NIV",
  ],
  Denmark: [
    "GSS 2.0 :: Denmark - English NIV",
    "GSS 2.0 :: Denmark - English ACS",
    "GSS 2.0 :: Denmark - English IV",
    "GSS 2.0 :: Denmark - Danish ACS",
    "GSS 2.0 :: Denmark - Danish IV",
    "GSS 2.0 :: Denmark - Danish NIV",
  ],
  Egypt: [
    "EGYPT English IV",
    "EGYPT English NIV",
  ],
  Estonia: [
    "GSS 2.0 :: Estonia - English NIV",
    "GSS 2.0 :: Estonia - Estonian NIV",
    "GSS 2.0 :: Estonia - English IV",
    "GSS 2.0 :: Estonia - Russian NIV",
  ],
  Fiji: [
    "GSS 2.0 :: Fiji - English ACS",
    "GSS 2.0 :: Fiji - English IV",
    "GSS 2.0 :: Fiji - English NIV",
  ],
  Finland: [
    "GSS 2.0 :: Finland - English NIV",
    "GSS 2.0 :: Finland - English IV",
    "GSS 2.0 :: Finland - English ACS",
    "GSS 2.0 :: Finland - Finish NIV",
  ],
  Georgia: [
    "GSS 2.0 :: Georgia - English IV",
    "GSS 2.0 :: Georgia - English NIV",
    "GSS 2.0 :: Georgia - Georgian ACS",
    "GSS 2.0 :: Georgia - Georgian IV",
    "GSS 2.0 :: Georgia - Georgian NIV",
    "GSS 2.0 :: Georgia - Russian IV",
    "GSS 2.0 :: Georgia - Russian NIV",
  ],
  Germany: [
    "GSS 2.0 :: Germany - English NIV",
    "GSS 2.0 :: Germany - English ACS",
    "GSS 2.0 :: Germany - English IV",
    "GSS 2.0 :: Germany - German ACS",
    "GSS 2.0 :: Germany - German IV",
    "GSS 2.0 :: Germany - German NIV",
  ],
  Greece: [
    "GSS 2.0 :: Greece - English NIV",
    "GSS 2.0 :: Greece - Greek ACS",
    "GSS 2.0 :: Greece - Greek IV",
    "GSS 2.0 :: Greece - Greek NIV",
  ],
  Hungary: [
    "GSS 2.0 :: Hungary - English NIV",
    "GSS 2.0 :: Hungary - English IV",
    "GSS 2.0 :: Hungary - Hungarian IV",
    "GSS 2.0 :: Hungary - Hungarian NIV",
  ],
  Indonesia: [
    "GSS 2.0 :: Indonesia - English IV",
    "GSS 2.0 :: Indonesia - English NIV",
    "GSS 2.0 :: Indonesia - English ACS",
    "GSS 2.0 :: Indonesia - Indonesian ACS",
    "GSS 2.0 :: Indonesia - Indonesian IV",
    "GSS 2.0 :: Indonesia - Indonesian NIV",
  ],
  Israel: [
    "GSS 2.0 :: Israel - Arabic ACS",
    "GSS 2.0 :: Israel - Arabic IV",
    "GSS 2.0 :: Israel - Arabic NIV",
    "GSS 2.0 :: Israel - English ACS",
    "GSS 2.0 :: Israel - English IV",
    "GSS 2.0 :: Israel - English NIV",
    "GSS 2.0 :: Israel - Hebrew ACS",
    "GSS 2.0 :: Israel - Hebrew IV",
    "GSS 2.0 :: Israel - Hebrew NIV",
  ],
  Japan: [
    "GSS 2.0 :: Japan - English IV",
    "GSS 2.0 :: Japan - English ACS",
    "GSS 2.0 :: Japan - English NIV",
    "GSS 2.0 :: Japan - Japanese NIV",
    "GSS 2.0 :: Japan - Japanese ACS",
    "GSS 2.0 :: Japan - Japanese IV",
  ],
  Jordan: [
    "JORDAN English IV",
    "JORDAN English NIV",
  ],
  Korea: [
    "GSS 2.0 :: Korea - English NIV",
    "GSS 2.0 :: Korea - English ACS",
    "GSS 2.0 :: Korea - English IV",
    "GSS 2.0 :: Korea - Korean ACS",
    "GSS 2.0 :: Korea - Korean IV",
    "GSS 2.0 :: Korea - Korean NIV",
  ],
  Kosovo: [
    "GSS 2.0 :: Kosovo - Albanian IV",
    "GSS 2.0 :: Kosovo - Albanian NIV",
  ],
  Kuwait: [
    "KUWAIT English IV",
    "KUWAIT English NIV",
  ],
  Laos: [
    "GSS 2.0 :: Laos - English ACS",
    "GSS 2.0 :: Laos - English IV",
    "GSS 2.0 :: Laos - English NIV",
    "GSS 2.0 :: Laos - Lao NIV",
  ],
  Latvia: [
    "GSS 2.0 :: Latvia - English NIV",
    "GSS 2.0 :: Latvia - English IV",
    "GSS 2.0 :: Latvia - English ACS",
    "GSS 2.0 :: Latvia - Latvian NIV",
  ],
  Lebanon: [
    "LEBANON English IV",
    "LEBANON English NIV",
  ],
  Lithuania: [
    "GSS 2.0 :: Lithuania - English NIV",
    "GSS 2.0 :: Lithuania - Lithuanian NIV",
  ],
  Malaysia: [
    "GSS 2.0 :: Malaysia - English ACS",
    "GSS 2.0 :: Malaysia - English IV",
    "GSS 2.0 :: Malaysia - English NIV",
    "GSS 2.0 :: Malaysia - Malay NIV",
    "GSS 2.0 :: Malaysia - Mandarin NIV",
  ],
  Moldova: [
    "GSS 2.0 :: Rep. of Moldova - English ACS",
    "GSS 2.0 :: Rep. of Moldova - English NIV",
    "GSS 2.0 :: Rep. of Moldova - Romanian NIV",
    "GSS 2.0 :: Rep. of Moldova - Russian IV",
    "GSS 2.0 :: Rep. of Moldova - Russian NIV",
  ],
  Montenegro: [
    "GSS 2.0 :: Montenegro - English NIV",
    "GSS 2.0 :: Montenegro - Montenegrin NIV",
  ],
  Morocco: [
    "MOROCCO English IV",
    "MOROCCO English NIV",
  ],
  Nepal: [
    "NEPAL English IV",
    "NEPAL English NIV",
  ],
  "New Zealand": [
    "GSS 2.0 :: New Zealand - English IV",
    "GSS 2.0 :: New Zealand - English ACS",
    "GSS 2.0 :: New Zealand - English NIV",
  ],
  "Northern Macedonia": [
    "GSS 2.0 :: Northern Macedonia - Macedonian NIV",
  ],
  Norway: [
    "GSS 2.0 :: Norway - English NIV",
    "GSS 2.0 :: Norway - English ACS",
    "GSS 2.0 :: Norway - Norwegian ACS",
    "GSS 2.0 :: Norway - Norwegian NIV",
  ],
  Oman: [
    "OMAN English IV",
    "OMAN English NIV",
  ],
  Pakistan: [
    "PAKISTAN English IV",
    "PAKISTAN English NIV",
  ],
  Philippines: [
    "GSS 2.0 :: Philippines - English ACS",
    "GSS 2.0 :: Philippines - English IV",
    "GSS 2.0 :: Philippines - English NIV",
    "GSS 2.0 :: Philippines - Tagalog ACS",
    "GSS 2.0 :: Philippines - Tagalog IV",
    "GSS 2.0 :: Philippines - Tagalog NIV",
  ],
  Poland: [
    "GSS 2.0 :: Poland - English ACS",
    "GSS 2.0 :: Poland - English IV",
    "GSS 2.0 :: Poland - English NIV",
    "GSS 2.0 :: Poland - Polish ACS",
    "GSS 2.0 :: Poland - Polish IV",
    "GSS 2.0 :: Poland - Polish NIV",
    "GSS 2.0 :: Poland - Russian ACS",
    "GSS 2.0 :: Poland - Russian IV",
    "GSS 2.0 :: Poland - Russian NIV",
  ],
  Qatar: [
    "QATAR English IV",
    "QATAR English NIV",
  ],
  Romania: [
    "GSS 2.0 :: Romania - English IV",
    "GSS 2.0 :: Romania - English NIV",
    "GSS 2.0 :: Romania - Romanian IV",
    "GSS 2.0 :: Romania - Romanian NIV",
  ],
  "Saudi Arabia": [
    "SAUDI_ARABIA English IV",
    "SAUDI_ARABIA English NIV",
  ],
  Serbia: [
    "GSS 2.0 :: Serbia - English IV",
    "GSS 2.0 :: Serbia - English NIV",
    "GSS 2.0 :: Serbia - Russian NIV",
    "GSS 2.0 :: Serbia - Serbian IV",
    "GSS 2.0 :: Serbia - Serbian NIV",
  ],
  Singapore: [
    "GSS 2.0 :: Singapore - English ACS",
    "GSS 2.0 :: Singapore - English IV",
    "GSS 2.0 :: Singapore - English NIV",
    "GSS 2.0 :: Singapore - Mandarin IV",
    "GSS 2.0 :: Singapore - Mandarin NIV",
  ],
  Slovakia: [
    "GSS 2.0 :: Slovakia - English NIV",
    "GSS 2.0 :: Slovakia  - English ACS",
    "GSS 2.0 :: Slovakia - English IV",
    "GSS 2.0 :: Slovakia - Slovak NIV",
  ],
  "Sri Lanka": [
    "SRI_LANKA English IV",
    "SRI_LANKA English NIV",
  ],
  Sweden: [
    "GSS 2.0 :: Sweden - English NIV",
    "GSS 2.0 :: Sweden - English ACS",
    "GSS 2.0 :: Sweden - English IV",
    "GSS 2.0 :: Sweden - Swedish NIV",
    "GSS 2.0 :: Sweden - Swedish ACS",
    "GSS 2.0 :: Sweden - Swedish IV",
  ],
  Switzerland: [
    "GSS 2.0 :: Switzerland - English NIV",
    "GSS 2.0 :: Switzerland - English IV",
    "GSS 2.0 :: Switzerland - English ACS",
    "GSS 2.0 :: Switzerland - French NIV",
    "GSS 2.0 :: Switzerland - German ACS",
    "GSS 2.0 :: Switzerland - German IV",
    "GSS 2.0 :: Switzerland - German NIV",
  ],
  Taiwan: [
    "GSS 2.0 :: Taiwan - English ACS",
    "GSS 2.0 :: Taiwan - English NIV",
    "GSS 2.0 :: Taiwan - English IV",
    "GSS 2.0 :: Taiwan - Mandarin ACS",
    "GSS 2.0 :: Taiwan - Mandarin IV",
    "GSS 2.0 :: Taiwan - Mandarin NIV",
  ],
  Thailand: [
    "GSS 2.0 :: Thailand - English ACS",
    "GSS 2.0 :: Thailand - English IV",
    "GSS 2.0 :: Thailand - English NIV",
    "GSS 2.0 :: Thailand - Thai IV",
    "GSS 2.0 :: Thailand - Thai NIV",
  ],
  Tunisia: [
    "TUNISIA English IV",
    "TUNISIA English NIV",
  ],
  Turkiye: [
    "GSS 2.0 :: Turkiye - English ACS",
    "GSS 2.0 :: Turkiye - English IV",
    "GSS 2.0 :: Turkiye - English NIV",
    "GSS 2.0 :: Turkiye - Turkish ACS",
    "GSS 2.0 :: Turkiye - Turkish IV",
    "GSS 2.0 :: Turkiye - Turkish NIV",
    "GSS 2.0 :: Turkiye - Farsi IV",
  ],
  Ukraine: [
    "GSS 2.0 :: Ukraine - English IV",
    "GSS 2.0 :: Ukraine - English NIV",
    "GSS 2.0 :: Ukraine - Ukrainian ACS",
    "GSS 2.0 :: Ukraine - Ukrainian IV",
    "GSS 2.0 :: Ukraine - Ukrainian NIV",
  ],
  "United Arab Emirates": [
    "GSS 2.0 :: United Arab Emirates - Arabic ACS",
    "GSS 2.0 :: United Arab Emirates - Arabic NIV",
    "GSS 2.0 :: United Arab Emirates - English ACS",
    "GSS 2.0 :: United Arab Emirates - English IV",
    "GSS 2.0 :: United Arab Emirates - English NIV",
  ],
  Vietnam: [
    "GSS 2.0 :: Vietnam - English IV",
    "GSS 2.0 :: Vietnam - English NIV",
    "GSS 2.0 :: Vietnam - English ACS",
    "GSS 2.0 :: Vietnam - Vietnamese ACS",
    "GSS 2.0 :: Vietnam - Vietnamese IV",
    "GSS 2.0 :: Vietnam - Vietnamese NIV",
  ],
};

const OTHER_COUNTRY_OPTIONS = [
  { value: "albania", label: "Albania" },
  { value: "armenia", label: "Armenia" },
  { value: "azerbaijan", label: "Azerbaijan" },
  { value: "bosnia & herzegovina", label: "Bosnia & Herzegovina" },
  { value: "bulgaria", label: "Bulgaria" },
  { value: "croatia", label: "Croatia" },
  { value: "cyprus", label: "Cyprus" },
  { value: "georgia", label: "Georgia" },
  { value: "greece", label: "Greece" },
  { value: "israel", label: "Israel" },
  { value: "kosovo", label: "Kosovo" },
  { value: "lithuania", label: "Lithuania" },
  { value: "northern macedonia", label: "Northern Macedonia" },
  { value: "poland", label: "Poland" },
  { value: "rep. of moldova", label: "Rep. of Moldova" },
  { value: "romania", label: "Romania" },
  { value: "serbia", label: "Serbia" },
  { value: "turkiye", label: "Turkiye" },
  { value: "ukraine", label: "Ukraine" },
  { value: "united arab emirates", label: "United Arab Emirates" },
];

const COUNTRY_OPTIONS_BY_SOURCE_AND_TO = {
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

const DEFAULT_FILTERS = {
  sourceSystem: [],
  taskOrder: [],
  skill: [],
  country: [],
  period: "weekly",
  referenceDate: "",
  from: "",
  to: "",
};

function getErrorMessage(error) {
  const raw =
    error?.response?.data?.message ||
    error?.message ||
    "";

  if (!raw) {
    return {
      title: "No KPI Data Available",
      message: "No call records were found for the selected filter criteria.",
    };
  }

  const match = raw.match(
    /Reference date must be between (\d{4}-\d{2}-\d{2}) and (\d{4}-\d{2}-\d{2})/i,
  );

  if (match) {
    const [, minDate, maxDate] = match;
    return {
      title: "No Call Records for This Date",
      message: `There is no imported call data for the selected date. Call records are available from ${minDate} to ${maxDate}. Please choose a date within this range or click "Latest".`,
      isDateRangeError: true,
    };
  }

  if (/Reference date must be between/i.test(raw)) {
    return {
      title: "Date Outside Available Range",
      message: "There is no imported call data for the selected date. Please choose an available date or click 'Latest'.",
      isDateRangeError: true,
    };
  }

  if (/Custom reporting requires both/i.test(raw)) {
    return {
      title: "Missing Date Range",
      message: "Custom reporting requires both a 'From' and 'To' date.",
    };
  }

  if (/start date cannot be later/i.test(raw)) {
    return {
      title: "Invalid Date Range",
      message: "The start date cannot be later than the end date.",
    };
  }

  return {
    title: "Unable to Load KPI Data",
    message: raw,
  };
}

function formatGrain(value) {
  const labels = {
    SKILL_DAY: "Daily source",
    SKILL_15_MINUTE: "15-minute source",
    SKILL_30_MINUTE: "30-minute source",
    SKILL_REPORT_SUMMARY: "Report summary source",
  };

  return (
    labels[value] ||
    value ||
    "No available data grain returned by backend"
  );
}

function getSourceLabel(value) {
  if (!value || (Array.isArray(value) && !value.length)) return "US Visa (All Sources)";
  const list = Array.isArray(value)
    ? value.filter((v) => v && v !== "__NONE__")
    : String(value)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  if (
    !list.length ||
    list.includes("US_VISA") ||
    (list.includes("FUSECOM") && list.includes("HERODASH"))
  ) {
    return "US Visa (All Sources)";
  }
  return list
    .map((val) => SOURCE_OPTIONS.find((o) => o.value === val)?.label || val)
    .join(", ");
}

function getTaskOrderOptions(sourceSystem) {
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

function getTaskOrderLabel(sourceSystem, value) {
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

function getSkillsForCountries(countryList = [], skillsMap = SKILLS_BY_COUNTRY) {
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

function getSkillOptions(sourceSystem, selectedCountries, selectedTaskOrders, skillsMap = SKILLS_BY_COUNTRY) {
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

function getSkillLabel(sourceSystem, value, selectedCountries, selectedTaskOrders, skillsMap = SKILLS_BY_COUNTRY) {
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

function getCountryOptions(sourceSystem, taskOrder) {
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

function getCountryLabel(sourceSystem, taskOrder, value) {
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

function buildRequestParams(filters) {
  const params = {
    period: filters.period,
  };

  // 1. Source System
  if (Array.isArray(filters.sourceSystem) && filters.sourceSystem.length > 0) {
    if (!filters.sourceSystem.includes("__NONE__")) {
      params.sourceSystem = filters.sourceSystem.join(",");
    }
  } else if (typeof filters.sourceSystem === "string" && filters.sourceSystem) {
    params.sourceSystem = filters.sourceSystem;
  } else {
    params.sourceSystem = "US_VISA";
  }

  // 2. Task Order
  if (Array.isArray(filters.taskOrder) && filters.taskOrder.length > 0) {
    if (!filters.taskOrder.includes("__NONE__")) {
      params.taskOrder = filters.taskOrder.join(",");
    }
  } else if (typeof filters.taskOrder === "string" && filters.taskOrder) {
    params.taskOrder = filters.taskOrder;
  }

  // 3. Skill
  if (Array.isArray(filters.skill) && filters.skill.length > 0) {
    if (!filters.skill.includes("__NONE__")) {
      params.skill = filters.skill.join(",");
    }
  } else if (typeof filters.skill === "string" && filters.skill) {
    params.skill = filters.skill;
  }

  // 4. Country
  if (Array.isArray(filters.country) && filters.country.length > 0) {
    if (!filters.country.includes("__NONE__")) {
      params.country = filters.country.join(",");
    }
  } else if (typeof filters.country === "string" && filters.country) {
    params.country = filters.country;
  }

  // 5. Period / Date
  if (filters.period === "custom") {
    if (filters.from) {
      params.from = filters.from;
    }

    if (filters.to) {
      params.to = filters.to;
    }

    return params;
  }

  if (filters.referenceDate) {
    params.referenceDate = filters.referenceDate;
  }

  return params;
}

export default function ViewGraphsPage() {
  const dashboard = useDashboardPage();

  const userName =
    dashboard.authUser?.name ||
    dashboard.authUser?.username ||
    "User";

  const canViewGraphs = [
    "admin",
    "bod",
    "som",
    "wfm",
  ].includes(dashboard.authUser?.role) ||
    [7, 6, 10, 9].includes(
      Number(dashboard.authUser?.adminAccess || 0),
    );

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [kpiResponse, setKpiResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [skillsByCountryState, setSkillsByCountryState] = useState(SKILLS_BY_COUNTRY);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getWfmCallSkills()
      .then((res) => {
        if (!isMounted || !res?.data) return;
        const serverMap = res.data;
        setSkillsByCountryState((prev) => {
          const merged = { ...prev };
          for (const [country, skills] of Object.entries(serverMap)) {
            if (!merged[country]) {
              merged[country] = skills;
            } else {
              const current = [...merged[country]];
              for (const s of skills) {
                const key = s.toLowerCase().replace(/[^a-z0-9]/g, "");
                if (!current.some((c) => c.toLowerCase().replace(/[^a-z0-9]/g, "") === key)) {
                  current.push(s);
                }
              }
              merged[country] = current;
            }
          }
          return merged;
        });
      })
      .catch((err) => {
        console.warn("Could not load dynamic source skills:", err?.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const loadKpis = useCallback(async () => {
    if (!canViewGraphs) {
      return;
    }

    if (filters.period === "custom") {
      if (!filters.from || !filters.to) {
        return;
      }

      if (filters.from > filters.to) {
        setError({
          title: "Invalid Date Range",
          message: "The start date cannot be later than the end date.",
        });
        return;
      }
    }

    setIsLoading(true);
    setError("");

    try {
      const params = buildRequestParams(filters);
      const result = await getWfmCallKpis(params);
      setKpiResponse(result);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
      setKpiResponse(null);
    } finally {
      setIsLoading(false);
    }
  }, [canViewGraphs, filters]);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  useEffect(() => {
    const returnedFilters = kpiResponse?.data?.data?.filters || {};
    if (
      returnedFilters.referenceDate &&
      !filters.referenceDate &&
      filters.period !== "custom"
    ) {
      setFilters((current) => ({
        ...current,
        referenceDate: returnedFilters.referenceDate,
      }));
    }
  }, [kpiResponse, filters.referenceDate, filters.period]);

  const handleSourceChange = (newSources) => {
    setFilters((current) => {
      const nextSource = Array.isArray(newSources) ? newSources : [newSources];
      const validTaskOrders = new Set(
        getTaskOrderOptions(nextSource).map((to) => to.value),
      );
      const nextTaskOrder = Array.isArray(current.taskOrder)
        ? current.taskOrder.filter((to) => validTaskOrders.has(to))
        : [];
      const validCountries = new Set(
        getCountryOptions(nextSource, nextTaskOrder).map((c) => c.value),
      );
      const nextCountry = Array.isArray(current.country)
        ? current.country.filter((c) => validCountries.has(c))
        : [];

      const newSkillOptions = getSkillOptions(
        nextSource,
        nextCountry,
        nextTaskOrder,
      );
      const validSkills = new Set(
        newSkillOptions.map((s) => s.value.toLowerCase()),
      );
      const nextSkill = Array.isArray(current.skill)
        ? current.skill.filter((s) => validSkills.has(s.toLowerCase()))
        : [];

      return {
        ...current,
        sourceSystem: newSources,
        taskOrder: nextTaskOrder,
        country: nextCountry,
        skill: nextSkill,
        referenceDate: "",
        from: "",
        to: "",
      };
    });
  };

  const handleTaskOrderChange = (newTaskOrders) => {
    setFilters((current) => {
      const nextTaskOrders = Array.isArray(newTaskOrders)
        ? newTaskOrders
        : [newTaskOrders];
      const newCountryOptions = getCountryOptions(
        current.sourceSystem,
        nextTaskOrders,
      );
      const validCountryValues = new Set(
        newCountryOptions.map((c) => c.value),
      );
      const nextCountry = Array.isArray(current.country)
        ? current.country.filter((c) => validCountryValues.has(c))
        : [];

      const newSkillOptions = getSkillOptions(
        current.sourceSystem,
        nextCountry,
        nextTaskOrders,
        skillsByCountryState,
      );
      const validSkills = new Set(
        newSkillOptions.map((s) => s.value.toLowerCase()),
      );
      const nextSkill = Array.isArray(current.skill)
        ? current.skill.filter((s) => validSkills.has(s.toLowerCase()))
        : [];

      return {
        ...current,
        taskOrder: newTaskOrders,
        country: nextCountry,
        skill: nextSkill,
        referenceDate: "",
        from: "",
        to: "",
      };
    });
  };

  const handleCountryChange = (newCountries) => {
    setFilters((current) => {
      const nextCountries = Array.isArray(newCountries)
        ? newCountries
        : [newCountries];
      const newSkillOptions = getSkillOptions(
        current.sourceSystem,
        nextCountries,
        current.taskOrder,
        skillsByCountryState,
      );
      const validSkills = new Set(
        newSkillOptions.map((s) => s.value.toLowerCase()),
      );
      const nextSkill = Array.isArray(current.skill)
        ? current.skill.filter((s) => validSkills.has(s.toLowerCase()))
        : [];

      return {
        ...current,
        country: newCountries,
        skill: nextSkill,
        referenceDate: "",
        from: "",
        to: "",
      };
    });
  };

  const handleSkillChange = (newSkills) => {
    setFilters((current) => ({
      ...current,
      skill: newSkills,
      referenceDate: "",
      from: "",
      to: "",
    }));
  };

  const handlePeriodChange = (eventOrValue) => {
    const nextPeriod =
      typeof eventOrValue === "object" && eventOrValue?.target
        ? eventOrValue.target.value
        : eventOrValue;

    setFilters((current) => ({
      ...current,
      period: nextPeriod,
      referenceDate: "",
      from: "",
      to: "",
    }));
  };

  const handleReferenceDateChange = (referenceDate) => {
    setFilters((current) => ({
      ...current,
      referenceDate: referenceDate || "",
    }));
  };

  const handleLatestRange = () => {
    if (filters.period === "custom") {
      return;
    }

    setFilters((current) => ({
      ...current,
      referenceDate: "",
      from: "",
      to: "",
    }));
  };

  const dashboardData =
    kpiResponse?.data?.data || {};

  const availableGrains =
    Array.isArray(dashboardData.availableGrains)
      ? dashboardData.availableGrains
      : [];

  const series =
    Array.isArray(dashboardData.series)
      ? dashboardData.series
      : [];

  const activeSourceSystem =
    dashboardData.filters?.sourceSystem ||
    filters.sourceSystem;

  const taskOrderOptions = getTaskOrderOptions(
    filters.sourceSystem,
  );

  const countryOptions = getCountryOptions(
    filters.sourceSystem,
    filters.taskOrder,
  );

  const skillOptions = getSkillOptions(
    filters.sourceSystem,
    filters.country,
    filters.taskOrder,
    skillsByCountryState,
  );

  const activeTaskOrder =
    dashboardData.filters?.taskOrder ||
    filters.taskOrder;

  const emptyDataMessage =
    !availableGrains.length
      ? `No validated ${getSourceLabel(
          activeSourceSystem,
        )} KPI data is available.`
      : !series.length
        ? "No KPI data is available for the selected reporting range."
        : "";

  const isCustomPeriod =
    filters.period === "custom";

  return (
    <section className="font-jakarta flex h-screen max-h-[100dvh] min-h-screen bg-[#eef3f7] text-sibs-primary-1 overflow-hidden">
      <AdminSidebar
        isMobileOpen={dashboard.isMobileSidebarOpen}
        modules={dashboard.modules}
        onLogoutClick={() =>
          dashboard.setShowLogoutModal(true)
        }
        onMobileClose={() =>
          dashboard.setIsMobileSidebarOpen(false)
        }
        userName={userName}
        userRole={
          dashboard.authUser?.email ||
          dashboard.authUser?.roleLabel ||
          "User"
        }
      />

      <main className="min-w-0 flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader
          title={
            dashboard.authUser?.roleLabel || "User"
          }
          subtitle="Performance Management System"
          onMenuClick={() =>
            dashboard.setIsMobileSidebarOpen(true)
          }
          onLogoutClick={() =>
            dashboard.setShowLogoutModal(true)
          }
        />

        <div className="sibs-scrollbar flex-1 overflow-y-auto p-3 sm:p-3.5 pb-16 sm:pb-8">
          {!canViewGraphs ? (
            <div className="sibs-card p-6 text-center">
              <AlertCircle
                className="mx-auto mb-3 text-amber-500"
                size={34}
              />

              <h2 className="m-0 text-lg font-bold text-sibs-primary-1">
                Graph access required
              </h2>

              <p className="mt-2 mb-0 text-sm text-sibs-tertiary-5">
                Calls KPI reporting is available for
                WFM, BOD, Admin, and SOM dashboards.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <section className="sibs-card relative z-40 overflow-visible shadow-xs">
                <div
                  onClick={() => setShowFilters((prev) => !prev)}
                  className={`flex cursor-pointer select-none items-center justify-between bg-sibs-primary-3/30 px-3.5 py-1.5 transition-colors hover:bg-sibs-primary-3/50 ${
                    showFilters ? "border-b border-sibs-tertiary-10" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BarChart3
                      size={16}
                      className="text-sibs-primary-1"
                    />

                    <h1 className="m-0 text-sm font-extrabold text-sibs-primary-1">
                      Calls KPI Performance
                    </h1>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFilters((prev) => !prev);
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold text-sibs-primary-1 hover:bg-sibs-primary-1/10 transition-colors"
                    title={showFilters ? "Hide filters and KPI cards to conserve space" : "Show filters and KPI cards"}
                  >
                    <Filter size={12} className="shrink-0" />
                    <span>{showFilters ? "Hide Filters & KPIs" : "Show Filters & KPIs"}</span>
                    <ChevronDown
                      size={14}
                      className={`shrink-0 transition-transform duration-200 ${
                        showFilters ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                {showFilters && (
                  <div className="grid grid-cols-1 gap-2 p-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 xl:items-end">
                  {/* 1. Account / Source */}
                  <MultiSelectDropdown
                    label="Account / Source"
                    value={filters.sourceSystem}
                    onChange={handleSourceChange}
                    options={SOURCE_OPTIONS}
                    placeholder="All Sources"
                    allOptionLabel="US Visa (All Sources)"
                  />

                  {/* 2. Task Order */}
                  <MultiSelectDropdown
                    label="Task Order"
                    value={filters.taskOrder}
                    onChange={handleTaskOrderChange}
                    options={taskOrderOptions}
                    placeholder="All Task Orders"
                    allOptionLabel="All Task Orders"
                  />

                  {/* 3. Country */}
                  <MultiSelectDropdown
                    label="Country"
                    value={filters.country}
                    onChange={handleCountryChange}
                    options={countryOptions}
                    placeholder="All Countries"
                    allOptionLabel="All Countries"
                  />

                  {/* 4. Skill */}
                  <MultiSelectDropdown
                    label="Skill"
                    value={filters.skill}
                    onChange={handleSkillChange}
                    options={skillOptions}
                    placeholder="All Skills"
                    allOptionLabel="All Skills"
                  />

                  {/* 5. Reporting Period */}
                  <SingleSelectDropdown
                    label="Reporting Period"
                    value={filters.period}
                    onChange={handlePeriodChange}
                    options={PERIOD_OPTIONS}
                    placeholder="Weekly"
                  />

                  {/* 6. Reference Date (or From + To) */}
                  {isCustomPeriod ? (
                    <>
                      <DatePicker
                        label="From"
                        value={filters.from}
                        onChange={(from) =>
                          setFilters((current) => ({
                            ...current,
                            from: from || "",
                          }))
                        }
                      />

                      <DatePicker
                        label="To"
                        value={filters.to}
                        onChange={(to) =>
                          setFilters((current) => ({
                            ...current,
                            to: to || "",
                          }))
                        }
                      />
                    </>
                  ) : (
                    <>
                      <DatePicker
                        label="Reference Date"
                        value={filters.referenceDate}
                        onChange={handleReferenceDateChange}
                      />

                      {/* 7. Latest button */}
                      <div>
                        <button
                          type="button"
                          onClick={handleLatestRange}
                          disabled={isLoading}
                          title="Use the latest available KPI date."
                          className="inline-flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-sibs-primary-1 shadow-xs transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Clock size={12} className="shrink-0" />
                          <span>Latest</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
                )}
              </section>

              {error ? (
                <div className="sibs-card relative z-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-red-200 bg-red-50/60 p-3 text-xs text-red-800 shadow-xs">
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      size={20}
                      className="mt-0.5 shrink-0 text-red-600"
                    />

                    <div>
                      <p className="m-0 font-bold text-red-900">
                        {typeof error === "object" ? error.title : "No Call Records for This Date"}
                      </p>

                      <p className="mt-1 mb-0 text-xs sm:text-sm text-red-700">
                        {typeof error === "object" ? error.message : error}
                      </p>
                    </div>
                  </div>

                  {typeof error === "object" && error.isDateRangeError ? (
                    <button
                      type="button"
                      onClick={handleLatestRange}
                      className="inline-flex shrink-0 items-center justify-center rounded-lg border border-red-300 bg-white px-3.5 py-1.5 text-xs font-extrabold text-red-700 shadow-sm transition hover:bg-red-50"
                    >
                      Use Latest Available Date
                    </button>
                  ) : null}
                </div>
              ) : null}

              {isLoading ? (
                <div className="sibs-card relative z-0 flex min-h-72 flex-col items-center justify-center gap-3 p-6 text-center">
                  <RefreshCw
                    size={30}
                    className="animate-spin text-sibs-primary-1"
                  />

                  <div>
                    <p className="m-0 font-bold text-sibs-primary-1">
                      Loading Calls KPI data
                    </p>

                    <p className="mt-1 mb-0 text-sm text-sibs-tertiary-5">
                      Aggregating validated records from
                      the PMS database.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative z-0">
                  {emptyDataMessage && !error ? (
                    <div className="sibs-card mb-4 p-4 text-sm font-semibold text-sibs-tertiary-5">
                      {emptyDataMessage}
                    </div>
                  ) : null}

                  <CallKpiDashboard
                    data={dashboardData || {}}
                    showSummaryCards={showFilters}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <ConfirmationModal
        isOpen={dashboard.showLogoutModal}
        title="Confirm logout"
        message="Are you sure you want to logout?"
        cancelText="Cancel"
        confirmText="Logout"
        onCancel={() =>
          dashboard.setShowLogoutModal(false)
        }
        onConfirm={dashboard.handleLogout}
        tone="neutral"
      />

      <LoadingModal
        isOpen={dashboard.isLoggingOut}
        title="Logging out"
        message="Please wait while we end your session."
      />
    </section>
  );
}
