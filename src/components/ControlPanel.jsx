import { useState } from 'react';
import './ControlPanel.css';
import { prestigeEras, PRESTIGE_RUN_CLOUT_THRESHOLD } from '../data/gameData';
import { formatNumber, formatRate } from '../utils/formatNumber';

export const ControlPanel = ({
  clout,
  followers,
  reputation,
  currentEra,
  prestigeCount,
  prestigeMultiplier,
  reputationIncomeMultiplier,
  passiveCloutPerSecond,
  clickCloutPerClick,
  lifetimeClout,
  runCloutEarned,
  gems,
  totalClicks,
  onClickPostContent,
  onPrestige,
  onOpenShop,
  onOpenHowToPlay
}) => {
  const [isClicking, setIsClicking] = useState(false);
  const [floaters, setFloaters] = useState([]);

  const handleClick = () => {
    setIsClicking(true);
    onClickPostContent();
    const id = Date.now() + Math.random();
    setFloaters(prev => [...prev, { id, amount: clickCloutPerClick }]);
    setTimeout(() => setFloaters(prev => prev.filter(f => f.id !== id)), 600);
    setTimeout(() => setIsClicking(false), 100);
  };

  const canPrestige = runCloutEarned >= PRESTIGE_RUN_CLOUT_THRESHOLD;
  const runProgress = Math.min(1, runCloutEarned / PRESTIGE_RUN_CLOUT_THRESHOLD);
  const currentEraData = prestigeEras[currentEra];

  return (
    <div className="control-panel panel">
      <button type="button" className="how-to-side-link" onClick={onOpenHowToPlay}>
        How to play
      </button>
      {/* Era display */}
      <div className="era-display" style={{ borderColor: currentEraData.theme.primary }}>
        <div className="era-name" style={{ color: currentEraData.theme.primary }}>
          {currentEraData.name}
        </div>
        <div className="era-description">{currentEraData.description}</div>
        {prestigeCount > 0 && (
          <div className="prestige-info">
            Prestige Level: {prestigeCount} | Multiplier: {prestigeMultiplier.toFixed(1)}x
          </div>
        )}
      </div>

      <div className="clout-hero">
        <div className="clout-hero-label">Clout</div>
        <div className="clout-hero-value">{formatNumber(clout)}</div>
      </div>

      {/* Main stats */}
      <div className="main-stats">
        <div className="stat">
          <span className="stat-label">Followers</span>
          <span className="stat-value">{formatNumber(followers)}</span>
        </div>
        <div className="stat-row follower-hint">
          <span>Audience boosts clout & deal payouts; lowers hire/build cost.</span>
        </div>
        <div className="stat">
          <span className="stat-label">Reputation</span>
          <span className="stat-value">{Math.floor(reputation)}%</span>
        </div>
        <div className="stat-row reputation-impact">
          <span title="Applied to passive clout & each post. 100% = full baseline at maximum reputation score. Near 0% reputation you drop to ~55%.">
            Rep multiplier
          </span>
          <span>{(reputationIncomeMultiplier * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div className="economy-strip">
        <div className="economy-cell">
          <span className="economy-label">Agency / sec</span>
          <span className="economy-value passive">{formatRate(passiveCloutPerSecond)}</span>
        </div>
        <div className="economy-cell">
          <span className="economy-label">Per post</span>
          <span className="economy-value click">{formatRate(clickCloutPerClick)}</span>
        </div>
      </div>

      {/* Main click button */}
      <div className="post-button-wrap">
        {floaters.map(f => (
          <span key={f.id} className="click-float">
            +{formatRate(f.amount)}
          </span>
        ))}
        <button
          type="button"
          className={`post-button primary ${isClicking ? 'click-effect' : ''}`}
          onClick={handleClick}
        >
          Post Content
        </button>
      </div>

      {/* Secondary stats */}
      <div className="secondary-stats">
        <div className="stat-row">
          <span>Total Clicks:</span>
          <span>{totalClicks.toLocaleString()}</span>
        </div>
        <div className="stat-row">
          <span>Lifetime Clout (all-time):</span>
          <span>{formatNumber(lifetimeClout)}</span>
        </div>
        <div className="stat-row run-clout-row">
          <span>This run (prestige bar):</span>
          <span>
            {formatNumber(runCloutEarned)} / {formatNumber(PRESTIGE_RUN_CLOUT_THRESHOLD)}
          </span>
        </div>
        <div className="prestige-run-bar" aria-hidden>
          <div className="prestige-run-bar-fill" style={{ width: `${runProgress * 100}%` }} />
        </div>
        <div className="stat-row gems-row">
          <span>Gems:</span>
          <span>{gems} 💎</span>
        </div>
      </div>

      {/* Premium shop button */}
      <button
        className="premium-shop-button"
        onClick={onOpenShop}
      >
        💎 Premium Shop
      </button>

      {/* Prestige button */}
      <div className="prestige-section">
        <button
          className="prestige-button"
          onClick={onPrestige}
          disabled={!canPrestige}
        >
          Prestige{' '}
          {canPrestige
            ? '✓'
            : `(${formatNumber(Math.max(0, PRESTIGE_RUN_CLOUT_THRESHOLD - runCloutEarned))} run clout)`}
        </button>
        <div className="prestige-hint">
          Resets a run at {formatNumber(PRESTIGE_RUN_CLOUT_THRESHOLD)} this-run clout. Lifetime clout &
          gems stay. +45% permanent mult per prestige. +1 💎 per prestige, plus +1 extra every 4th prestige.
        </div>
      </div>
    </div>
  );
};
