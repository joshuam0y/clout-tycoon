import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ControlPanel.css';
import './AgencyMenu.css';
import { isSfxMuted, setSfxMuted, unlockAudioContext } from '../utils/sound';
import { serializeNamedSaveForExport } from '../utils/persistence';
import { formatNumber } from '../utils/formatNumber';

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

export const AgencyMenu = ({
  open,
  onClose,
  namedSaveSlots = [],
  activeProfileName = '',
  lastProfileSyncAt = null,
  onSaveNamed,
  onLoadNamed,
  onDeleteNamedSave,
  onClearProfileBackup,
  onResetLocalSave,
  saveVaultHotkeyActive = true,
  onAgencySaveBlockingChange
}) => {
  const [saveNameInput, setSaveNameInput] = useState('');
  const [saveVaultOpen, setSaveVaultOpen] = useState(false);
  const [saveVaultSearch, setSaveVaultSearch] = useState('');
  const [vaultMessage, setVaultMessage] = useState('');
  const [syncAgeTick, setSyncAgeTick] = useState(0);
  const [sfxMuted, setSfxMutedState] = useState(() => isSfxMuted());

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
    const blocking = open || saveVaultOpen;
    queueMicrotask(() => onAgencySaveBlockingChange?.(blocking));
  }, [open, saveVaultOpen, onAgencySaveBlockingChange]);

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
    if (!open) return undefined;
    const onEsc = e => {
      if (e.code !== 'Escape' || e.repeat) return;
      const t = e.target;
      if (t instanceof HTMLElement) {
        const tag = t.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      }
      if (saveVaultOpen) return;
      e.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, saveVaultOpen, onClose]);

  const toggleSfx = () => {
    const next = !sfxMuted;
    setSfxMuted(next);
    setSfxMutedState(next);
    if (!next) void unlockAudioContext();
  };

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
          <label className="save-vault-search-label" htmlFor="agency-save-vault-filter">
            Filter
          </label>
          <input
            id="agency-save-vault-filter"
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
                  ? 'No named saves yet — use Save above first.'
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
                          setVaultMessage('Clipboard unavailable — try another browser or device.');
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
        </div>
      </div>,
      document.body
    );

  const sheet =
    open &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        className="agency-menu-backdrop"
        role="presentation"
        onClick={() => {
          onClose();
        }}
      >
        <aside
          className="agency-menu-sheet panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="agency-menu-title"
          onClick={e => e.stopPropagation()}
        >
          <header className="agency-menu-head">
            <h2 id="agency-menu-title" className="agency-menu-title">
              Agency
            </h2>
            <button type="button" className="agency-menu-close" aria-label="Close menu" onClick={onClose}>
              ×
            </button>
          </header>
          <p className="agency-menu-lead">Saves, vault, sound, and session reset.</p>
          <section className="save-compact" aria-label="Save and profile">
            <div className="save-compact-top">
              <label className="sr-only" htmlFor="agency-named-save-input">
                Profile name
              </label>
              <input
                id="agency-named-save-input"
                type="text"
                className="save-compact-input"
                placeholder="Name this save…"
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
                className="save-compact-primary"
                onClick={() => {
                  if (onSaveNamed(saveNameInput)) setSaveNameInput('');
                }}
              >
                Save
              </button>
              <button type="button" className="save-compact-vault" onClick={() => setSaveVaultOpen(true)}>
                Vault
              </button>
            </div>
            <div className="save-compact-meta">
              <span
                className={`save-compact-sync${activeProfileName ? ' save-compact-sync--on' : ''}`}
                aria-live="polite"
                data-sync-tick={syncAgeTick}
              >
                {activeProfileName ? (
                  <>
                    <span className="save-status-pulse save-status-pulse--on" aria-hidden />
                    {activeProfileName} · {formatSaveAge(lastProfileSyncAt)}
                  </>
                ) : (
                  <>Session autosaves · / opens vault</>
                )}
              </span>
              <span className="save-compact-tools">
                {activeProfileName ? (
                  <button
                    type="button"
                    className="save-compact-link"
                    onClick={() => {
                      if (
                        window.confirm(
                          'Stop auto-backup to this named slot? The named save stays in the vault — only auto-sync pauses.'
                        )
                      ) {
                        onClearProfileBackup();
                      }
                    }}
                  >
                    Stop backup
                  </button>
                ) : null}
                <button type="button" className="save-compact-link" onClick={toggleSfx}>
                  Sound {sfxMuted ? 'off' : 'on'}
                </button>
                <button
                  type="button"
                  className="save-compact-link save-compact-link--danger"
                  onClick={() => {
                    if (
                      window.confirm(
                        'Reset this session’s autosave and sound toggle? Named vault slots stay until you delete them.'
                      )
                    ) {
                      onResetLocalSave();
                    }
                  }}
                >
                  Reset session
                </button>
              </span>
            </div>
          </section>
        </aside>
      </div>,
      document.body
    );

  return (
    <>
      {sheet}
      {saveVaultPortal}
    </>
  );
};
