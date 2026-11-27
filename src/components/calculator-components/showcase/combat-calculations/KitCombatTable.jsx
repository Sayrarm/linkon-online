import { useMemo, useState, Fragment } from "react";
import styles from "./KitCombatTable.module.css";
import {
  findCompanionData,
  findWeaponData,
  computeKitDamage,
  findFullCompanionData,
  buildSkillDetailsMap,
} from "@data";

function KitCombatTable({
  stats,
  selectedCompanion,
  selectedMCWeapon,
  teamDmgBonus = 0,
  additionalBonus,
}) {
  const { attributeBonus, perfectMatchBonus } = additionalBonus || {
    attributeBonus: 0,
    perfectMatchBonus: 0,
  };

  // Состояние раскрытых строк: Set ключей (уникальный id строки)
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (rowKey) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);
      return next;
    });
  };

  const companionData = useMemo(
    () => findCompanionData(selectedCompanion),
    [selectedCompanion],
  );

  const weaponData = useMemo(
    () => findWeaponData(selectedMCWeapon),
    [selectedMCWeapon],
  );

  // Весь расчёт урона — одной функцией
  const { baseDamage, weakenedDamage, critDamage } = useMemo(
    () =>
      computeKitDamage(stats, {
        selectedCompanion,
        selectedMCWeapon,
        teamDmgBonus,
        attributeBonus,
        perfectMatchBonus,
      }),
    [
      stats,
      selectedCompanion,
      selectedMCWeapon,
      teamDmgBonus,
      attributeBonus,
      perfectMatchBonus,
    ],
  );

  // Полная запись из compData (с текстами описаний)
  const fullCompanion = useMemo(
    () => findFullCompanionData(companionData, weaponData),
    [companionData, weaponData],
  );

  // Карта { rowKey: текст } — считается один раз
  const skillDetailsMap = useMemo(
    () => buildSkillDetailsMap(fullCompanion),
    [fullCompanion],
  );

  const roundDisplay = (value) => Math.round(value);

  /**
   * Универсальный рендер строки с раскрытием.
   * rowKey — уникальный ключ строки (для состояния)
   * label — название скилла
   * base/weak/crit — значения
   * formula — формула (в колонке Formula)
   */
  const renderExpandableRow = ({
    rowKey,
    label,
    base,
    weak,
    crit,
    formula,
  }) => {
    const isExpanded = expandedRows.has(rowKey);

    // приоритет: compData → заглушка
    const resolvedDetails = skillDetailsMap[rowKey] || "Нет описания";

    return (
      <Fragment key={rowKey}>
        <tr
          className={`${styles.expandableRow} ${isExpanded ? styles.expanded : ""}`}
          onClick={() => toggleRow(rowKey)}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleRow(rowKey);
            }
          }}
        >
          <th>
            <span className={styles.expandIcon}>
              {isExpanded ? "▾ " : "▸ "}
            </span>
            {label}
          </th>
          <td>{roundDisplay(base)}</td>
          <td>{roundDisplay(weak)}</td>
          <td>{roundDisplay(crit)}</td>
          <td>{formula || "—"}</td>
        </tr>
        {isExpanded && resolvedDetails && (
          <tr className={styles.detailsRow}>
            <td colSpan={5}>
              <div className={styles.detailsContent}>{resolvedDetails}</div>
            </td>
          </tr>
        )}
      </Fragment>
    );
  };

  return (
    <section className={styles.kitCombatTableContainer}>
      <table className={styles.statsTable}>
        <thead>
          <tr>
            <th className={styles.titleSkill}></th>
            <th className={styles.titleSkill}>Base</th>
            <th className={styles.titleSkill}>Weakened DMG</th>
            <th className={styles.titleSkill}>Crit DMG</th>
            <th className={styles.titleSkill}>Formula</th>
          </tr>
        </thead>
        <tbody>
          {/* Support Skill */}
          {(baseDamage.support > 0 || companionData.supportSkillFormula) &&
            renderExpandableRow({
              rowKey: "support",
              label: "Support Skill",
              base: baseDamage.support,
              weak: weakenedDamage.support,
              crit: critDamage.support,
              formula: companionData.supportSkillFormula,
            })}

          {/* Empowered Support Skill */}
          {(baseDamage.empoweredSupport > 0 ||
            companionData.empoweredSupportSkillFormula) &&
            renderExpandableRow({
              rowKey: "empoweredSupport",
              label: "Empowered Support Skill",
              base: baseDamage.empoweredSupport,
              weak: weakenedDamage.empoweredSupport,
              crit: critDamage.empoweredSupport,
              formula: companionData.empoweredSupportSkillFormula,
            })}

          {/* Empowered Support Skill Additional */}
          {(baseDamage.empoweredSupport2 > 0 ||
            companionData.empoweredSupportSkillFormula2) &&
            renderExpandableRow({
              rowKey: "empoweredSupport2",
              label: "Empowered Support Skill Additional",
              base: baseDamage.empoweredSupport2,
              weak: weakenedDamage.empoweredSupport2,
              crit: critDamage.empoweredSupport2,
              formula: companionData.empoweredSupportSkillFormula2,
            })}

          {/* Support Skill Additional */}
          {(baseDamage.support2 > 0 || companionData.supportSkillFormula2) &&
            renderExpandableRow({
              rowKey: "support2",
              label: "Support Skill Additional",
              base: baseDamage.support2,
              weak: weakenedDamage.support2,
              crit: critDamage.support2,
              formula: companionData.supportSkillFormula2,
            })}

          {/* Support Skill Additional 3 */}
          {(baseDamage.support3 > 0 || companionData.supportSkillFormula3) &&
            renderExpandableRow({
              rowKey: "support3",
              label: "Support Skill Additional",
              base: baseDamage.support3,
              weak: weakenedDamage.support3,
              crit: critDamage.support3,
              formula: companionData.supportSkillFormula3,
            })}

          {/* Resonance Skill */}
          {(baseDamage.resonance > 0 || companionData.resonanceSkillFormula) &&
            renderExpandableRow({
              rowKey: "resonance",
              label: "Resonance Skill",
              base: baseDamage.resonance,
              weak: weakenedDamage.resonance,
              crit: critDamage.resonance,
              formula: companionData.resonanceSkillFormula,
            })}

          {/* Resonance Skill Additional */}
          {(baseDamage.resonance2 > 0 ||
            companionData.resonanceSkillFormula2) &&
            renderExpandableRow({
              rowKey: "resonance2",
              label: "Resonance Skill Additional",
              base: baseDamage.resonance2,
              weak: weakenedDamage.resonance2,
              crit: critDamage.resonance2,
              formula: companionData.resonanceSkillFormula2,
            })}

          {/* Ardent Oath */}
          {(baseDamage.ardentOath > 0 || companionData.ardentOathFormula) &&
            renderExpandableRow({
              rowKey: "ardentOath",
              label: "Ardent Oath",
              base: baseDamage.ardentOath,
              weak: weakenedDamage.ardentOath,
              crit: critDamage.ardentOath,
              formula: companionData.ardentOathFormula,
            })}

          {/* Passive Skills */}
          {(baseDamage.passive1 > 0 || companionData.passiveSkillFormula1) &&
            renderExpandableRow({
              rowKey: "passive1",
              label: "Passive Skill (Companion)",
              base: baseDamage.passive1,
              weak: weakenedDamage.passive1,
              crit: critDamage.passive1,
              formula: companionData.passiveSkillFormula1,
            })}

          {(baseDamage.passive2 > 0 || companionData.passiveSkillFormula2) &&
            renderExpandableRow({
              rowKey: "passive2",
              label: "Passive Skill Additional (Companion)",
              base: baseDamage.passive2,
              weak: weakenedDamage.passive2,
              crit: critDamage.passive2,
              formula: companionData.passiveSkillFormula2,
            })}

          {(baseDamage.passive3 > 0 || companionData.passiveSkillFormula3) &&
            renderExpandableRow({
              rowKey: "passive3",
              label: "Passive Skill Additional (Companion)",
              base: baseDamage.passive3,
              weak: weakenedDamage.passive3,
              crit: critDamage.passive3,
              formula: companionData.passiveSkillFormula3,
            })}

          {(baseDamage.passive4 > 0 || companionData.passiveSkillFormula4) &&
            renderExpandableRow({
              rowKey: "passive4",
              label: "Passive Skill Additional (Companion)",
              base: baseDamage.passive4,
              weak: weakenedDamage.passive4,
              crit: critDamage.passive4,
              formula: companionData.passiveSkillFormula4,
            })}

          {(baseDamage.passive5 > 0 || companionData.passiveSkillFormula5) &&
            renderExpandableRow({
              rowKey: "passive5",
              label: "Passive Skill Additional (Companion)",
              base: baseDamage.passive5,
              weak: weakenedDamage.passive5,
              crit: critDamage.passive5,
              formula: companionData.passiveSkillFormula5,
            })}

          {/* Sync Skill */}
          {companionData.syncSkill && (
            <>
              <tr>
                <th className={styles.titleSkill}>Sync Skill:</th>
              </tr>

              {(baseDamage.basicSync1 > 0 ||
                companionData.basicSyncFirstStrike) &&
                renderExpandableRow({
                  rowKey: "sync1",
                  label: "First Strike",
                  base: baseDamage.basicSync1,
                  weak: weakenedDamage.basicSync1,
                  crit: critDamage.basicSync1,
                  formula: companionData.basicSyncFirstStrike,
                })}

              {(baseDamage.basicSync2 > 0 ||
                companionData.basicSyncSecondStrike) &&
                renderExpandableRow({
                  rowKey: "sync2",
                  label: "Second Strike",
                  base: baseDamage.basicSync2,
                  weak: weakenedDamage.basicSync2,
                  crit: critDamage.basicSync2,
                  formula: companionData.basicSyncSecondStrike,
                })}

              {(baseDamage.basicSync3 > 0 ||
                companionData.basicSyncThirdStrike) &&
                renderExpandableRow({
                  rowKey: "sync3",
                  label: "Third Strike",
                  base: baseDamage.basicSync3,
                  weak: weakenedDamage.basicSync3,
                  crit: critDamage.basicSync3,
                  formula: companionData.basicSyncThirdStrike,
                })}

              {(baseDamage.basicSync4 > 0 ||
                companionData.basicSyncFourthStrike) &&
                renderExpandableRow({
                  rowKey: "sync4",
                  label: "Fourth Strike",
                  base: baseDamage.basicSync4,
                  weak: weakenedDamage.basicSync4,
                  crit: critDamage.basicSync4,
                  formula: companionData.basicSyncFourthStrike,
                })}

              {(baseDamage.basicSyncCharged > 0 ||
                companionData.basicSyncChargedAttack) &&
                renderExpandableRow({
                  rowKey: "syncCharged",
                  label: "Charged Attack",
                  base: baseDamage.basicSyncCharged,
                  weak: weakenedDamage.basicSyncCharged,
                  crit: critDamage.basicSyncCharged,
                  formula: companionData.basicSyncChargedAttack,
                })}

              <tr>
                <th className={styles.titleSkill}>Sync Active Skill:</th>
              </tr>

              {(baseDamage.activeI > 0 || companionData.activeSkill_IFormula) &&
                renderExpandableRow({
                  rowKey: "activeI",
                  label: "Active Skill I",
                  base: baseDamage.activeI,
                  weak: weakenedDamage.activeI,
                  crit: critDamage.activeI,
                  formula: companionData.activeSkill_IFormula,
                })}

              {(baseDamage.activeII > 0 ||
                companionData.activeSkill_IIFormula) &&
                renderExpandableRow({
                  rowKey: "activeII",
                  label: "Active Skill II",
                  base: baseDamage.activeII,
                  weak: weakenedDamage.activeII,
                  crit: critDamage.activeII,
                  formula: companionData.activeSkill_IIFormula,
                })}

              {(baseDamage.activeII2 > 0 ||
                companionData.activeSkill_IIFormula2) &&
                renderExpandableRow({
                  rowKey: "activeII2",
                  label: "Active Skill II Additional",
                  base: baseDamage.activeII2,
                  weak: weakenedDamage.activeII2,
                  crit: critDamage.activeII2,
                  formula: companionData.activeSkill_IIFormula2,
                })}

              {(baseDamage.activeIII > 0 ||
                companionData.activeSkill_IIIFormula) &&
                renderExpandableRow({
                  rowKey: "activeIII",
                  label: "Active Skill III",
                  base: baseDamage.activeIII,
                  weak: weakenedDamage.activeIII,
                  crit: critDamage.activeIII,
                  formula: companionData.activeSkill_IIIFormula,
                })}

              {(baseDamage.activeIII2 > 0 ||
                companionData.activeSkill_IIIFormula2) &&
                renderExpandableRow({
                  rowKey: "activeIII2",
                  label: "Active Skill III Additional",
                  base: baseDamage.activeIII2,
                  weak: weakenedDamage.activeIII2,
                  crit: critDamage.activeIII2,
                  formula: companionData.activeSkill_IIIFormula2,
                })}
            </>
          )}

          {/* Basic Attack */}
          {selectedMCWeapon && (
            <>
              <tr>
                <th className={styles.titleSkill}>Basic Attack:</th>
              </tr>

              {(baseDamage.basic1 > 0 || weaponData.basicFirstStrike) &&
                renderExpandableRow({
                  rowKey: "basic1",
                  label: "First Strike",
                  base: baseDamage.basic1,
                  weak: weakenedDamage.basic1,
                  crit: critDamage.basic1,
                  formula: weaponData.basicFirstStrike,
                })}

              {(baseDamage.basic2 > 0 || weaponData.basicSecondStrike) &&
                renderExpandableRow({
                  rowKey: "basic2",
                  label: "Second Strike",
                  base: baseDamage.basic2,
                  weak: weakenedDamage.basic2,
                  crit: critDamage.basic2,
                  formula: weaponData.basicSecondStrike,
                })}

              {(baseDamage.basic3 > 0 || weaponData.basicThirdStrike) &&
                renderExpandableRow({
                  rowKey: "basic3",
                  label: "Third Strike",
                  base: baseDamage.basic3,
                  weak: weakenedDamage.basic3,
                  crit: critDamage.basic3,
                  formula: weaponData.basicThirdStrike,
                })}

              {(baseDamage.basic4 > 0 || weaponData.basicFourthStrike) &&
                renderExpandableRow({
                  rowKey: "basic4",
                  label: "Fourth Strike",
                  base: baseDamage.basic4,
                  weak: weakenedDamage.basic4,
                  crit: critDamage.basic4,
                  formula: weaponData.basicFourthStrike,
                })}

              {(baseDamage.basic5 > 0 || weaponData.basicFifthStrike) &&
                renderExpandableRow({
                  rowKey: "basic5",
                  label: "Fifth Strike",
                  base: baseDamage.basic5,
                  weak: weakenedDamage.basic5,
                  crit: critDamage.basic5,
                  formula: weaponData.basicFifthStrike,
                })}

              {(baseDamage.basicTotal > 0 || weaponData.basicAttackFormula) &&
                renderExpandableRow({
                  rowKey: "basicTotal",
                  label: "Basic Attack (Total DMG)",
                  base: baseDamage.basicTotal,
                  weak: weakenedDamage.basicTotal,
                  crit: critDamage.basicTotal,
                  formula: weaponData.basicAttackFormula,
                })}

              {(baseDamage.basicCharged > 0 || weaponData.basicChargedAttack) &&
                renderExpandableRow({
                  rowKey: "basicCharged",
                  label: "Charged Attack",
                  base: baseDamage.basicCharged,
                  weak: weakenedDamage.basicCharged,
                  crit: critDamage.basicCharged,
                  formula: weaponData.basicChargedAttack,
                })}

              {(baseDamage.basicCharged2 > 0 ||
                weaponData.basicChargedAttack2) &&
                renderExpandableRow({
                  rowKey: "basicCharged2",
                  label: "Charged Attack Additional",
                  base: baseDamage.basicCharged2,
                  weak: weakenedDamage.basicCharged2,
                  crit: critDamage.basicCharged2,
                  formula: weaponData.basicChargedAttack2,
                })}

              <tr>
                <th className={styles.titleSkill}>Active Skill:</th>
              </tr>

              {(baseDamage.active1 > 0 || weaponData.activeSkillFormula) &&
                renderExpandableRow({
                  rowKey: "active1",
                  label: "Active Skill",
                  base: baseDamage.active1,
                  weak: weakenedDamage.active1,
                  crit: critDamage.active1,
                  formula: weaponData.activeSkillFormula,
                })}

              {(baseDamage.active2 > 0 ||
                weaponData.activeSkillSecondFormula) &&
                renderExpandableRow({
                  rowKey: "active2",
                  label: "Active Skill Additional",
                  base: baseDamage.active2,
                  weak: weakenedDamage.active2,
                  crit: critDamage.active2,
                  formula: weaponData.activeSkillSecondFormula,
                })}

              {(baseDamage.passiveMC > 0 || weaponData.passiveSkillMCFormula) &&
                renderExpandableRow({
                  rowKey: "passiveMC",
                  label: "Passive Skill (MC)",
                  base: baseDamage.passiveMC,
                  weak: weakenedDamage.passiveMC,
                  crit: critDamage.passiveMC,
                  formula: weaponData.passiveSkillMCFormula,
                })}
            </>
          )}
        </tbody>
      </table>
    </section>
  );
}

export default KitCombatTable;
