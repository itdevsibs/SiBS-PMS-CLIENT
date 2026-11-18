// Pure skill-selection utilities for the Calls Performance quick category UI.
// The selected filter remains an array of existing backend-supported category
// tokens and/or individual skill names; no API or KPI contract is changed.
export function matchesSkillCategory(skillName, category, countries = []) {
  const s = String(skillName || "");
  const isEnglish = /\benglish\b/i.test(s) && !/\bnon[\s_-]*english\b/i.test(s);
  const hasNiv = /niv/i.test(s);
  const hasIv = /(^|[^a-zA-Z])IV($|[^a-zA-Z])/i.test(s) && !hasNiv;
  const hasAcs = /acs/i.test(s);

  const cat = String(category || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  if (cat === "seasiaphilippines") {
    return (countries || []).some((country) => String(country).toLowerCase() === "philippines");
  }
  if (cat === "allenglish" || cat === "englishall" || cat === "english") {
    return isEnglish;
  }
  if (cat === "englishniv") return isEnglish && hasNiv;
  if (cat === "englishiv") return isEnglish && hasIv;
  if (cat === "englishacs") return isEnglish && hasAcs;
  if (cat === "nonenglish") return !isEnglish;
  if (cat === "nonenglishiv") return !isEnglish && hasIv;
  return false;
}

function itemsInCategory(categoryValue, items) {
  return items.filter((item) => matchesSkillCategory(item.value, categoryValue, item.countries));
}

// Expand explicitly chosen categories into their individual eligible skills.
// This is the single source of truth for what the user actually selected.
export function expandSkillSelection(selection = [], items = [], categories = []) {
  const selected = new Set(selection);
  const categoryValues = new Set(categories.map((cat) => cat.value));
  const result = new Set();

  for (const item of items) {
    if (selected.has(item.value)) result.add(item.value);
  }
  for (const category of categories) {
    if (!selected.has(category.value) || !categoryValues.has(category.value)) continue;
    for (const item of itemsInCategory(category.value, items)) result.add(item.value);
  }
  return result;
}

// Checked state is derived from all eligible matching individual skills, not
// whether the user explicitly clicked a parent or child category token.
export function getCheckedSkillCategories(selectedSkills, items = [], categories = []) {
  return categories
    .filter((cat) => {
      const matching = itemsInCategory(cat.value, items);
      return matching.length > 0 && matching.every((item) => selectedSkills.has(item.value));
    })
    .map((cat) => cat.value);
}

// Compress complete groups into the backend's already-supported category
// tokens. This avoids URLs with hundreds of skills while guaranteeing that a
// partially deselected group is never sent as a broad category filter.
export function compactSkillSelection(selectedSkills, items = [], categories = []) {
  const selected = new Set(selectedSkills);
  const remaining = new Set(selected);
  const result = [];

  for (const category of categories) {
    const matching = itemsInCategory(category.value, items);
    if (matching.length === 0 || !matching.every((item) => selected.has(item.value))) continue;
    if (!matching.some((item) => remaining.has(item.value))) continue;
    result.push(category.value);
    for (const item of matching) remaining.delete(item.value);
  }

  for (const item of items) {
    if (remaining.delete(item.value)) result.push(item.value);
  }
  return result;
}

export function toggleSkillCategory(selection, categoryValue, items = [], categories = []) {
  const selected = expandSkillSelection(selection, items, categories);
  const matching = itemsInCategory(categoryValue, items);
  if (!matching.length) return compactSkillSelection(selected, items, categories);

  const isChecked = matching.every((item) => selected.has(item.value));
  for (const item of matching) {
    if (isChecked) selected.delete(item.value);
    else selected.add(item.value);
  }
  return compactSkillSelection(selected, items, categories);
}

export function toggleIndividualSkill(selection, skillValue, items = [], categories = []) {
  const selected = expandSkillSelection(selection, items, categories);
  if (selected.has(skillValue)) selected.delete(skillValue);
  else if (items.some((item) => item.value === skillValue)) selected.add(skillValue);
  return compactSkillSelection(selected, items, categories);
}

export function toggleAllSkillItems(selection, items = [], categories = []) {
  const selected = expandSkillSelection(selection, items, categories);
  const fullySelected = items.length > 0 && items.every((item) => selected.has(item.value));
  return fullySelected
    ? []
    : compactSkillSelection(new Set(items.map((item) => item.value)), items, categories);
}
