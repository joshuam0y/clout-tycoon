import { useCallback, useEffect, useState } from 'react';
import './HowToPlayModal.css';
import {
  BRAND_DEALS_MIN_LIFETIME_CLOUT,
  BRAND_DEALS_MIN_INFLUENCERS,
  BRAND_DEALS_SOLO_MIN_INFLUENCERS,
  BRAND_DEALS_SOLO_MIN_BUILDINGS,
  BRAND_DEALS_SOLO_MIN_LIFETIME_CLOUT,
  PRESTIGE_RUN_CLOUT_MULT_PER_STEP
} from '../data/gameData';

const PAGES = [
  {
    title: 'Welcome',
    body: (
      <>
        <p>
          You are running an influencer agency. Earn <strong>Clout</strong>, place talent and buildings on
          the grid, and push each run until you can <strong>Prestige</strong> for a permanent boost.
        </p>
        <p>
          <strong>Gems</strong> and <strong>Premium Shop 💎 upgrades</strong> stick around across prestiges
          (everything else in a run resets when you prestige).
        </p>
      </>
    )
  },
  {
    title: 'Basics',
    body: (
      <>
        <ol className="how-to-steps">
          <li>
            Tap <strong>Post Content</strong> for Clout. Keep posting — it stays important all game.
          </li>
          <li>
            Use the <strong>Agency Shop</strong> (right): four tabs — post upgrades, talent, buildings, and{' '}
            <strong>staff</strong> (automation). Pick placement tools, then click an empty tile on the grid.
          </li>
          <li>
            Creators earn passive Clout. <strong>Buildings multiply</strong> anyone in range (hover while
            placing to see the footprint and buff area).
          </li>
          <li>
            <strong>Pairing bonuses:</strong> certain talent + structure combos grant an extra multiplier when the
            talent is inside that building’s buff radius (listed on shop cards). Hover a placed building to see the
            buff footprint and range drawn on the grid (no popup).
          </li>
          <li>
            <strong>Drag or swipe</strong> the map to pan. Your placements stay on the grid; only the camera moves.
          </li>
          <li>
            <strong>Space</strong> or <strong>Enter</strong> posts when no text field is focused.{' '}
            <strong>P</strong> prestiges when your run bar is full (same rules as the button).
          </li>
        </ol>
      </>
    )
  },
  {
    title: 'Economy',
    body: (
      <>
        <ul className="how-to-list">
          <li>
            <strong>Clout</strong> buys upgrades, hires, and builds. Duplicate purchases of the same item cost
            more each time.
          </li>
          <li>
            <strong>Followers</strong> grow from your roster (and sometimes posts). They speed Clout a bit and
            discount hire/build prices.
          </li>
          <li>
            <strong>Reputation</strong> nudges how fast you earn. It only changes when you accept{' '}
            <strong>brand deals</strong> (some deals add rep, risky ones subtract). There’s no other Clout-for-rep
            button — prestige resets rep for the new run.
          </li>
          <li>
            The <strong>full talent and build lists</strong> are always in the shop — no era gates; you’re only
            limited by Clout and scaling duplicate prices.
          </li>
        </ul>
      </>
    )
  },
  {
    title: 'Brand deals',
    body: (
      <>
        <p>
          Sometimes a <strong>brand deal</strong> pops up. Payouts are a <strong>percentage of your current
          Clout and follower banks</strong> (and scale up with lifetime Clout). Big paydays often cost many
          <strong>reputation points</strong> — spam risky deals and you can land in{' '}
          <strong>bad rep</strong>, which hurts income until you recover.
        </p>
        <p>
          The game rotates a <strong>weekly sponsor meta</strong> (UTC): certain contract flavors spawn more often
          that week. <strong>Brand Scouts</strong> (staff hire) stack extra weight on those favored deals.
        </p>
        <p>
          Deals stay hidden until you have at least{' '}
          <strong>{BRAND_DEALS_MIN_LIFETIME_CLOUT.toLocaleString()} lifetime Clout</strong> <em>and</em> either{' '}
          <strong>{BRAND_DEALS_MIN_INFLUENCERS} influencers</strong> on the roster, or a solo path:{' '}
          <strong>{BRAND_DEALS_SOLO_MIN_INFLUENCERS} influencer</strong>,{' '}
          <strong>{BRAND_DEALS_SOLO_MIN_BUILDINGS} building</strong>, and{' '}
          <strong>{BRAND_DEALS_SOLO_MIN_LIFETIME_CLOUT.toLocaleString()} lifetime Clout</strong>.
        </p>
      </>
    )
  },
  {
    title: 'Progression',
    body: (
      <>
        <p>
          <strong>Post upgrades</strong> make each post stronger. Flat bonuses add raw power; percent bonuses
          multiply. They reset when you prestige.
        </p>
        <p>
          When your <strong>this-run Clout</strong> bar fills, you can prestige: <strong>everything in the run</strong>{' '}
          resets (Clout, roster, buildings, post upgrades, reputation for that run, etc.).{' '}
          <strong>Gems</strong> and <strong>Premium Shop 💎 upgrades</strong> persist; lifetime Clout and achievements
          stay too. The left panel “era” name is only cosmetic theme vs prestige depth — shop content is never locked.
          Each prestige makes the <strong>next</strong> run’s bar about <strong>{PRESTIGE_RUN_CLOUT_MULT_PER_STEP}×</strong>{' '}
          the Clout you needed for the previous tier.
        </p>
        <p>
          <strong>Frenzy events</strong> can fire after a cooldown: <strong>Viral frenzy</strong> boosts post
          Clout, or <strong>Feed surge</strong> boosts passive — watch the banner under your stats.
        </p>
      </>
    )
  },
  {
    title: 'Premium Shop',
    body: (
      <p>
        Spend <strong>gems</strong> (from prestige and trophies) on permanent multipliers, surges, and clout
        drops. The game is fully playable without it — gems reward long-term play across many prestiges.
      </p>
    )
  },
  {
    title: 'Saves & staff',
    body: (
      <>
        <p>
          <strong>Staff</strong> (shop tab) spends Clout like other hires: interns drip a little scheduled posting (much
          weaker than tapping Post Content; no viral frenzy; doesn’t add to <strong>manual posts</strong>), agents wait a
          moment then sign deals that keep rep above a floor, executive producers
          boost passive (compounding but softer than before), and brand scouts nudge the <strong>weekly sponsor meta</strong>{' '}
          — each extra copy of the same role costs more on an accelerating curve.
        </p>
        <p>
          Use <strong>Save in browser</strong> / <strong>Load from browser</strong> in the left panel: pick a name,
          store snapshots in this browser only (no download files). <strong>Reset local save</strong> clears your live
          autosave and SFX toggle — named slots you saved stay until you delete them. <strong>SFX</strong> toggles the
          prestige sound only.
        </p>
      </>
    )
  }
];

export const HowToPlayModal = ({ onClose }) => {
  const [page, setPage] = useState(0);
  const last = PAGES.length - 1;

  const goNext = useCallback(() => {
    setPage(p => Math.min(last, p + 1));
  }, [last]);

  const goBack = useCallback(() => {
    setPage(p => Math.max(0, p - 1));
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, goNext, goBack]);

  const step = PAGES[page];

  return (
    <div
      className="how-to-overlay"
      role="dialog"
      aria-labelledby="how-to-title"
      aria-modal="true"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="how-to-panel panel" role="document" onClick={e => e.stopPropagation()}>
        <div className="how-to-header">
          <h2 id="how-to-title">How to play</h2>
          <button type="button" className="how-to-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <p className="how-to-progress" aria-live="polite">
          Step {page + 1} of {PAGES.length}: {step.title}
        </p>

        <div className="how-to-page" key={page}>
          <h3 className="how-to-page-title">{step.title}</h3>
          <div className="how-to-page-body">{step.body}</div>
        </div>

        <div className="how-to-dots" aria-hidden>
          {PAGES.map((_, i) => (
            <span key={i} className={`how-to-dot ${i === page ? 'active' : ''}`} />
          ))}
        </div>

        <div className="how-to-nav">
          <button type="button" className="how-to-nav-btn" onClick={goBack} disabled={page === 0}>
            Back
          </button>
          {page < last ? (
            <button type="button" className="how-to-nav-btn primary" onClick={goNext}>
              Next
            </button>
          ) : (
            <button type="button" className="how-to-nav-btn primary" onClick={onClose}>
              Start playing
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
