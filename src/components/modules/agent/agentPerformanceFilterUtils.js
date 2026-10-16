export const DEFAULT_AGENT_PERFORMANCE_FILTERS = Object.freeze({
  period: "weekly",
  referenceDate: new Date().toISOString().slice(0, 10),
  from: "",
  to: "",
  skill: [],
  country: [],
});

function text(value) {
  return String(value || "").trim();
}

function sortText(left, right) {
  return left.localeCompare(right);
}

export function buildAgentPerformanceParams(filters = {}) {
  const params = {
    period: filters.period || DEFAULT_AGENT_PERFORMANCE_FILTERS.period,
  };
  let skill = "";
  if (Array.isArray(filters.skill) && filters.skill.length > 0) {
    if (!filters.skill.includes("__NONE__")) {
      skill = filters.skill.filter(Boolean).map(text).join(",");
    }
  } else if (typeof filters.skill === "string" && filters.skill && filters.skill !== "__NONE__") {
    skill = text(filters.skill);
  }

  let country = "";
  if (Array.isArray(filters.country) && filters.country.length > 0) {
    if (!filters.country.includes("__NONE__")) {
      country = filters.country.filter(Boolean).map(text).join(",");
    }
  } else if (typeof filters.country === "string" && filters.country && filters.country !== "__NONE__") {
    country = text(filters.country);
  }

  if (skill) params.skill = skill;
  if (country) params.country = country;

  if (params.period === "custom") {
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    return params;
  }

  if (filters.referenceDate) {
    params.referenceDate = filters.referenceDate;
  }

  return params;
}

export function getAgentCountryOptions(availableFilters = {}) {
  const countryValues = (availableFilters.countries || []).length
    ? availableFilters.countries
    : (availableFilters.skillCountryPairs || []).map((pair) => pair?.country);
  const countries = [...new Set(
    countryValues
      .map(text)
      .filter(Boolean),
  )].sort(sortText);

  return countries.map((country) => ({ value: country, label: country }));
}

export function getAgentSkillOptions(availableFilters = {}, country = "") {
  const countryList = (Array.isArray(country) ? country : String(country || "").split(","))
    .map((c) => text(c).toLowerCase())
    .filter(Boolean);
  const pairs = availableFilters.skillCountryPairs || [];
  const sourceSkills = countryList.length
    ? pairs
      .filter((pair) => countryList.includes(text(pair?.country).toLowerCase()))
      .map((pair) => text(pair?.skillName))
    : (availableFilters.skills || []).map(text);
  const skills = [...new Set(sourceSkills.filter(Boolean))].sort(sortText);

  return skills.map((skill) => ({ value: skill, label: skill }));
}

export function isAgentSkillAvailableForCountry(
  availableFilters = {},
  skill = "",
  country = "",
) {
  const selectedSkill = text(skill);
  const countryList = (Array.isArray(country) ? country : String(country || "").split(","))
    .map((c) => text(c).toLowerCase())
    .filter(Boolean);

  if (!selectedSkill || !countryList.length) return true;

  return (availableFilters.skillCountryPairs || []).some(
    (pair) =>
      text(pair?.skillName) === selectedSkill &&
      countryList.includes(text(pair?.country).toLowerCase()),
  );
}
