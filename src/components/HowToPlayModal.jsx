import { useEffect } from 'react';
import './HowToPlayModal.css';

export const HowToPlayModal = ({ onClose }) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="how-to-overlay"
      role="dialog"
      aria-labelledby="how-to-title"
      aria-modal="true"
      onWheel={e => e.stopPropagation()}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="how-to-panel panel"
        role="document"
        onClick={e => e.stopPropagation()}
        onWheel={e => e.stopPropagation()}
      >
        <div className="how-to-header">
          <h2 id="how-to-title">How to play</h2>
          <button type="button" className="how-to-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="how-to-body" tabIndex={0}>
          <section>
            <h3>Goal</h3>
            <p>
              Grow an influencer agency: earn <strong>Clout</strong>, hire talent on the grid, build
              structures that buff nearby creators, and push your run far enough to{' '}
              <strong>Prestige</strong> for a permanent damage multiplier. <strong>Gems</strong> persist and
              buy long-term upgrades in the Premium Shop.
            </p>
          </section>
          <section>
            <h3>Core loop</h3>
            <ol>
              <li>
                Tap <strong>Post Content</strong> for instant Clout. Followers tick up over time from your
                roster and sometimes from posts.
              </li>
              <li>
                Open the <strong>Agency Shop</strong> (right). Pick an influencer or structure, then click an
                empty tile on the grid to place. <strong>Cancel Selection</strong> clears the tool.
              </li>
              <li>
                Influencers earn passive Clout. <strong>Structures multiply</strong> talent in range (Manhattan
                distance). Select a building in the shop and hover the grid to see footprint, buff radius,
                and how many creators are boosted.
              </li>
              <li>
                <strong>Drag</strong> on the map to pan. The world is infinite; your placements stay locked to
                their tiles — you are only moving the camera.
              </li>
            </ol>
          </section>
          <section>
            <h3>Economy</h3>
            <ul className="how-to-list">
              <li>
                <strong>Clout</strong> buys hires, builds, and post upgrades. Each extra copy of the same item
                costs more (scaling prices).
              </li>
              <li>
                <strong>Followers</strong> gently increase Clout gain and reduce hire/build costs (audience
                discount in the shop).
              </li>
              <li>
                <strong>Reputation</strong> (0–100%) nudges how fast you earn. Safer brand choices help; messy
                ones can hurt.
              </li>
            </ul>
          </section>
          <section>
            <h3>Brand deals</h3>
            <p>
              Pop-ups offer Clout and followers in exchange for reputation swings. Payouts{' '}
              <strong>scale with how established you are</strong> (Clout, this-run progress, audience) — early
              offers stay small so they do not skip the whole shop. You can accept or decline; timers and
              cooldowns limit spam.
            </p>
          </section>
          <section>
            <h3>Post upgrades</h3>
            <p>
              Flat upgrades add raw power to each post; percent upgrades multiply post power. They reset when
              you prestige — plan around that.
            </p>
          </section>
          <section>
            <h3>Prestige &amp; eras</h3>
            <p>
              When your <strong>this-run Clout</strong> bar fills, you can prestige. That resets the run (talent,
              buildings, post upgrades, on-hand Clout/followers) but keeps <strong>lifetime Clout</strong>,{' '}
              <strong>gems</strong>, and <strong>gem upgrades</strong>. Each prestige raises a permanent multiplier
              and advances <strong>eras</strong>, unlocking stronger shop tiers.
            </p>
          </section>
          <section>
            <h3>Premium Shop (gems)</h3>
            <p>
              Optional long-term sinks: permanent Clout multipliers, separate boosts to posts vs passive income,
              surges, and gacha-style Clout drops. Fully playable without spending; gems come from prestige and
              trophies.
            </p>
          </section>
        </div>
        <button type="button" className="how-to-start primary" onClick={onClose}>
          Start playing
        </button>
      </div>
    </div>
  );
};
