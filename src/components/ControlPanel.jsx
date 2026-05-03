import { useState, useEffect, useRef } from 'react';
import './ControlPanel.css';
import { isSfxMuted, setSfxMuted } from '../utils/sound';
import {
  prestigeEras,
  getPrestigeRunCloutRequired,
  PRESTIGE_RUN_CLOUT_MULT_PER_STEP,
  getActiveBrandDealSeasonPhase
} from '../data/gameData';
import { formatNumber, formatRate } from '../utils/formatNumber';
import { getFollowerBonusSummary } from '../utils/gameMath';

export const ControlPanel = ({
  clout,
  followers,
  reputation,
  prestigeCount,
  prestigeMultiplier,
  passiveCloutPerSecond,
  clickCloutPerClick,
  lifetimeClout,
  runCloutEarned,
  gems,
  staffCount,
  totalClicks,
  prestigeRunCloutRequired,
  activeFrenzy,
  onClickPostContent,
  onPrestige,
  onOpenShop,
  onOpenHowToPlay,
  onExportSave,
  onImportSave,
  onResetLocalSave
}) => {
  const [isClicking, setIsClicking] = useState(false);
  const [floaters, setFloaters] = useState([]);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [sfxMuted, setSfxMutedState] = useState(() => isSfxMuted());
  const importInputRef = useRef(null);

  useEffect(() => {
    if (!activeFrenzy) return;
    const tick = () => setNowMs(Date.now());
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [activeFrenzy]);

  const toggleSfx = () => {
    const next = !sfxMuted;
    setSfxMuted(next);
    setSfxMutedState(next);
  };

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
  const displayEra = Math.min(2, Math.floor(prestigeCount / 3));
  const currentEraData = prestigeEras[displayEra];
  const followerBonuses = getFollowerBonusSummary(followers);
  const dealSeason = getActiveBrandDealSeasonPhase();
  const nextRunReq = getPrestigeRunCloutRequired(prestigeCount + 1);
  const frenzyLive =
    activeFrenzy && nowMs < activeFrenzy.endsAt ? activeFrenzy : null;
  const frenzySecLeft = frenzyLive
    ? Math.max(0, Math.ceil((frenzyLive.endsAt - nowMs) / 1000))
    : 0;

  return (
    <div className="control-panel panel">
      <button type="button" className="how-to-side-link" onClick={onOpenHowToPlay}>
        How to play
      </button>

      <div className="save-data-row">
        <button type="button" className="save-data-btn" onClick={onExportSave}>
          Export save
        </button>
        <button type="button" className="save-data-btn" onClick={() => importInputRef.current?.click()}>
          Import save
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="save-file-input-hidden"
          aria-hidden
          tabIndex={-1}
          onChange={e => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            const reader = new FileReader();
            reader.onload = () => onImportSave(String(reader.result ?? ''));
            reader.readAsText(f);
          }}
        />
        <button type="button" className="save-data-btn sfx-toggle" onClick={toggleSfx} title="Mute prestige chime">
          SFX {sfxMuted ? 'off' : 'on'}
        </button>
      </div>
      <div className="save-data-row save-reset-row">
        <button
          type="button"
          className="save-data-btn save-reset-btn"
          title="Deletes save file + SFX preference in this browser only"
          onClick={() => {
            if (
              window.confirm(
                'Erase all local progress and settings (save + SFX mute) on this device? This cannot be undone.'
              )
            ) {
              onResetLocalSave();
            }
          }}
        >
          Reset local save
        </button>
      </div>
      {/* Theme label (cosmetic — scales with prestige depth; shop has no era locks) */}
      <div className="era-display" style={{ borderColor: currentEraData.theme.primary }}>
        <div className="era-name" style={{ color: currentEraData.theme.primary }}>
          {currentEraData.name}
        </div>
        <div className="era-description">{currentEraData.description}</div>
        <div className="era-theme-hint">Agency theme by prestige depth · all hires always available</div>
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
        <div className="rep-hint">
          Moves on <strong>brand deals</strong> only (+ clean partnerships, − risky ones). No separate Clout →
          Rep trade.
        </div>
        <div className="deal-season-hint" title="Weights rotate weekly (UTC). Brand Scouts amplify favored types.">
          This week’s deals: <strong>{dealSeason.label}</strong>
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
          title="Shortcut: Space or Enter (when not typing)"
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
        <div className="stat-row">
          <span>Staff hired:</span>
          <span>{staffCount.toLocaleString()}</span>
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
          title={canPrestige ? 'Shortcut: P' : undefined}
        >
          Prestige{' '}
          {canPrestige
            ? '✓'
            : `(${formatNumber(Math.max(0, required - runCloutEarned))} run clout)`}
        </button>
        <div className="prestige-hint">
          This run needs {formatNumber(required)} Clout to prestige. After you prestige, the <strong>next</strong>{' '}
          run’s bar is <strong>~{PRESTIGE_RUN_CLOUT_MULT_PER_STEP}×</strong> this run’s requirement (next:{' '}
          {formatNumber(nextRunReq)}). Resets this run (Clout, roster, builds, post upgrades, rep, clicks…). Keeps{' '}
          <strong>gems</strong> and <strong>Premium Shop 💎 upgrades</strong>, lifetime Clout, achievements. +20%
          permanent mult per prestige. +1 💎 per prestige, +1 extra every 4th.
        </div>
      </div>
    </div>
  );
};
