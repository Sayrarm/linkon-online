import { KEYS, get, set } from "@localstorage";
import { compData, memoriesData } from "@data";

// ===== РЕЗОЛВЕРЫ =====
const findCompanionByName = (name) => {
  if (!name) return null;
  return compData.find((c) => c.companionName === name) || null;
};

const findWeaponByName = (name) => {
  if (!name) return null;
  return compData.find((w) => w.weaponName === name) || null;
};

const findCardById = (id) => {
  if (id == null) return null;
  return memoriesData.find((c) => c.id === id) || null;
};

// ===== ДЕФОЛТНЫЕ ДАННЫЕ TEAM OPTIMIZER =====
const getDefaultTeamOptimizerData = () => ({
    selectedCompanion: null,
    selectedWeapon: null,
    betaProtocore_1: null,
    betaProtocore_2: null,
    deltaProtocore_1: null,
    deltaProtocore_2: null,
    mainStat: null,
    subStat: null,
    excludedCards: [],
    cards: {
        solar1: null,
        solar2: null,
        lunar1: null,
        lunar2: null,
        lunar3: null,
        lunar4: null,
    },
});

// ===== ДЕФОЛТНЫЕ ДАННЫЕ MEMORY OPTIMIZER =====
const getDefaultMemoryOptimizerData = () => ({
    selectedCard: null,
    mainStat: null,
    subStat: null,
    betaProtocore: null,
    deltaProtocore: null,
    excludedCards: [],
});

// =========================================================
// TEAM OPTIMIZER
// =========================================================

export const getOptimizerData = () => {
  const defaults = getDefaultTeamOptimizerData();
  const stored = get(KEYS.OPTIMIZER, null);

  if (!stored || typeof stored !== "object") {
    return defaults;
  }

  const migrated = { ...stored };

  // Миграция: старое поле deltaProtocore → deltaProtocore_1
  if (migrated.deltaProtocore !== undefined) {
    if (migrated.deltaProtocore_1 === undefined) {
      migrated.deltaProtocore_1 = migrated.deltaProtocore;
    }
    delete migrated.deltaProtocore;
  }

  // Миграция companion/weapon: объект → имя
  let companionName = migrated.selectedCompanion;
  if (companionName && typeof companionName === "object") {
    companionName = companionName.companionName || null;
  }
  let weaponName = migrated.selectedWeapon;
  if (weaponName && typeof weaponName === "object") {
    weaponName = weaponName.weaponName || null;
  }

  // Миграция cards: объекты → id
  const storedCards = migrated.cards || {};
  const cardsFromIds = {};
  for (const slot of [
    "solar1",
    "solar2",
    "lunar1",
    "lunar2",
    "lunar3",
    "lunar4",
  ]) {
    const v = storedCards[slot];
    if (v == null) {
      cardsFromIds[slot] = null;
    } else if (typeof v === "object") {
      // старый формат: полный объект — берём id и резолвим из memoriesData,
      // чтобы данные были актуальными
      cardsFromIds[slot] = findCardById(v.id);
    } else {
      // новый формат: id
      cardsFromIds[slot] = findCardById(v);
    }
  }

  return {
    ...defaults,
    ...migrated,
    selectedCompanion: findCompanionByName(companionName),
    selectedWeapon: findWeaponByName(weaponName),
    cards: {
      ...defaults.cards,
      ...cardsFromIds,
    },
    excludedCards: Array.isArray(migrated.excludedCards)
      ? migrated.excludedCards
      : [],
  };
};

export const saveOptimizerData = (data) => {
  const cardsToSave = {};
  for (const slot of [
    "solar1",
    "solar2",
    "lunar1",
    "lunar2",
    "lunar3",
    "lunar4",
  ]) {
    const card = data.cards?.[slot];
    cardsToSave[slot] = card?.id ?? null;
  }

  const toSave = {
    ...data,
    selectedCompanion: data.selectedCompanion?.companionName ?? null,
    selectedWeapon: data.selectedWeapon?.weaponName ?? null,
    cards: cardsToSave,
  };

  return set(KEYS.OPTIMIZER, toSave);
};

// ===== ОЧИСТКА ДАННЫХ ОПТИМИЗАТОРА =====
export const clearOptimizerData = () => {
    return set(KEYS.OPTIMIZER, getDefaultTeamOptimizerData());
};

// =========================================================
// MEMORY OPTIMIZER
// =========================================================

export const getMemoryOptimizerData = () => {
  const defaults = getDefaultMemoryOptimizerData();
  const stored = get(KEYS.MEMORY_OPTIMIZER, null);

  if (!stored || typeof stored !== "object") {
    return defaults;
  }

  const migrated = { ...stored };

  // Миграция selectedCard: объект → id → полный объект из memoriesData
  let selectedCard = null;
  const raw = migrated.selectedCard;
  if (raw != null) {
    const id = typeof raw === "object" ? raw.id : raw;
    selectedCard = findCardById(id);
  }

  return {
    ...defaults,
    ...migrated,
    selectedCard,
    excludedCards: Array.isArray(migrated.excludedCards)
      ? migrated.excludedCards
      : [],
  };
};

export const saveMemoryOptimizerData = (data) => {
  const toSave = {
    ...data,
    selectedCard: data.selectedCard?.id ?? null,
  };
  return set(KEYS.MEMORY_OPTIMIZER, toSave);
};

export const clearMemoryOptimizerData = () => {
    return set(KEYS.MEMORY_OPTIMIZER, getDefaultMemoryOptimizerData());
};

export const loadTeamIntoOptimizer = (team) => {
  const current = getOptimizerData();

  const next = {
    ...current,
    cards: {
      solar1: team.solarCards?.[0] || null,
      solar2: team.solarCards?.[1] || null,
      lunar1: team.lunarCards?.[0] || null,
      lunar2: team.lunarCards?.[1] || null,
      lunar3: team.lunarCards?.[2] || null,
      lunar4: team.lunarCards?.[3] || null,
    },
    selectedCompanion: team.selectedCompanion || null,
    selectedWeapon: team.selectedMCWeapon || null,
  };

  saveOptimizerData(next); // ← saveOptimizerData сам сериализует
  return next;
};