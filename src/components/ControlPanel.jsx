import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './ControlPanel.css';
import { isSfxMuted, setSfxMuted } from '../utils/sound';
import { serializeNamedSaveForExport } from '../utils/persistence';
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

function formatSlotSummaryPreview(p, fmt) {
  if (!p) return 'No snapshot preview.';
  return `Prestige ${p.prestigeCount} · ${fmt(p.lifetimeClout)} lifetime Clout · ${p.gems} gems · ${fmt(p.clout)} banked · ${p.influencerCount} talent · ${p.buildingCount} builds`;
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
  onResetLocalSave,
  onImportNamedSave = () => false,
  saveVaultHotkeyActive = true,
  onSaveVaultOpenChange
}) => {
  const [isClicking, setIsClicking] = useState(false);
  const [floaters, setFloaters] = useState([]);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [sfxMuted, setSfxMutedState] = useState(() => isSfxMuted());
  const [saveNameInput, setSaveNameInput] = useState('');
  const [saveVaultOpen, setSaveVaultOpen] = useState(false);
  const [saveVaultSearch, setSaveVaultSearch] = useState('');
  const [importDraft, setImportDraft] = useState('');
  const [vaultMessage, setVaultMessage] = useState('');
  const importFileRef = useRef(null);
  const [syncAgeTick, setSyncAgeTick] = useState(0);

  useEffect(() => {
    if (!lastProfileSyncAt) return undefined;
    const id = window.setInterval(() => setSyncAgeTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [lastProfileSyncAt]);

  useEffect(() => {
    if (!vaultMessage) return undefined;
    const id = window.setTimeout(() => setVaultMessage(''), 2800);
    return () => window.clearTimeout(id);
  }, [vaultMessage]);

  useEffect(() => {
    onSaveVaultOpenChange?.(saveVaultOpen);
  }, [saveVaultOpen, onSaveVaultOpenChange]);

  useEffect(() => {
    if (!saveVaultHotkeyActive || saveVaultOpen) return undefined;
    const onKey = e => {
      if (e.code !== 'Slash' || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const t = e.target;
      if (t instanceof HTMLElement) {
        const tag = t.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      }
      e.preventDefault();
      setSaveVaultOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saveVaultHotkeyActive, saveVaultOpen]);

  useEffect(() => {
    if (!saveVaultOpen) return undefined;
    const onEsc = e => {
      if (e.code !== 'Escape' || e.repeat) return;
      e.preventDefault();
      setSaveVaultOpen(false);
      setSaveVaultSearch('');
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [saveVaultOpen]);

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

  const filteredSaveSlots = namedSaveSlots.filter(s =>
    s.name.toLowerCase().includes(saveVaultSearch.trim().toLowerCase())
  );

  const saveVaultPortal =
    saveVaultOpen &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        className="save-vault-backdrop"
        role="presentation"
        onClick={() => {
          setSaveVaultOpen(false);
          setSaveVaultSearch('');
        }}
      >
        <div
          className="save-vault-modal panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-vault-title"
          onClick={e => e.stopPropagation()}
        >
          <header className="save-vault-head">
            <h2 id="save-vault-title" className="save-vault-title">
              Manage saves
            </h2>
            <button
              type="button"
              className="save-vault-close"
              aria-label="Close save manager"
              onClick={() => {
                setSaveVaultOpen(false);
                setSaveVaultSearch('');
              }}
            >
              ×
            </button>
          </header>
          {vaultMessage ? <div className="save-vault-toast">{vaultMessage}</div> : null}
          <label className="save-vault-search-label" htmlFor="save-vault-filter">
            Filter
          </label>
          <input
            id="save-vault-filter"
            type="search"
            className="save-vault-search"
            placeholder="Filter by profile name…"
            value={saveVaultSearch}
            onChange={e => setSaveVaultSearch(e.target.value)}
            autoComplete="off"
          />
          <div className="save-vault-list">
            {filteredSaveSlots.length === 0 ? (
              <p className="save-vault-empty">
                {namedSaveSlots.length === 0
                  ? 'No named saves yet — use Save / update profile above.'
                  : 'No saves match this filter.'}
              </p>
            ) : (
              filteredSaveSlots.map(slot => (
                <article
                  key={slot.name}
                  className={`save-vault-card${slot.name === activeProfileName ? ' save-vault-card--active' : ''}`}
                >
                  <div className="save-vault-card-top">
                    <h3 className="save-vault-card-name">{slot.name}</h3>
                    {slot.name === activeProfileName ? (
                      <span className="save-vault-badge">Auto-backup</span>
                    ) : null}
                  </div>
                  <div className="save-vault-card-time">
                    Saved {formatSaveAge(slot.savedAt)}
                    {slot.savedAt > 0 ? (
                      <span className="save-vault-card-time-abs">
                        {' '}
                        · {new Date(slot.savedAt).toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                  <p className="save-vault-card-preview">{formatSlotSummaryPreview(slot.preview, formatNumber)}</p>
                  <div className="save-vault-card-actions">
                    <button
                      type="button"
                      className="save-secondary-btn"
                      onClick={() => {
                        const summary = formatSlotSummaryPreview(slot.preview, formatNumber);
                        if (
                          window.confirm(
                            `Load “${slot.name}”?\n\n${summary}\n\nThis tab will reload; unsaved session progress is lost unless you saved first.`
                          )
                        ) {
                          onLoadNamed(slot.name);
                          setSaveVaultOpen(false);
                          setSaveVaultSearch('');
                        }
                      }}
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      className="save-secondary-btn"
                      title="Overwrite this slot with your current session and set it as the auto-backup target"
                      onClick={() => {
                        if (onSaveNamed(slot.name)) {
                          setVaultMessage(`Synced “${slot.name}” — auto-backup here.`);
                        }
                      }}
                    >
                      Sync & backup
                    </button>
                    <button
                      type="button"
                      className="save-secondary-btn"
                      onClick={async () => {
                        const json = serializeNamedSaveForExport(slot.name);
                        if (!json) {
                          setVaultMessage('Could not read that slot.');
                          return;
                        }
                        try {
                          if (navigator.clipboard?.writeText) {
                            await navigator.clipboard.writeText(json);
                            setVaultMessage(`Copied JSON export for “${slot.name}”.`);
                          } else {
                            throw new Error('no clipboard');
                          }
                        } catch {
                          setImportDraft(json);
                          setVaultMessage('Clipboard unavailable — JSON placed in the import box.');
                        }
                      }}
                    >
                      Copy JSON
                    </button>
                    <button
                      type="button"
                      className="save-danger-btn"
                      onClick={() => {
                        if (window.confirm(`Delete “${slot.name}” from this browser?`)) {
                          onDeleteNamedSave(slot.name);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
          <section className="save-vault-import" aria-label="Import save from JSON">
            <h3 className="save-vault-import-title">Import from file or paste</h3>
            <p className="save-vault-import-hint">
              Uses the same JSON as <strong>Copy JSON</strong>. Adds or overwrites a named slot; use <strong>Load</strong>{' '}
              to apply (reloads this tab).
            </p>
            <textarea
              className="save-vault-import-area"
              rows={6}
              value={importDraft}
              onChange={e => setImportDraft(e.target.value)}
              spellCheck={false}
              placeholder='Paste export JSON here, or use "Choose file…"'
            />
            <div className="save-vault-import-row">
              <button
                type="button"
                className="save-secondary-btn"
                onClick={() => importFileRef.current?.click()}
              >
                Choose file…
              </button>
              <input
                ref={importFileRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={e => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = () => setImportDraft(String(reader.result ?? ''));
                  reader.readAsText(f);
                }}
              />
              <button
                type="button"
                className="save-primary-btn"
                onClick={() => {
                  if (onImportNamedSave(importDraft.trim())) {
                    setImportDraft('');
                  }
                }}
              >
                Import to browser
              </button>
            </div>
          </section>
        </div>
      </div>,
      document.body
    );

  return (
    <>
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
            <span className="save-field-label">Saved profiles</span>
            <button
              type="button"
              className="save-open-vault-btn"
              onClick={() => setSaveVaultOpen(true)}
            >
              Manage saves…
            </button>
            <p className="save-vault-inline-hint">
              Card list with previews, export/import JSON, confirm on load. Press <kbd className="save-kbd">/</kbd>{' '}
              (not in a text field) to open.
            </p>
          </div>
        </div>

        <div className="save-profile-toolbar">
          <button
            type="button"
            className="save-toolbar-btn"
            onClick={toggleSfx}
            title="Mute Web Audio chimes (prestige, trophies, brand accept)"
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
        type="button"
        onClick={onOpenShop}
        title="Open Premium Shop (shortcut G)"
      >
        💎 Premium Shop
      </button>

      {/* Prestige button */}
      <div className="prestige-section">
        <button
          className="prestige-button"
          onClick={onPrestige}
          disabled={!canPrestige}
          title={canPrestige ? 'Shortcut: P to prestige' : 'Shortcut: P (when bar is full)'}
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
        <div className="shortcuts-hint">
          Keys: <kbd className="save-kbd">I</kbd> How to play · <kbd className="save-kbd">G</kbd> Premium shop ·{' '}
          <kbd className="save-kbd">1</kbd>–<kbd className="save-kbd">4</kbd> shop tabs · <kbd className="save-kbd">Home</kbd>{' '}
          recenter map · <kbd className="save-kbd">Esc</kbd> close save manager (if open) / shop / clear grid tool ·{' '}
          <kbd className="save-kbd">/</kbd> saves (not in text fields)
        </div>
      </div>
    </div>
    {saveVaultPortal}
    </>
  );
};
