import test from 'node:test';
import assert from 'node:assert/strict';
import {
  matchesSkillCategory,
  expandSkillSelection,
  getCheckedSkillCategories,
  toggleSkillCategory,
  toggleIndividualSkill,
  toggleAllSkillItems,
} from './skillCategorySelection.js';

const categories = [
  'All English', 'English NIV', 'English IV', 'English ACS',
  'Non English', 'Non English IV', '__SEASIA_PHILIPPINES__',
].map((value) => ({ value, label: value, isCategory: true }));
const items = [
  { value: 'Australia-CALL English ACS' },
  { value: 'Australia-CALL English IV' },
  { value: 'Australia-CALL English NIV' },
  { value: 'Cambodia-English NIV' },
  { value: 'GSS 2.0 :: Albania - Albanian NIV' },
  { value: 'GSS 2.0 :: Austria - German IV' },
  { value: 'Philippines English IV', countries: ['philippines'] },
  { value: 'Philippines Tagalog NIV', countries: ['philippines'] },
];
const albanian = 'GSS 2.0 :: Albania - Albanian NIV';
const effective = (selection) => expandSkillSelection(selection, items, categories);
const checked = (selection) => getCheckedSkillCategories(effective(selection), items, categories);

// Selecting any category must not shrink the list of items available to add.
test('All English checks all three subcategories while keeping non-English skills available', () => {
  const selected = toggleSkillCategory([], 'All English', items, categories);
  assert.ok(selected.includes('All English'));
  assert.deepEqual(checked(selected).filter((value) => ['All English', 'English NIV', 'English IV', 'English ACS'].includes(value)),
    ['All English', 'English NIV', 'English IV', 'English ACS']);
  assert.equal(effective(selected).size, 5);
  assert.equal(effective(selected).has(albanian), false);
  assert.equal(items.length, 8); // Category selection has not filtered options.
});

test('All English and individual Albanian NIV coexist without marking the entire Non English group', () => {
  const english = toggleSkillCategory([], 'All English', items, categories);
  const mixed = toggleIndividualSkill(english, albanian, items, categories);
  assert.deepEqual(mixed, ['All English', albanian]);
  assert.equal(effective(mixed).size, 6);
  assert.equal(checked(mixed).includes('All English'), true);
  assert.equal(checked(mixed).includes('Non English'), false);
  assert.equal(checked(mixed).includes('English NIV'), true);
});

test('Unchecking All English clears English but preserves manually checked Albanian NIV', () => {
  const english = toggleSkillCategory([], 'All English', items, categories);
  const mixed = toggleIndividualSkill(english, albanian, items, categories);
  const remainder = toggleSkillCategory(mixed, 'All English', items, categories);
  assert.deepEqual(remainder, [albanian]);
  assert.deepEqual([...effective(remainder)], [albanian]);
  assert.deepEqual(checked(remainder), []);
});

test('Unchecking one English IV removes parent and IV group tokens while preserving other English skills', () => {
  let selection = toggleSkillCategory([], 'All English', items, categories);
  selection = toggleIndividualSkill(selection, 'Australia-CALL English IV', items, categories);
  assert.equal(selection.includes('All English'), false);
  assert.equal(selection.includes('English IV'), false);
  assert.equal(checked(selection).includes('All English'), false);
  assert.equal(checked(selection).includes('English IV'), false);
  assert.equal(checked(selection).includes('English NIV'), true);
  assert.equal(checked(selection).includes('English ACS'), true);
  assert.equal(effective(selection).has('Philippines English IV'), true);
  assert.equal(effective(selection).has('Australia-CALL English IV'), false);
});

test('Clicking a checked English NIV child unchecks that group and parent but preserves IV / ACS', () => {
  let selection = toggleSkillCategory([], 'All English', items, categories);
  selection = toggleSkillCategory(selection, 'English NIV', items, categories);
  assert.equal(checked(selection).includes('English NIV'), false);
  assert.equal(checked(selection).includes('All English'), false);
  assert.equal(checked(selection).includes('English IV'), true);
  assert.equal(checked(selection).includes('English ACS'), true);
  assert.ok(!selection.includes('All English')); // Do not send a broad English filter to the KPI API.
});

test('Philippines (All Languages) can be combined with English without excluding Tagalog', () => {
  let selection = toggleSkillCategory([], 'All English', items, categories);
  selection = toggleSkillCategory(selection, '__SEASIA_PHILIPPINES__', items, categories);
  assert.equal(effective(selection).has('Philippines Tagalog NIV'), true);
  assert.equal(effective(selection).has('Philippines English IV'), true);
  assert.equal(checked(selection).includes('All English'), true);
  assert.equal(checked(selection).includes('__SEASIA_PHILIPPINES__'), true);
  assert.equal(effective(selection).size, 6);
});

test('All Skills toggles every eligible individual, with a unique count and compact backend tokens', () => {
  const selected = toggleAllSkillItems([], items, categories);
  assert.equal(effective(selected).size, items.length);
  assert.ok(selected.length < items.length);
  assert.deepEqual(toggleAllSkillItems(selected, items, categories), []);
});

test('Manually completing a subgroup checks the subgroup, and completing all English checks the parent', () => {
  let selected = [];
  for (const item of items.filter((value) => matchesSkillCategory(value.value, 'English NIV'))) {
    selected = toggleIndividualSkill(selected, item.value, items, categories);
  }
  assert.equal(checked(selected).includes('English NIV'), true);
  assert.equal(checked(selected).includes('All English'), false);
  for (const item of items.filter((value) => matchesSkillCategory(value.value, 'All English') && !matchesSkillCategory(value.value, 'English NIV'))) {
    selected = toggleIndividualSkill(selected, item.value, items, categories);
  }
  assert.ok(selected.includes('All English'));
  assert.equal(checked(selected).includes('English IV'), true);
  assert.equal(checked(selected).includes('English ACS'), true);
});

test('Non-English includes Albanian but excludes English and supports IV subgroup', () => {
  let selected = toggleSkillCategory([], 'Non English', items, categories);
  assert.equal(effective(selected).has(albanian), true);
  assert.equal(effective(selected).has('Australia-CALL English NIV'), false);
  assert.equal(checked(selected).includes('Non English IV'), true);
  selected = toggleIndividualSkill(selected, 'GSS 2.0 :: Austria - German IV', items, categories);
  assert.ok(!selectionHasBroadNonEnglish(selected));
  assert.equal(checked(selected).includes('Non English IV'), false);
});

function selectionHasBroadNonEnglish(selection) {
  return selection.includes('Non English') || selection.includes('Non English IV');
}

test('Duplicate category names and manually added skills are counted only once', () => {
  const legacy = ['All English', 'English NIV', 'Australia-CALL English NIV'];
  assert.equal(effective(legacy).size, 5);
});

test('Zero-member categories do not appear checked or accidentally select skills', () => {
  const reduced = items.filter((item) => !matchesSkillCategory(item.value, 'English ACS'));
  const selection = toggleSkillCategory([], 'English ACS', reduced, categories);
  assert.deepEqual(selection, []);
  assert.equal(getCheckedSkillCategories(new Set(), reduced, categories).includes('English ACS'), false);
});
