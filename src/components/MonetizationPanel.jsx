import { useState, useEffect, useRef } from 'react';
import './MonetizationPanel.css';
import { formatNumber, formatIntegerExact, formatRate } from '../utils/formatNumber';

function utcToday() {
  return new Date().toISOString().slice(0, 10);
}

function MarketNoiseBlock({ onMarketInject }) {
  return (
    <div className="market-inline market-inline--scroll">
      <h4 className="market-noise-title">Press cycle — instant Clout</h4>
      <p className="section-description small market-noise-desc">
        Spend gems for a simulated press push. Payout scales with your passive Clout/s (same idea as Clout Surge,
        but you pick the headline tier).
      </p>
      <div className="market-buttons">
        <button type="button" className="sabotage-button" onClick={() => onMarketInject(50, 'Buzz')}>
          Buzz — 50 💎
        </button>
        <button type="button" className="sabotage-button" onClick={() => onMarketInject(120, 'Trend hijack')}>
          Trend hijack — 120 💎
        </button>
        <button type="button" className="sabotage-button" onClick={() => onMarketInject(200, 'Full blitz')}>
          Full blitz — 200 💎
        </button>
      </div>
    </div>
  );
}

export const MonetizationPanel = ({
  onClose,
  deferEscapeClose = false,
  gems,
  gemCloutMultStacks,
  gemClickMultStacks = 0,
  gemPassiveMultStacks = 0,
  maxGemCloutStacks,
  maxGemClickStacks = 12,
  maxGemPassiveStacks = 12,
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
  onMarketInject,
  dailyReward = { lastClaimUtcDay: '', streak: 0, bestStreak: 0 },
  onClaimDaily = () => false,
  onBuyReputationPolish = () => false,
  onBuySpotlightRush = () => false,
  spotlightRushCost = 55,
  reputationPolishCost = 32,
  reputation = 100,
  onSellReputationForFollowers = () => false,
  repFollowersTrade = { repCost: 12, minReputationAfter: 12 }
}) => {
  const [activeTab, setActiveTab] = useState('gems');
  const [isPulling, setIsPulling] = useState(false);
  const closeButtonRef = useRef(null);

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

  const repTradeNeed = repFollowersTrade.minReputationAfter + repFollowersTrade.repCost;
  const canRepTrade = reputation >= repTradeNeed;

  const todayUtc = utcToday();
  const claimedToday = dailyReward.lastClaimUtcDay === todayUtc;
  const streak = dailyReward.streak ?? 0;
  const bestStreak = dailyReward.bestStreak ?? 0;

  useEffect(() => {
    const onKey = e => {
      if (e.code !== 'Escape' || e.repeat) return;
      if (deferEscapeClose) return;
      e.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose, deferEscapeClose]);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return (
    <div className="monetization-overlay" role="dialog" aria-labelledby="premium-shop-title">
      <div className="monetization-panel panel-purple">
        <div className="monetization-header">
          <div className="monetization-header-text">
            <h2 id="premium-shop-title">Premium Shop</h2>
            <p className="premium-tagline">
              Gems &amp; stacks persist through prestige · this build uses free test packs (no card)
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="close-button"
            onClick={onClose}
            aria-label="Close Premium Shop"
          >
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
            className={`tab ${activeTab === 'daily' ? 'active' : ''}`}
            onClick={() => setActiveTab('daily')}
          >
            Daily
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
              <h3>Top up</h3>
              <p className="gem-early-hook">
                <strong>Why bother early?</strong> A small gem stack buys <strong>Syndicate</strong> (+% all Clout)
                and a <strong>Clout Surge</strong> or <strong>Viral Drop</strong> — that combo usually beats hours of
                raw clicking before your first prestige. Trophies and the <strong>Daily</strong> tab also drip free
                gems if you prefer not to use the test packs.
              </p>
              <p className="section-description">
                Simulated storefront — no real card charge here. In the live game these would be impulse buys that
                skip a week of grinding; in this build the packs are <strong>free test buttons</strong> so you can
                feel the power curve.
              </p>
              <div className="gem-packs">
                <button type="button" className="gem-pack" onClick={() => onGrantGemPack(45)}>
                  <span className="gem-pack-ribbon gem-pack-ribbon--soft">Warm up</span>
                  <span className="gem-pack-strike">~~$4.99~~</span>
                  <span className="gem-pack-main">+45 💎</span>
                  <span className="gem-pack-sub">First sponsor call unlocked</span>
                </button>
                <button type="button" className="gem-pack primary-pack" onClick={() => onGrantGemPack(120)}>
                  <span className="gem-pack-ribbon gem-pack-ribbon--hot">Best value</span>
                  <span className="gem-pack-strike">~~$14.99~~</span>
                  <span className="gem-pack-main">+120 💎</span>
                  <span className="gem-pack-sub">Enough for a Syndicate stack + Surge</span>
                </button>
                <button type="button" className="gem-pack gem-pack--whale" onClick={() => onGrantGemPack(350)}>
                  <span className="gem-pack-ribbon gem-pack-ribbon--gold">Whale lane</span>
                  <span className="gem-pack-strike">~~$39.99~~</span>
                  <span className="gem-pack-main">+350 💎</span>
                  <span className="gem-pack-sub">Blitz gacha + permanent stacks fast</span>
                </button>
              </div>
              <div className="gem-uses-hint">
                <strong>Spend gems on:</strong> permanent Syndicate / Creator / Spotlight lines, timed spotlight
                rush, reputation polish, Clout Surge, Viral Drops, and press injections — all tuned to stay strong
                across many prestiges.
              </div>
            </div>
          )}

          {activeTab === 'daily' && (
            <div className="daily-section">
              <h3>Daily brief</h3>
              <p className="section-description">
                One claim per UTC day. Streaks ramp the payout and feed the <strong>Check-in Week</strong> trophy.
              </p>
              <div className="daily-card">
                <div className="daily-row">
                  <span>Current streak</span>
                  <strong>{streak}</strong>
                </div>
                <div className="daily-row">
                  <span>Best streak</span>
                  <strong>{bestStreak}</strong>
                </div>
                <div className="daily-row">
                  <span>Today (UTC)</span>
                  <strong>{todayUtc}</strong>
                </div>
                <button
                  type="button"
                  className="daily-claim-btn"
                  disabled={claimedToday}
                  onClick={() => onClaimDaily()}
                >
                  {claimedToday ? 'Come back tomorrow' : 'Claim today’s brief'}
                </button>
                {!claimedToday && (
                  <p className="daily-foot">
                    Next pack scales with streak · big bonuses at 7+, 14+, and 30+ day chains.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'boosts' && (
            <div className="boosts-section">
              <h3>Boosts &amp; sinks</h3>
              <p className="section-description">
                <strong>Gem rows</strong> below are permanent or timed buffs. <strong>Hype trade</strong> costs
                reputation only — good when you are deep in rep and want followers faster. Scroll to the bottom of
                this tab for <strong>press injections</strong> (gem → instant Clout).
              </p>

              <div className="hype-trade-card">
                <div className="hype-trade-head">
                  <span className="hype-trade-icon" aria-hidden>
                    📰
                  </span>
                  <div>
                    <h4 className="hype-trade-title">Hype trade (no gems)</h4>
                    <p className="hype-trade-desc">
                      Lose <strong>{repFollowersTrade.repCost}%</strong> reputation for a follower spike. Keeps at
                      least <strong>{repFollowersTrade.minReputationAfter}%</strong> so you can still sign deals.
                      Low rep still hurts income — same as risky sponsors.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="hype-trade-btn"
                  disabled={!canRepTrade}
                  onClick={() => onSellReputationForFollowers()}
                >
                  {canRepTrade
                    ? `Trade −${repFollowersTrade.repCost}% rep for followers`
                    : `Need ${repTradeNeed}%+ rep`}
                </button>
              </div>

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
                    <span className="boost-icon">✨</span>
                    <div className="boost-info">
                      <h4>PR polish</h4>
                      <p>
                        +18 reputation (caps at 100%) — dig out of risky deal spirals without burning a whole run.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="boost-buy"
                    onClick={onBuyReputationPolish}
                    disabled={gems < reputationPolishCost}
                  >
                    {reputationPolishCost} 💎
                  </button>
                </div>

                <div className="boost-item">
                  <div className="boost-header">
                    <span className="boost-icon">🎆</span>
                    <div className="boost-info">
                      <h4>Spotlight rush</h4>
                      <p>
                        ~90s of ×1.22 passive on the grid — stacks with buildings, producers, and feed surges.{' '}
                        {formatRate(passiveCloutPerSecond)}/s baseline now.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="boost-buy"
                    onClick={onBuySpotlightRush}
                    disabled={gems < spotlightRushCost || passiveCloutPerSecond <= 0}
                  >
                    {spotlightRushCost} 💎
                  </button>
                </div>

                <div className="boost-item">
                  <div className="boost-header">
                    <span className="boost-icon">⚡</span>
                    <div className="boost-info">
                      <h4>Clout Surge</h4>
                      <p>
                        Instantly gain ~72 seconds of passive at your current rate (
                        {formatRate(passiveCloutPerSecond)}/s).
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

              <MarketNoiseBlock onMarketInject={onMarketInject} />
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
                  <span className="gacha-btn-title">Single pull</span>
                  <span className="gacha-btn-meta">{gachaCosts.single} 💎 · taste the algorithm</span>
                </button>
                <button
                  type="button"
                  className="gacha-button"
                  onClick={() => handleGacha(true)}
                  disabled={isPulling || gems < gachaCosts.multi}
                >
                  <span className="gacha-btn-title">10× bundle</span>
                  <span className="gacha-btn-meta">
                    {gachaCosts.multi} 💎 · ~{Math.round((gachaCosts.multi / gachaCosts.single) * 10) / 10}× value vs
                    singles
                  </span>
                </button>
              </div>

              <MarketNoiseBlock onMarketInject={onMarketInject} />
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

        <div className="premium-currency">
          <span className="currency-label">Gems</span>
          <span className="currency-value" title={formatIntegerExact(gems)}>
            {formatNumber(gems)} 💎
          </span>
          <button type="button" className="buy-currency" onClick={() => setActiveTab('gems')}>
            Get gems
          </button>
        </div>
      </div>
    </div>
  );
};
