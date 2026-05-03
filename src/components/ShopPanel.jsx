import { useState, useMemo, useEffect } from 'react';
import './ShopPanel.css';
import {
  influencerTypes,
  buildingTypes,
  clickUpgradeTypes,
  managerTypes,
  getMinPrestige,
  passiveCatalogTunedCps,
  PASSIVE_GLOBAL_MULT
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
  passiveCloutPerSecond = 0,
  passiveByTalentType = {},
  prestigeCount = 0
}) => {
  const [shopTab, setShopTab] = useState('upgrades');
  const costMult = getFollowerCostMult(followers);
  const discountPct = Math.round((1 - costMult) * 100);

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
            <span className="shop-tool-banner-hint">Tap grid · Esc clears · click banner for tab</span>
          </button>
        ) : null}
        <p className="shop-tagline">
          Each extra copy of the same hire/build ramps up sharply (accelerating curve — not a flat %).
          Full catalog — afford what you can. Keys <kbd className="shop-kbd">1</kbd>–
          <kbd className="shop-kbd">4</kbd> switch tabs when not typing.
          {discountPct > 0 && (
            <span className="shop-follower-discount">
              {' '}
              Audience: −{discountPct}% on hires & builds.
            </span>
          )}
        </p>

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
              <p className="shop-posts-hint">
                Post upgrades are listed <strong>weakest → strongest</strong>; base price rises each row.{' '}
                <strong>Adds</strong> = flat Clout into your post <em>before</em> multipliers;{' '}
                <strong>Multiplies whole post</strong> = scales the <em>final</em> payout (gets stronger as base + other
                bonuses grow).
              </p>
              {clickUpgradeTypes.map(upgrade => {
                const level = clickUpgradeLevels[upgrade.id] ?? 0;
                const cost = clickUpgradeNextCost(upgrade, level);
                const canAfford = clout >= cost;
                const minP = getMinPrestige(upgrade);
                const locked = minP > 0 && prestigeCount < minP;

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
                      {locked && <PrestigeLockBadge minPrestige={minP} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {shopTab === 'influencers' && (
            <div className="shop-items">
              <p className="shop-passive-hint">
                HUD passive <strong>{formatRate(passiveCloutPerSecond)}</strong> Clout/s — add up each talent row
                below; that sum matches the HUD (each row is <strong>all copies</strong> of that type, with structure
                buffs + prestige / followers / rep / gems / producer / feed surge). Catalog rates below include the{' '}
                <strong>×{PASSIVE_GLOBAL_MULT} passive balance</strong> per tile (no structures); raw engine values are{' '}
                <strong>~{formatRate(1 / PASSIVE_GLOBAL_MULT)}×</strong> higher.
              </p>
              {availableInfluencers.map(influencer => {
                const owned = influencers.filter(i => i.typeId === influencer.id).length;
                const raw = scaledUnitCost(influencer.cost, owned);
                const nextCost = Math.ceil(raw * costMult);
                const canAfford = clout >= nextCost;
                const isSelected = selectedTool?.type === 'influencer' && selectedTool?.id === influencer.id;
                const agencySlice =
                  owned > 0 ? (passiveByTalentType[influencer.id] ?? 0) : null;
                const minP = getMinPrestige(influencer);
                const locked = minP > 0 && prestigeCount < minP;

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
                            <>
                              <span className="item-stats-primary">
                                {formatRate(agencySlice)} Clout/s — all {owned} on grid → HUD
                              </span>
                              <div className="item-stats-base">
                                Tuned passive / tile: {formatRate(passiveCatalogTunedCps(influencer.baseCloutPerSecond))}{' '}
                                Clout/s each (includes ×{PASSIVE_GLOBAL_MULT} balance, no structures). Grid + roster
                                multipliers still apply on the HUD.
                              </div>
                            </>
                          ) : (
                            <>
                              {formatRate(passiveCatalogTunedCps(influencer.baseCloutPerSecond))} Clout/s tuned passive
                              per tile
                              <span className="item-stats-base">
                                {' '}
                                (×{PASSIVE_GLOBAL_MULT} balance) · structures + roster HUD × after hire
                              </span>
                            </>
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
                    {locked && <PrestigeLockBadge minPrestige={minP} />}
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
                const raw = scaledUnitCost(m.cost, owned);
                const nextCost = Math.ceil(raw * costMult);
                const canAfford = clout >= nextCost;
                const minP = getMinPrestige(m);
                const locked = minP > 0 && prestigeCount < minP;
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
                    {locked && <PrestigeLockBadge minPrestige={minP} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {shopTab === 'buildings' && (
            <>
              <p className="shop-buildings-hint">
                Range × applies to each <strong>in-range</strong> talent (Manhattan from footprint edge). Multiple{' '}
                <strong>same-type</strong> auras on one talent stack with a <strong>soft cap</strong> (extras add less
                than a full multiply). Later-era builds cost more per duplicate. Final HUD passive also applies{' '}
                <strong>×{PASSIVE_GLOBAL_MULT} passive balance</strong> plus prestige, followers, reputation, staff,
                and gems.
              </p>
              <div className="shop-items">
              {availableBuildings.map(building => {
                const owned = buildings.filter(b => b.typeId === building.id).length;
                const raw = scaledBuildingPlacementCost(building.cost, owned, building.requiredEra ?? 0);
                const nextCost = Math.ceil(raw * costMult);
                const canAfford = clout >= nextCost;
                const isSelected = selectedTool?.type === 'building' && selectedTool?.id === building.id;
                const minP = getMinPrestige(building);
                const locked = minP > 0 && prestigeCount < minP;

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
                    {locked && <PrestigeLockBadge minPrestige={minP} />}
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
