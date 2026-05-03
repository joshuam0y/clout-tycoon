import { useState } from 'react';
import './MonetizationPanel.css';
import { formatNumber } from '../utils/formatNumber';

export const MonetizationPanel = ({
  onClose,
  gems,
  gemCloutMultStacks,
  maxGemCloutStacks,
  passiveCloutPerSecond,
  achievementDefs,
  achievementsUnlocked,
  gachaCosts,
  gemEconomy,
  onBuyGemStack,
  onBuyGemClickStack,
  onBuyGemPassiveStack,
  onCloutSurge,
  onGachaPull,
  onGrantGemPack,
  onMarketInject
}) => {
  const [activeTab, setActiveTab] = useState('gems');
  const [isPulling, setIsPulling] = useState(false);

  const handleGacha = multi => {
    if (gems < (multi ? gachaCosts.multi : gachaCosts.single)) return;
    setIsPulling(true);
    setTimeout(() => {
      onGachaPull(multi);
      setIsPulling(false);
    }, 900);
  };

  const syndicatePct = (gemCloutMultStacks * gemEconomy.stackBonus * 100).toFixed(0);
  const creatorPct = (gemClickMultStacks * gemEconomy.clickBonus * 100).toFixed(0);
  const spotlightPct = (gemPassiveMultStacks * gemEconomy.passiveBonus * 100).toFixed(0);
  const syndicateNextCost =
    gemCloutMultStacks >= maxGemCloutStacks
      ? null
      : gemEconomy.syndicateCostBase + gemCloutMultStacks * gemEconomy.syndicateCostPerOwned;
  const clickNextCost =
    gemClickMultStacks >= maxGemClickStacks
      ? null
      : gemEconomy.clickCostBase + gemClickMultStacks * gemEconomy.clickCostPerOwned;
  const passiveNextCost =
    gemPassiveMultStacks >= maxGemPassiveStacks
      ? null
      : gemEconomy.passiveCostBase + gemPassiveMultStacks * gemEconomy.passiveCostPerOwned;

  return (
    <div className="monetization-overlay" role="dialog" aria-labelledby="premium-shop-title">
      <div className="monetization-panel panel-purple">
        <div className="monetization-header">
          <h2 id="premium-shop-title">Premium Shop</h2>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="monetization-tabs">
          <button
            type="button"
            className={`tab ${activeTab === 'gems' ? 'active' : ''}`}
            onClick={() => setActiveTab('gems')}
          >
            Gems
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'boosts' ? 'active' : ''}`}
            onClick={() => setActiveTab('boosts')}
          >
            Boosts
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'gacha' ? 'active' : ''}`}
            onClick={() => setActiveTab('gacha')}
          >
            Drops
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            Trophies
          </button>
        </div>

        <div className="monetization-content">
          {activeTab === 'gems' && (
            <div className="gems-section">
              <h3>Get Gems</h3>
              <p className="section-description">
                Gems are earned in-game from prestige and achievements. Purchases below simulate topping
                up — no real payment is processed in this build.
              </p>
              <div className="gem-packs">
                <button type="button" className="gem-pack" onClick={() => onGrantGemPack(45)}>
                  +45 💎
                  <span className="gem-pack-sub">Starter</span>
                </button>
                <button type="button" className="gem-pack primary-pack" onClick={() => onGrantGemPack(120)}>
                  +120 💎
                  <span className="gem-pack-sub">Creator</span>
                </button>
                <button type="button" className="gem-pack" onClick={() => onGrantGemPack(350)}>
                  +350 💎
                  <span className="gem-pack-sub">Agency</span>
                </button>
              </div>
              <div className="gem-uses-hint">
                <strong>What gems do:</strong> three permanent stack lines (all clout, post-only, passive-only),
                instant surges, viral drops, and market injections. Stacks survive prestige and scale with your
                account — meant for long runs across many resets.
              </div>
            </div>
          )}

          {activeTab === 'boosts' && (
            <div className="boosts-section">
              <h3>Spend Gems</h3>
              <p className="section-description">
                Permanent stacks never reset on prestige. Syndicate buffs everything; Creator and Spotlight split
                power so you can specialize. Costs rise slightly per stack.
              </p>

              <div className="boost-items">
                <div className="boost-item">
                  <div className="boost-header">
                    <span className="boost-icon">🏙️</span>
                    <div className="boost-info">
                      <h4>Syndicate (+{gemEconomy.stackBonus * 100}% all Clout)</h4>
                      <p>
                        Posts, passive, deals. {gemCloutMultStacks}/{maxGemCloutStacks} (+{syndicatePct}% total).
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="boost-buy"
                    onClick={onBuyGemStack}
                    disabled={gemCloutMultStacks >= maxGemCloutStacks || !syndicateNextCost || gems < syndicateNextCost}
                  >
                    {syndicateNextCost ?? '—'} 💎
                  </button>
                </div>

                <div className="boost-item">
                  <div className="boost-header">
                    <span className="boost-icon">📣</span>
                    <div className="boost-info">
                      <h4>Creator Kit (+{gemEconomy.clickBonus * 100}% post Clout)</h4>
                      <p>
                        Post Content only — great if you like active play. {gemClickMultStacks}/
                        {maxGemClickStacks} (+{creatorPct}% total).
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="boost-buy"
                    onClick={onBuyGemClickStack}
                    disabled={gemClickMultStacks >= maxGemClickStacks || !clickNextCost || gems < clickNextCost}
                  >
                    {clickNextCost ?? '—'} 💎
                  </button>
                </div>

                <div className="boost-item">
                  <div className="boost-header">
                    <span className="boost-icon">🎭</span>
                    <div className="boost-info">
                      <h4>Spotlight (+{gemEconomy.passiveBonus * 100}% passive Clout)</h4>
                      <p>
                        Talent on the grid only — stacks with buildings. {gemPassiveMultStacks}/
                        {maxGemPassiveStacks} (+{spotlightPct}% total).
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="boost-buy"
                    onClick={onBuyGemPassiveStack}
                    disabled={
                      gemPassiveMultStacks >= maxGemPassiveStacks || !passiveNextCost || gems < passiveNextCost
                    }
                  >
                    {passiveNextCost ?? '—'} 💎
                  </button>
                </div>

                <div className="boost-item">
                  <div className="boost-header">
                    <span className="boost-icon">⚡</span>
                    <div className="boost-info">
                      <h4>Clout Surge</h4>
                      <p>
                        Instantly gain ~72 seconds of passive at your current rate (
                        {formatNumber(passiveCloutPerSecond)}/s).
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="boost-buy"
                    onClick={onCloutSurge}
                    disabled={gems < gemEconomy.surgeCost || passiveCloutPerSecond <= 0}
                  >
                    {gemEconomy.surgeCost} 💎
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gacha' && (
            <div className="gacha-section">
              <h3>Viral Drops</h3>
              <p className="section-description">
                Spend gems for bundled clout based on your passive output — stronger when your agency is
                already humming.
              </p>

              <div className={`gacha-machine ${isPulling ? 'pulling' : ''}`}>
                <div className="gacha-display">
                  {isPulling ? (
                    <div className="gacha-animation">
                      <div className="spinner" />
                      <p>Routing hype...</p>
                    </div>
                  ) : (
                    <div className="gacha-prompt">
                      <span className="gacha-icon">📣</span>
                      <p>Ready when you are.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="gacha-options">
                <button
                  type="button"
                  className="gacha-button primary"
                  onClick={() => handleGacha(false)}
                  disabled={isPulling || gems < gachaCosts.single}
                >
                  Single ({gachaCosts.single} 💎)
                </button>
                <button
                  type="button"
                  className="gacha-button"
                  onClick={() => handleGacha(true)}
                  disabled={isPulling || gems < gachaCosts.multi}
                >
                  10× ({gachaCosts.multi} 💎)
                </button>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="achievements-section">
              <h3>Trophies</h3>
              <p className="section-description">Complete goals to earn free gems.</p>
              <ul className="achievement-list">
                {achievementDefs.map(def => {
                  const done = !!achievementsUnlocked[def.id];
                  return (
                    <li key={def.id} className={`achievement-row ${done ? 'done' : ''}`}>
                      <span className="ach-icon">{done ? '✓' : '○'}</span>
                      <div className="ach-body">
                        <div className="ach-name">{def.name}</div>
                        <div className="ach-desc">{def.description}</div>
                      </div>
                      <span className="ach-reward">+{def.gemReward} 💎</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {activeTab !== 'gems' && activeTab !== 'achievements' && (
          <div className="market-inline">
            <h4>Market noise (clout injection)</h4>
            <p className="section-description small">
              Spend gems to simulate a press cycle — payout scales with your passive clout/sec.
            </p>
            <div className="market-buttons">
              <button type="button" className="sabotage-button" onClick={() => onMarketInject(50, 'Buzz')}>
                Buzz (50 💎)
              </button>
              <button
                type="button"
                className="sabotage-button"
                onClick={() => onMarketInject(120, 'Trend hijack')}
              >
                Trend hijack (120 💎)
              </button>
              <button
                type="button"
                className="sabotage-button"
                onClick={() => onMarketInject(200, 'Full blitz')}
              >
                Full blitz (200 💎)
              </button>
            </div>
          </div>
        )}

        <div className="premium-currency">
          <span className="currency-label">Gems</span>
          <span className="currency-value">{gems} 💎</span>
          <button type="button" className="buy-currency" onClick={() => setActiveTab('gems')}>
            Get gems
          </button>
        </div>
      </div>
    </div>
  );
};
