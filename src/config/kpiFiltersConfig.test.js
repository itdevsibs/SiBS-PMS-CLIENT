import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSkillOptions,
  shouldShowPhilippinesQuickCategory,
} from './kpiFiltersConfig.js';

const CATEGORY = '__SEASIA_PHILIPPINES__';
const skillsByCountry = {
  Philippines: ['PHILIPPINES English NIV', 'PHILIPPINES Tagalog NIV'],
  Cambodia: ['CAMBODIA English NIV'],
  Australia: ['Australia English NIV'],
};
const scopes = {
  TO10: ['Philippines', 'Cambodia'],
  TO4: ['Australia'],
};

function categoryFor(taskOrderSelection, countrySelection = []) {
  // The WoW page expands default All to currently available ledger scopes to
  // populate individual skills, but uses the *unexpanded* Task Order filter to
  // determine quick-category availability.
  const scopedTaskOrders = taskOrderSelection.length
    ? taskOrderSelection
    : Object.keys(scopes);
  return getSkillOptions([], countrySelection, scopedTaskOrders,
    skillsByCountry, scopes,
    shouldShowPhilippinesQuickCategory(taskOrderSelection));
}

function categoryExists(options) {
  return options.some((option) => option.value === CATEGORY && option.isCategory);
}

test('Philippines quick category appears for default All and explicit All', () => {
  assert.equal(categoryExists(categoryFor([])), true);
  assert.equal(categoryExists(categoryFor(['TO4', 'TO10'])), true);
});

test('Philippines quick category appears for SEASIA alone or combined with other Task Orders', () => {
  assert.equal(categoryExists(categoryFor(['TO10'])), true);
  assert.equal(categoryExists(categoryFor(['TO10', 'TO4'])), true);
});

test('Philippines quick category is hidden when SEASIA and All are not selected', () => {
  assert.equal(categoryExists(categoryFor(['TO4'])), false);
  assert.equal(categoryExists(categoryFor(['TO4', 'TO12'])), false);
});

test('country selection does not hide the category while All or SEASIA is selected', () => {
  assert.equal(categoryExists(categoryFor([], ['Australia'])), true);
  assert.equal(categoryExists(categoryFor(['TO10'], ['Cambodia'])), true);
});

test('Task Order matching supports scalar and case-insensitive selections', () => {
  assert.equal(shouldShowPhilippinesQuickCategory('to10'), true);
  assert.equal(shouldShowPhilippinesQuickCategory('TO4, to10'), true);
  assert.equal(shouldShowPhilippinesQuickCategory('TO4'), false);
  assert.equal(shouldShowPhilippinesQuickCategory('__NONE__'), true);
});

test('other report callers do not receive the category without opting in', () => {
  assert.equal(categoryExists(getSkillOptions([], [], ['TO10'], skillsByCountry, scopes)), false);
});

test('individual Philippines language skills remain selectable with the quick category', () => {
  const options = categoryFor([]);
  assert.equal(categoryExists(options), true);
  assert.deepEqual(
    options.find((option) => option.value === 'PHILIPPINES Tagalog NIV').countries,
    ['philippines'],
  );
});
