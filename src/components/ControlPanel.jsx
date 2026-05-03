import { useState } from 'react';
import './ControlPanel.css';
import { prestigeEras, getPrestigeRunCloutRequired } from '../data/gameData';
import { formatNumber, formatRate } from '../utils/formatNumber';
import { getFollowerBonusSummary } from '../utils/gameMath';

export const ControlPanel = ({
  clout,
  followers,
  reputation,
  currentEra,
  prestigeCount,
  prestigeMultiplier,
  passiveCloutPerSecond,
  clickCloutPerClick,
  lifetimeClout,
  runCloutEarned,
  gems,
  totalClicks,
  prestigeRunCloutRequired,
  activeFrenzy,
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

  const required = prestigeRunCloutRequired ?? 1;
  const canPrestige = runCloutEarned >= required;
  const runProgress = Math.min(1, runCloutEarned / required);
  const currentEraData = prestigeEras[currentEra];
  const followerBonuses = getFollowerBonusSummary(followers);
  const nextRunReq = getPrestigeRunCloutRequired(prestigeCount + 1);
  const prestigeStepPct = Math.round((nextRunReq / Math.max(1, required) - 1) * 100);
  const frenzyLive =
    activeFrenzy && Date.now() < activeFrenzy.endsAt
      ? activeFrenzy
      : null;
  const frenzySecLeft = frenzyLive
    ? Math.max(0, Math.ceil((frenzyLive.endsAt - Date.now()) / 1000))
    : 0;

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
          <span>
            Followers: <strong>+{followerBonuses.cloutBonusPct}%</strong> all Clout ·{' '}
            <strong>−{followerBonuses.hireDiscountPct}%</strong> hire/build. They also nudge deal payouts and
            passive audience growth. Reputation shifts income &amp; deal quality.
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Reputation</span>
          <span className="stat-value">{Math.floor(reputation)}%</span>
        </div>
      </div>

      {frenzyLive && (
        <div
          className={`frenzy-banner ${frenzyLive.kind === 'passive_frenzy' ? 'frenzy-passive' : 'frenzy-click'}`}
        >
          <span className="frenzy-banner-label">
            {frenzyLive.kind === 'passive_frenzy' ? 'Feed surge' : 'Viral frenzy'}
          </span>
          <span className="frenzy-banner-mult">×{frenzyLive.multiplier.toFixed(1)}</span>
          <span className="frenzy-banner-time">{frenzySecLeft}s</span>
        </div>
      )}

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
            {formatNumber(runCloutEarned)} / {formatNumber(required)}
          </span>
        </div>
        <div className="prestige-run-bar" aria-hidden>
          <div className="prestige-run-bar-fill" style={{ width: `${runProgress * 100}%` }} />
        </div>
        <div className="stat-row gems-row">
          <span>Gems:</span>
          <span>{gems.toLocaleString()} 💎</span>
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
            : `(${formatNumber(Math.max(0, required - runCloutEarned))} run clout)`}
        </button>
        <div className="prestige-hint">
          This run needs {formatNumber(required)} Clout to prestige. After your next prestige, the following run’s
          bar jumps ~{prestigeStepPct}% vs this run’s requirement (extra super-linear scaling at higher prestige
          depth). Lifetime clout &amp; gems stay. +45% permanent mult per prestige. +1 💎 per prestige, +1 extra
          every 4th.
        </div>
      </div>
    </div>
  );
};
