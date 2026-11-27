import {
  compDataShowcaseSpecific,
  weaponDataShowcaseSpecific,
  compData,
  calculateAllDamageTypes,
  createDamageCalculator,
} from "@data";

/**
 * Находит данные компаньона по companionName (showcase-версия: формулы + статы)
 */
export const findCompanionData = (selectedCompanion) => {
  if (!selectedCompanion?.companionName) return {};
  return (
    compDataShowcaseSpecific.find(
      (item) => item.companionName === selectedCompanion.companionName,
    ) || {}
  );
};

/**
 * Находит данные оружия по weaponName (showcase-версия)
 */
export const findWeaponData = (selectedMCWeapon) => {
  if (!selectedMCWeapon?.weaponName) return {};
  return (
    weaponDataShowcaseSpecific.find(
      (item) => item.weaponName === selectedMCWeapon.weaponName,
    ) || {}
  );
};

/**
 * Находит полную запись компаньона в compData по companionName,
 * уточняя по weaponName, если оружие выбрано.
 *
 * @param {object} companionData — запись из compDataShowcaseSpecific
 * @param {object} weaponData    — запись из weaponDataShowcaseSpecific
 * @returns {object|null}
 */
export const findFullCompanionData = (companionData, weaponData) => {
  if (!companionData?.companionName) return null;

  const candidates = compData.filter(
    (c) => c.companionName === companionData.companionName,
  );
  if (candidates.length === 0) return null;

  if (weaponData?.weaponName) {
    const withWeapon = candidates.find(
      (c) => c.weaponName === weaponData.weaponName,
    );
    if (withWeapon) return withWeapon;
  }

  return candidates[0];
};

/**
 * Маппинг rowKey → поле текста в compData.
 * Если поле отсутствует — вернёт undefined, и компонент покажет fallback.
 */
const SKILL_TEXT_FIELD_BY_KEY = {
  // Companion skills
  support: "supportSkillText",
  empoweredSupport: "supportSkillText",
  empoweredSupport2: "supportSkillText",
  support2: "supportSkillText",
  support3: "supportSkillText",
  resonance: "resonanceSkillText",
  resonance2: "resonanceSkillText",
  ardentOath: "ardentOathText",

  // Passive (Companion)
  passive1: "passiveSkillText",
  passive2: "passiveSkillText",
  passive3: "passiveSkillText",
  passive4: "passiveSkillText",
  passive5: "passiveSkillText",

  // Sync Skill — в compData отдельных полей нет; при появлении — добавить сюда
  sync1: "syncSkillText",
  sync2: "syncSkillText",
  sync3: "syncSkillText",
  sync4: "syncSkillText",
  syncCharged: "syncSkillText",

  // Sync Active Skill — аналогично
  activeI: "syncActiveSkillText",
  activeII: "syncActiveSkillText",
  activeII2: "syncActiveSkillText",
  activeIII: "syncActiveSkillText",
  activeIII2: "syncActiveSkillText",

  // Weapon (MC)
  basic1: "basicAttackText",
  basic2: "basicAttackText",
  basic3: "basicAttackText",
  basic4: "basicAttackText",
  basic5: "basicAttackText",
  basicTotal: "basicAttackText",
  basicCharged: "basicAttackText",
  basicCharged2: "basicAttackText",
  active1: "activeSkillText",
  active2: "activeSkillText",
  passiveMC: "passiveMCText",
};

/**
 * Возвращает текст описания скилла по rowKey.
 *
 * @param {string} rowKey
 * @param {object|null} fullCompanion — запись из compData
 * @param {object} fallbacks — { [rowKey]: string } — заглушки из компонента
 * @returns {string}
 */
export const getSkillDetails = (rowKey, fullCompanion, fallbacks = {}) => {
  const field = SKILL_TEXT_FIELD_BY_KEY[rowKey];
  if (field && fullCompanion?.[field]) {
    return fullCompanion[field];
  }
  return fallbacks[rowKey] || "Нет описания";
};

/**
 * Собирает объект { [rowKey]: текст } за один проход.
 *
 * @param {object|null} fullCompanion
 * @param {object} fallbacks
 * @returns {Record<string, string>}
 */
export const buildSkillDetailsMap = (fullCompanion, fallbacks = {}) => {
  const result = {};
  for (const rowKey of Object.keys(SKILL_TEXT_FIELD_BY_KEY)) {
    result[rowKey] = getSkillDetails(rowKey, fullCompanion, fallbacks);
  }
  return result;
};

/**
 * Собирает rawDamage по всем скиллам
 */
const computeRawDamage = (companionData, weaponData, s) => {
  const calc = createDamageCalculator;

  return {
    support: companionData.supportSkillStats
      ? calc(companionData.supportSkillStats)(s)
      : 0,
    support2: companionData.supportSkillStats2
      ? calc(companionData.supportSkillStats2)(s)
      : 0,
    support3: companionData.supportSkillStats3
      ? calc(companionData.supportSkillStats3)(s)
      : 0,
    empoweredSupport: companionData.empoweredSupportSkillStats
      ? calc(companionData.empoweredSupportSkillStats)(s)
      : 0,
    empoweredSupport2: companionData.empoweredSupportSkillStats2
      ? calc(companionData.empoweredSupportSkillStats2)(s)
      : 0,
    resonance: companionData.resonanceSkillStats
      ? calc(companionData.resonanceSkillStats)(s)
      : 0,
    resonance2: companionData.resonanceSkillStats2
      ? calc(companionData.resonanceSkillStats2)(s)
      : 0,
    ardentOath: companionData.ardentOathStats
      ? calc(companionData.ardentOathStats)(s)
      : 0,
    passive1: companionData.passiveSkillStats1
      ? calc(companionData.passiveSkillStats1)(s)
      : 0,
    passive2: companionData.passiveSkillStats2
      ? calc(companionData.passiveSkillStats2)(s)
      : 0,
    passive3: companionData.passiveSkillStats3
      ? calc(companionData.passiveSkillStats3)(s)
      : 0,
    passive4: companionData.passiveSkillStats4
      ? calc(companionData.passiveSkillStats4)(s)
      : 0,
    passive5: companionData.passiveSkillStats5
      ? calc(companionData.passiveSkillStats5)(s)
      : 0,
    basicSync1: companionData.basicSyncFirstStrikeStats
      ? calc(companionData.basicSyncFirstStrikeStats)(s)
      : 0,
    basicSync2: companionData.basicSyncSecondStrikeStats
      ? calc(companionData.basicSyncSecondStrikeStats)(s)
      : 0,
    basicSync3: companionData.basicSyncThirdStrikeStats
      ? calc(companionData.basicSyncThirdStrikeStats)(s)
      : 0,
    basicSync4: companionData.basicSyncFourthStrikeStats
      ? calc(companionData.basicSyncFourthStrikeStats)(s)
      : 0,
    basicSyncCharged: companionData.basicSyncChargedAttackStats
      ? calc(companionData.basicSyncChargedAttackStats)(s)
      : 0,
    activeI: companionData.activeSkill_IStats
      ? calc(companionData.activeSkill_IStats)(s)
      : 0,
    activeII: companionData.activeSkill_IStats
      ? calc(companionData.activeSkill_IStats)(s)
      : 0,
    activeII2: companionData.activeSkill_IIStats2
      ? calc(companionData.activeSkill_IIStats2)(s)
      : 0,
    activeIII: companionData.activeSkill_IIIStats
      ? calc(companionData.activeSkill_IIIStats)(s)
      : 0,
    activeIII2: companionData.activeSkill_IIIStats2
      ? calc(companionData.activeSkill_IIIStats2)(s)
      : 0,

    basicTotal: weaponData.basicAttackFormula
      ? calc(weaponData.basicAttackStats)(s)
      : 0,
    basic1: weaponData.basicFirstStrikeStats
      ? calc(weaponData.basicFirstStrikeStats)(s)
      : 0,
    basic2: weaponData.basicSecondStrikeStats
      ? calc(weaponData.basicSecondStrikeStats)(s)
      : 0,
    basic3: weaponData.basicThirdStrikeStats
      ? calc(weaponData.basicThirdStrikeStats)(s)
      : 0,
    basic4: weaponData.basicFourthStrikeStats
      ? calc(weaponData.basicFourthStrikeStats)(s)
      : 0,
    basic5: weaponData.basicFifthStrikeStats
      ? calc(weaponData.basicFifthStrikeStats)(s)
      : 0,
    basicCharged: weaponData.basicChargedAttackStats
      ? calc(weaponData.basicChargedAttackStats)(s)
      : 0,
    basicCharged2: weaponData.basicChargedAttackStats2
      ? calc(weaponData.basicChargedAttackStats2)(s)
      : 0,
    active1: weaponData.activeSkillStats
      ? calc(weaponData.activeSkillStats)(s)
      : 0,
    active2: weaponData.activeSkillSecondStats
      ? calc(weaponData.activeSkillSecondStats)(s)
      : 0,
    passiveMC: weaponData.passiveSkillMCStats
      ? calc(weaponData.passiveSkillMCStats)(s)
      : 0,
  };
};

const sumDamage = (damageMap) =>
  Object.values(damageMap).reduce((acc, v) => acc + (v || 0), 0);

/**
 * Чистая функция расчёта урона команды.
 * @param stats — { hp, atk, def, dmgBoost, critDmg, oathStrength }
 * @param context — { selectedCompanion, selectedMCWeapon, teamDmgBonus }
 * @returns { baseDamage, weakenedDamage, critDamage, baseSum, weakenedSum, critSum }
 */
export const computeKitDamage = (stats, context) => {
  const {
    selectedCompanion,
    selectedMCWeapon,
    teamDmgBonus = 0,
    attributeBonus = 0,
    perfectMatchBonus = 0,
  } = context || {};

  const companionData = findCompanionData(selectedCompanion);
  const weaponData = findWeaponData(selectedMCWeapon);

  const companionStats = {
    hp: stats?.hp || 1,
    atk: stats?.atk || 1,
    def: stats?.def || 1,
  };

  const dmgBoostToWeakened = Number((stats?.dmgBoost || 0).toFixed(2));
  const critDmg = stats?.critDmg || 0;
  const oathStrength = stats?.oathStrength || 0;

  const rawDamage = computeRawDamage(companionData, weaponData, companionStats);

  const bonuses = {
    attributeBonus,
    teamDmgBonus,
    oathStrength,
    critDmg,
    weakenedDmg: dmgBoostToWeakened + perfectMatchBonus,
  };

  const ardentOathSkills = ["ardentOath"];

  const { baseDamage, weakenedDamage, critDamage } = calculateAllDamageTypes(
    rawDamage,
    bonuses,
    ardentOathSkills,
  );

  return {
    baseDamage,
    weakenedDamage,
    critDamage,
    baseSum: sumDamage(baseDamage),
    weakenedSum: sumDamage(weakenedDamage),
    critSum: sumDamage(critDamage),
  };
};

/**
 * Определяет целевой тип урона по выбранному delta
 */
export const detectDamageType = (delta) => {
  if (!delta) return "base";
  const d = String(delta).toLowerCase();
  if (d.includes("weakened") || d.includes("dmg boost")) return "weakened";
  if (d.includes("crit")) return "crit";
  return "base";
};
