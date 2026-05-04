import { useState, useEffect } from 'react';
import './ControlPanel.css';
import { formatNumber, formatRate, formatIntegerExact } from '../utils/formatNumber';

export const ControlPanel = ({
  clickCloutPerClick,
  runCloutEarned,
  prestigeRunCloutRequired,
  activeFrenzy,
  onClickPostContent,
  onPrestige,
  onOpenShop,
  onOpenHowToPlay
}) => {
  const [isClicking, setIsClicking] = useState(false);
  const [floaters, setFloaters] = useState([]);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!activeFrenzy) return;
    const tick = () => setNowMs(Date.now());
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [activeFrenzy]);

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
          title="Space or Enter when this panel is focused (not typing)"
        >
          Post Content
        </button>
      </div>

      <button className="premium-shop-button" type="button" onClick={onOpenShop} title="Premium shop">
        💎 Premium Shop
      </button>

      <div className="prestige-section">
        <button
          className="prestige-button"
          onClick={onPrestige}
          disabled={!canPrestige}
          title={
            canPrestige
              ? `This run ${formatIntegerExact(runCloutEarned)} / ${formatIntegerExact(required)} Clout`
              : `Need ${formatIntegerExact(Math.max(0, required - runCloutEarned))} more run Clout`
          }
        >
          Prestige{' '}
          {canPrestige
            ? '✓'
            : `(${formatNumber(Math.max(0, required - runCloutEarned))} run clout)`}
        </button>
      </div>
    </div>
  );
};
