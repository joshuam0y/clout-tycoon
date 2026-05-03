import { useState } from 'react';
import './ShopPanel.css';
import { influencerTypes, buildingTypes, clickUpgradeTypes } from '../data/gameData';
import { scaledUnitCost, clickUpgradeNextCost, getFollowerCostMult } from '../utils/gameMath';
import { formatNumber, formatRate } from '../utils/formatNumber';

const TABS = [
  { id: 'upgrades', label: 'Posts' },
  { id: 'influencers', label: 'Talent' },
  { id: 'buildings', label: 'Builds' }
];

export const ShopPanel = ({
  clout,
  followers,
  currentEra,
  selectedTool,
  onSelectTool,
  influencers,
  buildings,
  clickUpgradeLevels,
  onBuyClickUpgrade
}) => {
  const [shopTab, setShopTab] = useState('upgrades');
  const costMult = getFollowerCostMult(followers);
  const discountPct = Math.round((1 - costMult) * 100);

  const availableInfluencers = influencerTypes.filter(i => i.requiredEra <= currentEra);
  const availableBuildings = buildingTypes.filter(b => b.requiredEra <= currentEra);

  return (
    <div className="shop-panel panel">
      <div className="shop-inner">
        <div className="shop-title-row">
          <h2 className="shop-title">Agency Shop</h2>
        </div>
        <p className="shop-tagline">
          +18% cost per duplicate. Same item, pricier each time.
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
              type="button"
              role="tab"
              aria-selected={shopTab === tab.id}
              className={`shop-tab ${shopTab === tab.id ? 'active' : ''}`}
              onClick={() => setShopTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="shop-tab-panel" role="tabpanel" aria-label={TABS.find(t => t.id === shopTab)?.label}>
          {shopTab === 'upgrades' && (
            <div className="shop-upgrades">
              {clickUpgradeTypes.map(upgrade => {
                const level = clickUpgradeLevels[upgrade.id] ?? 0;
                const cost = clickUpgradeNextCost(upgrade, level);
                const canAfford = clout >= cost;

                return (
                  <button
                    key={upgrade.id}
                    type="button"
                    className={`shop-upgrade ${!canAfford ? 'disabled' : ''}`}
                    onClick={() => onBuyClickUpgrade(upgrade.id)}
                    disabled={!canAfford}
                  >
                    <div className="upgrade-top">
                      <span className="upgrade-name">{upgrade.name}</span>
                      <span className="upgrade-level">Lv.{level}</span>
                    </div>
                    <div className="upgrade-desc">{upgrade.description}</div>
                    <div className={`upgrade-cost ${canAfford ? 'afford' : ''}`}>
                      {formatNumber(cost)} Clout
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
                const raw = scaledUnitCost(influencer.cost, owned);
                const nextCost = Math.ceil(raw * costMult);
                const canAfford = clout >= nextCost;
                const isSelected = selectedTool?.type === 'influencer' && selectedTool?.id === influencer.id;

                return (
                  <button
                    key={influencer.id}
                    type="button"
                    className={`shop-item ${isSelected ? 'selected' : ''} ${!canAfford ? 'disabled' : ''}`}
                    onClick={() => onSelectTool({ type: 'influencer', id: influencer.id })}
                    disabled={!canAfford}
                    style={{
                      borderColor: influencer.color,
                      boxShadow: isSelected ? `0 0 20px ${influencer.color}` : 'none'
                    }}
                  >
                    <div className="item-header">
                      <span className="item-icon" style={{ textShadow: `0 0 10px ${influencer.color}` }}>
                        {influencer.icon}
                      </span>
                      <div className="item-info">
                        <div className="item-name">{influencer.name}</div>
                        <div className="item-stats">{formatRate(influencer.baseCloutPerSecond)}/s passive</div>
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
                  </button>
                );
              })}
            </div>
          )}

          {shopTab === 'buildings' && (
            <div className="shop-items">
              {availableBuildings.map(building => {
                const owned = buildings.filter(b => b.typeId === building.id).length;
                const raw = scaledUnitCost(building.cost, owned);
                const nextCost = Math.ceil(raw * costMult);
                const canAfford = clout >= nextCost;
                const isSelected = selectedTool?.type === 'building' && selectedTool?.id === building.id;

                return (
                  <button
                    key={building.id}
                    type="button"
                    className={`shop-item ${isSelected ? 'selected' : ''} ${!canAfford ? 'disabled' : ''}`}
                    title={`Footprint ${building.size}×${building.size} tiles · Buff radius ${building.range} (Manhattan from edge) · ×${building.multiplier} talent in range`}
                    onClick={() => onSelectTool({ type: 'building', id: building.id })}
                    disabled={!canAfford}
                    style={{
                      borderColor: building.color,
                      boxShadow: isSelected ? `0 0 20px ${building.color}` : 'none'
                    }}
                  >
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
                  </button>
                );
              })}
            </div>
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
