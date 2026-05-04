import { useState, useMemo, useEffect } from 'react';
import './ShopPanel.css';
import {
  influencerTypes,
  buildingTypes,
  clickUpgradeTypes,
  managerTypes,
  getMinPrestige,
  passiveCatalogTunedCps,
  catalogEraMeetsRequired,
  catalogDupExpBonusForInfluencerId,
  catalogDupExpBonusForBuildingTypeId,
  catalogDupExpBonusForManagerId,
  clickUpgradeTierIndex
} from '../data/gameData';
import {
  scaledUnitCost,
  scaledBuildingPlacementCost,
  clickUpgradeNextCost,
  getFollowerCostMult
} from '../utils/gameMath';
import { formatNumber, formatRate } from '../utils/formatNumber';

function PrestigeLockBadge({ minPrestige: minP }) {
  if (!minP || minP <= 0) return null;
  return (
    <div className="shop-prestige-lock-badge" aria-hidden="true">
      <span className="shop-prestige-lock-icon">🔒</span>
      <span>Prestige {minP}+</span>
    </div>
  );
}

function EraLockBadge({ requiredEra, catalogEra }) {
  const need = Math.max(0, Math.floor(requiredEra ?? 0));
  if (need <= 0) return null;
  if (catalogEraMeetsRequired(catalogEra, need)) return null;
  return (
    <div className="shop-era-lock-badge" aria-hidden="true">
      <span className="shop-prestige-lock-icon">🔐</span>
      <span>
        Era {need + 1} · P{need * 3}+
      </span>
    </div>
  );
}

const TABS = [
  { id: 'upgrades', label: 'Posts' },
  { id: 'influencers', label: 'Talent' },
  { id: 'buildings', label: 'Builds' },
  { id: 'staff', label: 'Staff' }
];

export const ShopPanel = ({
  clout,
  followers,
  selectedTool,
  onSelectTool,
  influencers,
  buildings,
  managers,
  clickUpgradeLevels,
  onBuyClickUpgrade,
  onBuyManager,
  passiveByTalentType = {},
  prestigeCount = 0,
  catalogEra = 0
}) => {
  const [shopTab, setShopTab] = useState('upgrades');
  const costMult = getFollowerCostMult(followers);

  const availableInfluencers = influencerTypes;
  const availableBuildings = buildingTypes;

  const selectedToolBanner = useMemo(() => {
    if (!selectedTool) return null;
    if (selectedTool.type === 'influencer') {
      const t = influencerTypes.find(x => x.id === selectedTool.id);
      return t ? { kind: 'talent', text: `${t.icon} ${t.name}`, tab: 'influencers' } : null;
    }
    if (selectedTool.type === 'building') {
      const t = buildingTypes.find(x => x.id === selectedTool.id);
      return t ? { kind: 'build', text: `${t.icon} ${t.name}`, tab: 'buildings' } : null;
    }
    return null;
  }, [selectedTool]);

  useEffect(() => {
    const onKey = e => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const t = e.target;
      if (t instanceof HTMLElement) {
        const tag = t.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable) return;
      }
      const map = {
        Digit1: 'upgrades',
        Digit2: 'influencers',
        Digit3: 'buildings',
        Digit4: 'staff'
      };
      const next = map[e.code];
      if (!next) return;
      e.preventDefault();
      setShopTab(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="shop-panel panel">
      <div className="shop-inner">
        <div className="shop-title-row">
          <h2 className="shop-title" id="shop-main-heading">
            Agency Shop
          </h2>
        </div>
        {selectedToolBanner ? (
          <button
            type="button"
            className="shop-tool-banner"
            aria-label={`Placing ${selectedToolBanner.text}. Opens ${selectedToolBanner.tab} shop tab.`}
            onClick={() => setShopTab(selectedToolBanner.tab)}
            title={`Jump to ${selectedToolBanner.tab} tab`}
          >
            <span className="shop-tool-banner-label">Placing</span>
            <span className="shop-tool-banner-name">{selectedToolBanner.text}</span>
            <span className="shop-tool-banner-hint">Tap grid · Esc</span>
          </button>
        ) : null}

        <div className="shop-tabs" role="tablist" aria-label="Shop categories">
          {TABS.map(tab => (
            <button
              key={tab.id}
              id={`shop-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={shopTab === tab.id}
              aria-controls={`shop-panel-${tab.id}`}
              tabIndex={shopTab === tab.id ? 0 : -1}
              className={`shop-tab ${shopTab === tab.id ? 'active' : ''}`}
              onClick={() => setShopTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          className="shop-tab-panel"
          role="tabpanel"
          id={`shop-panel-${shopTab}`}
          aria-labelledby={`shop-tab-${shopTab}`}
        >
          {shopTab === 'upgrades' && (
            <div className="shop-upgrades">
              {clickUpgradeTypes.map(upgrade => {
                const level = clickUpgradeLevels[upgrade.id] ?? 0;
                const cost = clickUpgradeNextCost(
                  upgrade,
                  level,
                  clickUpgradeTierIndex(upgrade.id)
                );
                const canAfford = clout >= cost;
                const minP = getMinPrestige(upgrade);
                const lockedP = minP > 0 && prestigeCount < minP;
                const needEra = Math.max(0, Math.floor(upgrade.requiredEra ?? 0));
                const lockedEra = !catalogEraMeetsRequired(catalogEra, needEra);
                const locked = lockedP || lockedEra;

                return (
                  <button
                    key={upgrade.id}
                    type="button"
                    className={`shop-upgrade shop-item--gated ${!canAfford || locked ? 'disabled' : ''}`}
                    onClick={() => onBuyClickUpgrade(upgrade.id)}
                    disabled={!canAfford || locked}
                  >
                    <div className="shop-gated-wrap">
                      <div className="upgrade-top">
                        <span className="upgrade-name">{upgrade.name}</span>
                        <span className="upgrade-level">Lv.{level}</span>
                      </div>
                      <div className="upgrade-desc">{upgrade.description}</div>
                      <div className={`upgrade-cost ${canAfford && !locked ? 'afford' : ''}`}>
                        {formatNumber(cost)} Clout
                      </div>
                      {lockedP ? (
                        <PrestigeLockBadge minPrestige={minP} />
                      ) : lockedEra ? (
                        <EraLockBadge requiredEra={needEra} catalogEra={catalogEra} />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {shopTab === 'influencers' && (
            <div className="shop-items">
              {availableInfluencers.map(influencer => {
                const owned = influencers.filter(i => i.typeId === influencer.id).length;
                const raw = scaledUnitCost(
                  influencer.cost,
                  owned,
                  undefined,
                  catalogDupExpBonusForInfluencerId(influencer.id)
                );
                const nextCost = Math.ceil(raw * costMult);
                const canAfford = clout >= nextCost;
                const isSelected = selectedTool?.type === 'influencer' && selectedTool?.id === influencer.id;
                const agencySlice =
                  owned > 0 ? (passiveByTalentType[influencer.id] ?? 0) : null;
                const minP = getMinPrestige(influencer);
                const lockedP = minP > 0 && prestigeCount < minP;
                const needEra = Math.max(0, Math.floor(influencer.requiredEra ?? 0));
                const lockedEra = !catalogEraMeetsRequired(catalogEra, needEra);
                const locked = lockedP || lockedEra;

                return (
                  <button
                    key={influencer.id}
                    type="button"
                    className={`shop-item shop-item--gated ${isSelected ? 'selected' : ''} ${!canAfford || locked ? 'disabled' : ''}`}
                    onClick={() => onSelectTool({ type: 'influencer', id: influencer.id })}
                    disabled={!canAfford || locked}
                    style={{
                      borderColor: influencer.color,
                      boxShadow: isSelected ? `0 0 20px ${influencer.color}` : 'none'
                    }}
                  >
                    <div className="shop-gated-wrap">
                    <div className="item-header">
                      <span className="item-icon" style={{ textShadow: `0 0 10px ${influencer.color}` }}>
                        {influencer.icon}
                      </span>
                      <div className="item-info">
                        <div className="item-name">{influencer.name}</div>
                        <div className="item-stats">
                          {owned > 0 ? (
                            <span className="item-stats-primary">
                              {formatRate(agencySlice)}/s · {owned} on grid
                            </span>
                          ) : (
                            <span className="item-stats-primary">
                              {formatRate(passiveCatalogTunedCps(influencer.baseCloutPerSecond))}/s per tile
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="item-description">{influencer.description}</div>
                    <div className="item-meta">
                      <span className="item-owned">×{owned} owned</span>
                      <span className="item-cost" style={{ color: canAfford ? influencer.color : '#666688' }}>
                        {formatNumber(nextCost)} Clout
                      </span>
                    </div>
                    {isSelected && <div className="selected-indicator">Click grid to place</div>}
                    {lockedP ? (
                      <PrestigeLockBadge minPrestige={minP} />
                    ) : lockedEra ? (
                      <EraLockBadge requiredEra={needEra} catalogEra={catalogEra} />
                    ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {shopTab === 'staff' && (
            <div className="shop-items shop-staff">
              {managerTypes.map(m => {
                const owned = managers.filter(x => x.typeId === m.id).length;
                const raw = scaledUnitCost(
                  m.cost,
                  owned,
                  undefined,
                  catalogDupExpBonusForManagerId(m.id)
                );
                const nextCost = Math.ceil(raw * costMult);
                const canAfford = clout >= nextCost;
                const minP = getMinPrestige(m);
                const lockedP = minP > 0 && prestigeCount < minP;
                const needEra = Math.max(0, Math.floor(m.requiredEra ?? 0));
                const lockedEra = !catalogEraMeetsRequired(catalogEra, needEra);
                const locked = lockedP || lockedEra;
                const detail =
                  m.effect === 'autoclick'
                    ? m.id === 'intern'
                      ? 'Weak auto-posts · extra hires stack gently'
                      : `${m.clicksPerSecond ?? 10} posts/s each`
                    : m.effect === 'autodeals'
                      ? 'Accepts brand deals automatically'
                      : m.effect === 'globalboost'
                        ? 'Passive lift per hire (diminishing, capped — not exponential)'
                        : m.effect === 'brandseason'
                          ? 'Favored meta deals spawn heavier this week (each scout adds weight)'
                          : '';

                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`shop-item shop-item--gated ${!canAfford || locked ? 'disabled' : ''}`}
                    onClick={() => onBuyManager(m.id)}
                    disabled={!canAfford || locked}
                  >
                    <div className="shop-gated-wrap">
                    <div className="item-header">
                      <span className="item-icon" style={{ textShadow: '0 0 10px #88ffee' }}>
                        {m.id === 'intern'
                          ? '📱'
                          : m.id === 'agent'
                            ? '🤝'
                            : m.id === 'scout'
                              ? '🎯'
                              : '🎬'}
                      </span>
                      <div className="item-info">
                        <div className="item-name">{m.name}</div>
                        <div className="item-stats">{detail}</div>
                      </div>
                    </div>
                    <div className="item-description">{m.description}</div>
                    <div className="item-meta">
                      <span className="item-owned">×{owned} hired</span>
                      <span className="item-cost">{formatNumber(nextCost)} Clout</span>
                    </div>
                    {lockedP ? (
                      <PrestigeLockBadge minPrestige={minP} />
                    ) : lockedEra ? (
                      <EraLockBadge requiredEra={needEra} catalogEra={catalogEra} />
                    ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {shopTab === 'buildings' && (
            <>
              <div className="shop-items">
              {availableBuildings.map(building => {
                const owned = buildings.filter(b => b.typeId === building.id).length;
                const raw = scaledBuildingPlacementCost(
                  building.cost,
                  owned,
                  building.requiredEra ?? 0,
                  catalogDupExpBonusForBuildingTypeId(building.id)
                );
                const nextCost = Math.ceil(raw * costMult);
                const canAfford = clout >= nextCost;
                const isSelected = selectedTool?.type === 'building' && selectedTool?.id === building.id;
                const minP = getMinPrestige(building);
                const lockedP = minP > 0 && prestigeCount < minP;
                const needEra = Math.max(0, Math.floor(building.requiredEra ?? 0));
                const lockedEra = !catalogEraMeetsRequired(catalogEra, needEra);
                const locked = lockedP || lockedEra;

                return (
                  <button
                    key={building.id}
                    type="button"
                    className={`shop-item shop-item--gated ${isSelected ? 'selected' : ''} ${!canAfford || locked ? 'disabled' : ''}`}
                    title={`Footprint ${building.size}×${building.size} tiles · Buff radius ${building.range} (Manhattan from edge) · ×${building.multiplier} talent in range`}
                    onClick={() => onSelectTool({ type: 'building', id: building.id })}
                    disabled={!canAfford || locked}
                    style={{
                      borderColor: building.color,
                      boxShadow: isSelected ? `0 0 20px ${building.color}` : 'none'
                    }}
                  >
                    <div className="shop-gated-wrap">
                    <div className="item-header">
                      <span className="item-icon" style={{ textShadow: `0 0 10px ${building.color}` }}>
                        {building.icon}
                      </span>
                      <div className="item-info">
                        <div className="item-name">{building.name}</div>
                        <div className="item-stats">
                          {building.multiplier}x (Range: {building.range})
                        </div>
                      </div>
                    </div>
                    <div className="item-description">{building.description}</div>
                    <div className="item-meta">
                      <span className="item-owned">×{owned} built</span>
                      <span className="item-cost">{formatNumber(nextCost)} Clout</span>
                    </div>
                    {isSelected && <div className="selected-indicator">Click grid to place</div>}
                    {lockedP ? (
                      <PrestigeLockBadge minPrestige={minP} />
                    ) : lockedEra ? (
                      <EraLockBadge requiredEra={needEra} catalogEra={catalogEra} />
                    ) : null}
                    </div>
                  </button>
                );
              })}
              </div>
            </>
          )}
        </div>

        {selectedTool && (
          <button type="button" className="clear-selection" onClick={() => onSelectTool(null)}>
            Cancel Selection
          </button>
        )}
      </div>
    </div>
  );
};
