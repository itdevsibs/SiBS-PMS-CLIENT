import assert from "node:assert/strict";
import test from "node:test";

import {
  getRawDataCardByImportProfileCode,
  getRawDataCards,
} from "../src/lib/wfm-raw-data-cards.js";

test("US Visa upload cards include existing Skill Statistics profiles", () => {
  const cards = getRawDataCards("US VISA");

  assert.equal(
    cards.some(
      (card) => card.importProfileCode === "FUSECOM_SKILL_STATISTICS_INBOUND",
    ),
    true,
  );
  assert.equal(
    cards.some(
      (card) => card.importProfileCode === "HERO_SKILL_STATISTICS_INBOUND",
    ),
    true,
  );
});

test("US Visa upload cards include Agent Level profiles", () => {
  const cards = getRawDataCards("US VISA");

  assert.equal(
    cards.some((card) => card.importProfileCode === "FUSECOM_AGENT_LEVEL"),
    true,
  );
  assert.equal(
    cards.some((card) => card.importProfileCode === "FUSENET_AGENT_LEVEL"),
    true,
  );
  assert.equal(
    cards.some((card) => card.importProfileCode === "HERODASH_AGENT_LEVEL"),
    true,
  );
});

test("history mapping can resolve each Agent Level card by import profile code", () => {
  assert.equal(
    getRawDataCardByImportProfileCode("FUSECOM_AGENT_LEVEL")?.title,
    "Fusecom Agent Level",
  );
  assert.equal(
    getRawDataCardByImportProfileCode("FUSENET_AGENT_LEVEL")?.title,
    "FuseNet Agent Level",
  );
  assert.equal(
    getRawDataCardByImportProfileCode("HERODASH_AGENT_LEVEL")?.title,
    "HeroDash Agent Level",
  );
});

test("Fusecom Skill and Agent profiles resolve to different cards", () => {
  const skillCard = getRawDataCardByImportProfileCode(
    "FUSECOM_SKILL_STATISTICS_INBOUND",
  );
  const agentCard = getRawDataCardByImportProfileCode("FUSECOM_AGENT_LEVEL");

  assert.notEqual(skillCard.id, agentCard.id);
  assert.equal(skillCard.sourceLabel, "Fusecom");
  assert.equal(agentCard.sourceLabel, "Fusecom");
  assert.equal(skillCard.groupLabel, "SERVICE / QUEUE LEVEL");
  assert.equal(agentCard.groupLabel, "AGENT LEVEL");
});
