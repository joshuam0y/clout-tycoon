import { useState, useEffect } from 'react';
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

function formatSaveAge(ts) {
  if (ts == null) return '…';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 4) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 120) return `${m}m ago`;
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

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
  namedSaveSlots = [],
  activeProfileName = '',
  lastProfileSyncAt = null,
  onSaveNamed,
  onLoadNamed,
  onDeleteNamedSave,
  onClearProfileBackup,
  onResetLocalSave
}) => {
  const [isClicking, setIsClicking] = useState(false);
  const [floaters, setFloaters] = useState([]);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [sfxMuted, setSfxMutedState] = useState(() => isSfxMuted());
  const [saveNameInput, setSaveNameInput] = useState('');
  const [loadPick, setLoadPick] = useState('');
  const [syncAgeTick, setSyncAgeTick] = useState(0);

  useEffect(() => {
    if (!lastProfileSyncAt) return undefined;
    const id = window.setInterval(() => setSyncAgeTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [lastProfileSyncAt]);

  useEffect(() => {
    if (activeProfileName && namedSaveSlots.some(s => s.name === activeProfileName)) {
      setLoadPick(prev => (prev === '' ? activeProfileName : prev));
    }
  }, [activeProfileName, namedSaveSlots]);

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

      <section className="save-profile-card" aria-label="Save and profile">
        <header className="save-profile-header">
          <h2 className="save-profile-title">Your agency</h2>
          {activeProfileName ? (
            <p className="save-profile-welcome">
              Welcome back, <span className="save-profile-name">{activeProfileName}</span>
            </p>
          ) : (
            <p className="save-profile-welcome save-profile-welcome--muted">
              Save under a name to turn on automatic backups to that slot (this browser only).
            </p>
          )}
        </header>

        <div className="save-profile-status">
          <span
            className={`save-status-pulse ${activeProfileName ? 'save-status-pulse--on' : ''}`}
            aria-hidden
          />
          <div className="save-profile-status-text">
            {activeProfileName ? (
              <>
                <span
                  className="save-age-line"
                  aria-live="polite"
                  data-sync-tick={syncAgeTick}
                >
                  {formatSaveAge(lastProfileSyncAt)}
                  <span className="save-age-hint"> · named slot</span>
                </span>
                <button
                  type="button"
                  className="save-stop-backup"
                  onClick={() => {
                    if (
                      window.confirm(
                        'Stop auto-backup to this named slot? Your named save stays in the list — only automatic updates pause.'
                      )
                    ) {
                      onClearProfileBackup();
                      if (loadPick === activeProfileName) setLoadPick('');
                    }
                  }}
                >
                  Stop auto-backup
                </button>
              </>
            ) : (
              <span>
                Session autosaves continuously. Named profiles add an extra copy every few seconds once you save one.
              </span>
            )}
          </div>
        </div>

        <div className="save-profile-grid">
          <div className="save-profile-field">
            <label className="save-field-label" htmlFor="named-save-input">
              Save / update profile
            </label>
            <div className="save-field-row">
              <input
                id="named-save-input"
                type="text"
                className="save-field-input"
                placeholder="e.g. Main campaign"
                value={saveNameInput}
                maxLength={80}
                autoComplete="off"
                onChange={e => setSaveNameInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (onSaveNamed(saveNameInput)) setSaveNameInput('');
                  }
                }}
              />
              <button
                type="button"
                className="save-primary-btn"
                onClick={() => {
                  if (onSaveNamed(saveNameInput)) setSaveNameInput('');
                }}
              >
                Save
              </button>
            </div>
          </div>

          <div className="save-profile-field">
            <label className="save-field-label" htmlFor="named-load-select">
              Load profile
            </label>
            <div className="save-field-row save-field-row--wrap">
              <select
                id="named-load-select"
                className="save-field-select"
                value={loadPick}
                onChange={e => setLoadPick(e.target.value)}
                aria-label="Choose a saved profile"
              >
                <option value="">Select…</option>
                {namedSaveSlots.map(s => (
                  <option key={s.name} value={s.name}>
                    {s.name} · {new Date(s.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{' '}
                    {new Date(s.savedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </option>
                ))}
              </select>
              <div className="save-load-actions">
                <button
                  type="button"
                  className="save-secondary-btn"
                  disabled={!loadPick}
                  onClick={() => onLoadNamed(loadPick)}
                >
                  Load
                </button>
                <button
                  type="button"
                  className="save-danger-btn"
                  disabled={!loadPick}
                  title="Remove this slot from this browser"
                  onClick={() => {
                    if (!loadPick) return;
                    if (window.confirm(`Delete “${loadPick}” from this browser?`)) {
                      onDeleteNamedSave(loadPick);
                      setLoadPick('');
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="save-profile-toolbar">
          <button
            type="button"
            className="save-toolbar-btn"
            onClick={toggleSfx}
            title="Mute prestige chime"
          >
            Sound {sfxMuted ? 'off' : 'on'}
          </button>
          <button
            type="button"
            className="save-toolbar-btn save-toolbar-btn--danger"
            title="Clears this session’s autosave and sound preference. Named slots stay until you delete them."
            onClick={() => {
              if (
                window.confirm(
                  'Reset this session’s autosave and sound toggle? Named profiles in the list are kept. This cannot be undone.'
                )
              ) {
                onResetLocalSave();
              }
            }}
          >
            Reset session
          </button>
        </div>
      </section>
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
        <div className="stat-row" title="Post Content &amp; shortcuts only — staff auto-posts excluded">
          <span>Manual posts:</span>
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
