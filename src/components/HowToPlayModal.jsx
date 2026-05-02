import './HowToPlayModal.css';

export const HowToPlayModal = ({ onClose }) => {
  return (
    <div className="how-to-overlay" role="dialog" aria-labelledby="how-to-title" aria-modal="true">
      <div className="how-to-panel panel">
        <div className="how-to-header">
          <h2 id="how-to-title">How to play</h2>
          <button type="button" className="how-to-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="how-to-body">
          <section>
            <h3>Core loop</h3>
            <ol>
              <li>
                Tap <strong>Post Content</strong> to earn Clout. That funds your agency.
              </li>
              <li>
                Open the <strong>Agency Shop</strong> (right). Pick an influencer or structure, then click a
                grid tile to place it.
              </li>
              <li>
                Influencers passively earn Clout. Some buildings <strong>multiply</strong> nearby talent —
                hover a build tool to see range.
              </li>
              <li>
                <strong>Drag</strong> on the map to pan; the grid is endless.
              </li>
            </ol>
          </section>
          <section>
            <h3>Reputation &amp; deals</h3>
            <p>
              Pop-up <strong>brand deals</strong> trade Clout and followers for reputation swings. Watch
              your rep bar — it changes how fast you earn.
            </p>
          </section>
          <section>
            <h3>Progression</h3>
            <p>
              <strong>Prestige</strong> resets a run when your this-run Clout bar fills. You keep lifetime
              stats and gems, and gain a permanent multiplier.
            </p>
            <p>
              <strong>Gems</strong> come from prestige and trophies in the Premium Shop. They buy optional
              boosts — the game is fully playable without them.
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
