import { useMemo, useState, Fragment } from "react";
import styles from "./KitCombatTable.module.css";
import {
  findCompanionData,
  findWeaponData,
  computeKitDamage,
  compData,
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

  const fullCompanion = useMemo(() => {
    if (!companionData) return null;
    return (
      compData.find(
        (c) =>
          c.companionName === companionData.companionName &&
          // для weapon-специфичных данных тоже проверяем weaponName
          (c.weaponName === weaponData?.weaponName || !weaponData),
      ) || null
    );
  }, [companionData, weaponData]);

  const getSkillDetails = (rowKey) => {
    if (!fullCompanion) return null;

    switch (rowKey) {
      // ── Companion skills ──
      case "support":
        return fullCompanion.supportSkillText;
      case "empoweredSupport":
      case "empoweredSupport2":
        // в compData нет отдельного поля под empowered — берём из supportSkillText
        // (там описано "[Empowered] Royal Seal: ...")
        return fullCompanion.supportSkillText;
      case "support2":
      case "support3":
        // «Support Skill Additional» — тоже часть supportSkillText
        return fullCompanion.supportSkillText;
      case "resonance":
      case "resonance2":
        return fullCompanion.resonanceSkillText;
      case "ardentOath":
        return fullCompanion.ardentOathText;

      // ── Passive (Companion) ──
      case "passive1":
      case "passive2":
      case "passive3":
      case "passive4":
      case "passive5":
        return fullCompanion.passiveSkillText;

      // ── Sync Skill (basic sync) ──
      // В compData описания sync-ударов нет отдельным полем.
      // Если появится — добавьте case сюда. Пока возвращаем null,
      // чтобы показать fallback.
      case "sync1":
      case "sync2":
      case "sync3":
      case "sync4":
      case "syncCharged":
        return fullCompanion.syncSkillText || null;

      // ── Sync Active Skill ──
      // Тоже нет отдельного поля в compData.
      case "activeI":
      case "activeII":
      case "activeII2":
      case "activeIII":
      case "activeIII2":
        return fullCompanion.syncActiveSkillText || null;

      // ── Weapon (MC) ──
      case "basic1":
      case "basic2":
      case "basic3":
      case "basic4":
      case "basic5":
      case "basicTotal":
      case "basicCharged":
      case "basicCharged2":
        return fullCompanion.basicAttackText;
      case "active1":
      case "active2":
        return fullCompanion.activeSkillText;
      case "passiveMC":
        return fullCompanion.passiveMCText;

      default:
        return null;
    }
  };

  const roundDisplay = (value) => Math.round(value);

  /**
   * Универсальный рендер строки с раскрытием.
   * rowKey — уникальный ключ строки (для состояния)
   * label — название скилла
   * base/weak/crit — значения
   * formula — формула (в колонке Formula)
   * details — текст, который покажется при раскрытии
   */
  const renderExpandableRow = ({
    rowKey,
    label,
    base,
    weak,
    crit,
    formula,
    details, // оставляем как fallback
  }) => {
    const isExpanded = expandedRows.has(rowKey);

    // приоритет: compData → переданный details → заглушка
    const resolvedDetails =
      getSkillDetails(rowKey) || details || "Нет описания";

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
              details:
                companionData.supportSkillDetails ||
                "Дополнительное описание Support Skill...",
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
              details:
                companionData.empoweredSupportSkillDetails ||
                "Дополнительное описание Empowered Support Skill...",
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
              details:
                companionData.empoweredSupportSkillDetails2 ||
                "Дополнительное описание Empowered Support Skill Additional...",
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
              details:
                companionData.supportSkillDetails2 ||
                "Дополнительное описание Support Skill Additional...",
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
              details:
                companionData.supportSkillDetails3 ||
                "Дополнительное описание Support Skill Additional (3)...",
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
              details:
                companionData.resonanceSkillDetails ||
                "Дополнительное описание Resonance Skill...",
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
              details:
                companionData.resonanceSkillDetails2 ||
                "Дополнительное описание Resonance Skill Additional...",
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
              details:
                companionData.ardentOathDetails ||
                "Дополнительное описание Ardent Oath...",
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
              details:
                companionData.passiveSkillDetails1 ||
                "Дополнительное описание Passive Skill 1...",
            })}

          {(baseDamage.passive2 > 0 || companionData.passiveSkillFormula2) &&
            renderExpandableRow({
              rowKey: "passive2",
              label: "Passive Skill Additional (Companion)",
              base: baseDamage.passive2,
              weak: weakenedDamage.passive2,
              crit: critDamage.passive2,
              formula: companionData.passiveSkillFormula2,
              details:
                companionData.passiveSkillDetails2 ||
                "Дополнительное описание Passive Skill 2...",
            })}

          {(baseDamage.passive3 > 0 || companionData.passiveSkillFormula3) &&
            renderExpandableRow({
              rowKey: "passive3",
              label: "Passive Skill Additional (Companion)",
              base: baseDamage.passive3,
              weak: weakenedDamage.passive3,
              crit: critDamage.passive3,
              formula: companionData.passiveSkillFormula3,
              details:
                companionData.passiveSkillDetails3 ||
                "Дополнительное описание Passive Skill 3...",
            })}

          {(baseDamage.passive4 > 0 || companionData.passiveSkillFormula4) &&
            renderExpandableRow({
              rowKey: "passive4",
              label: "Passive Skill Additional (Companion)",
              base: baseDamage.passive4,
              weak: weakenedDamage.passive4,
              crit: critDamage.passive4,
              formula: companionData.passiveSkillFormula4,
              details:
                companionData.passiveSkillDetails4 ||
                "Дополнительное описание Passive Skill 4...",
            })}

          {(baseDamage.passive5 > 0 || companionData.passiveSkillFormula5) &&
            renderExpandableRow({
              rowKey: "passive5",
              label: "Passive Skill Additional (Companion)",
              base: baseDamage.passive5,
              weak: weakenedDamage.passive5,
              crit: critDamage.passive5,
              formula: companionData.passiveSkillFormula5,
              details:
                companionData.passiveSkillDetails5 ||
                "Дополнительное описание Passive Skill 5...",
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
                  details:
                    companionData.basicSyncFirstStrikeDetails ||
                    "Дополнительное описание First Strike...",
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
                  details:
                    companionData.basicSyncSecondStrikeDetails ||
                    "Дополнительное описание Second Strike...",
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
                  details:
                    companionData.basicSyncThirdStrikeDetails ||
                    "Дополнительное описание Third Strike...",
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
                  details:
                    companionData.basicSyncFourthStrikeDetails ||
                    "Дополнительное описание Fourth Strike...",
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
                  details:
                    companionData.basicSyncChargedAttackDetails ||
                    "Дополнительное описание Charged Attack...",
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
                  details:
                    companionData.activeSkill_IDetails ||
                    "Дополнительное описание Active Skill I...",
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
                  details:
                    companionData.activeSkill_IIDetails ||
                    "Дополнительное описание Active Skill II...",
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
                  details:
                    companionData.activeSkill_IIDetails2 ||
                    "Дополнительное описание Active Skill II Additional...",
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
                  details:
                    companionData.activeSkill_IIIDetails ||
                    "Дополнительное описание Active Skill III...",
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
                  details:
                    companionData.activeSkill_IIIDetails2 ||
                    "Дополнительное описание Active Skill III Additional...",
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
                  details:
                    weaponData.basicFirstStrikeDetails ||
                    "Дополнительное описание First Strike...",
                })}

              {(baseDamage.basic2 > 0 || weaponData.basicSecondStrike) &&
                renderExpandableRow({
                  rowKey: "basic2",
                  label: "Second Strike",
                  base: baseDamage.basic2,
                  weak: weakenedDamage.basic2,
                  crit: critDamage.basic2,
                  formula: weaponData.basicSecondStrike,
                  details:
                    weaponData.basicSecondStrikeDetails ||
                    "Дополнительное описание Second Strike...",
                })}

              {(baseDamage.basic3 > 0 || weaponData.basicThirdStrike) &&
                renderExpandableRow({
                  rowKey: "basic3",
                  label: "Third Strike",
                  base: baseDamage.basic3,
                  weak: weakenedDamage.basic3,
                  crit: critDamage.basic3,
                  formula: weaponData.basicThirdStrike,
                  details:
                    weaponData.basicThirdStrikeDetails ||
                    "Дополнительное описание Third Strike...",
                })}

              {(baseDamage.basic4 > 0 || weaponData.basicFourthStrike) &&
                renderExpandableRow({
                  rowKey: "basic4",
                  label: "Fourth Strike",
                  base: baseDamage.basic4,
                  weak: weakenedDamage.basic4,
                  crit: critDamage.basic4,
                  formula: weaponData.basicFourthStrike,
                  details:
                    weaponData.basicFourthStrikeDetails ||
                    "Дополнительное описание Fourth Strike...",
                })}

              {(baseDamage.basic5 > 0 || weaponData.basicFifthStrike) &&
                renderExpandableRow({
                  rowKey: "basic5",
                  label: "Fifth Strike",
                  base: baseDamage.basic5,
                  weak: weakenedDamage.basic5,
                  crit: critDamage.basic5,
                  formula: weaponData.basicFifthStrike,
                  details:
                    weaponData.basicFifthStrikeDetails ||
                    "Дополнительное описание Fifth Strike...",
                })}

              {(baseDamage.basicTotal > 0 || weaponData.basicAttackFormula) &&
                renderExpandableRow({
                  rowKey: "basicTotal",
                  label: "Basic Attack (Total DMG)",
                  base: baseDamage.basicTotal,
                  weak: weakenedDamage.basicTotal,
                  crit: critDamage.basicTotal,
                  formula: weaponData.basicAttackFormula,
                  details:
                    weaponData.basicAttackDetails ||
                    "Дополнительное описание Basic Attack (Total DMG)...",
                })}

              {(baseDamage.basicCharged > 0 || weaponData.basicChargedAttack) &&
                renderExpandableRow({
                  rowKey: "basicCharged",
                  label: "Charged Attack",
                  base: baseDamage.basicCharged,
                  weak: weakenedDamage.basicCharged,
                  crit: critDamage.basicCharged,
                  formula: weaponData.basicChargedAttack,
                  details:
                    weaponData.basicChargedAttackDetails ||
                    "Дополнительное описание Charged Attack...",
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
                  details:
                    weaponData.basicChargedAttack2Details ||
                    "Дополнительное описание Charged Attack Additional...",
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
                  details:
                    weaponData.activeSkillDetails ||
                    "Дополнительное описание Active Skill...",
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
                  details:
                    weaponData.activeSkillSecondDetails ||
                    "Дополнительное описание Active Skill Additional...",
                })}

              {(baseDamage.passiveMC > 0 || weaponData.passiveSkillMCFormula) &&
                renderExpandableRow({
                  rowKey: "passiveMC",
                  label: "Passive Skill (MC)",
                  base: baseDamage.passiveMC,
                  weak: weakenedDamage.passiveMC,
                  crit: critDamage.passiveMC,
                  formula: weaponData.passiveSkillMCFormula,
                  details:
                    weaponData.passiveSkillMCDetails ||
                    "Дополнительное описание Passive Skill (MC)...",
                })}
            </>
          )}
        </tbody>
      </table>
    </section>
  );
}

export default KitCombatTable;
