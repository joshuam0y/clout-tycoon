import { useState, useEffect } from 'react';
import './GameHudBar.css';
import { formatNumber, formatRate, formatIntegerExact, formatRateExact } from '../utils/formatNumber';
import { getFollowerBonusSummary } from '../utils/gameMath';
import {
  influencerTypes,
  getActiveBrandDealSeasonPhase,
  getWeeklyTalentMetaBoostTypeId
} from '../data/gameData';

export const GameHudBar = ({
  clout,
  followers,
  reputation,
  gems,
  passiveCloutPerSecond,
  clickCloutPerClick,
  lifetimeClout,
  runCloutEarned,
  prestigeRunCloutRequired,
  totalClicks,
  staffCount,
  catalogEra,
  gemPassiveTimedBoost
}) => {
  const [hudNow, setHudNow] = useState(() => Date.now());
  useEffect(() => {
    if (!gemPassiveTimedBoost) return undefined;
    const id = window.setInterval(() => setHudNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [gemPassiveTimedBoost]);

  const followerBonuses = getFollowerBonusSummary(followers);
  const dealSeason = getActiveBrandDealSeasonPhase(hudNow);
  const required = prestigeRunCloutRequired ?? 1;
  const runProgress = Math.min(1, runCloutEarned / required);
  const metaId = getWeeklyTalentMetaBoostTypeId(hudNow);
  const metaName = influencerTypes.find(t => t.id === metaId)?.name ?? 'Talent';
  const spotlightLive =
    gemPassiveTimedBoost && hudNow < gemPassiveTimedBoost.endsAt ? gemPassiveTimedBoost : null;
  const spotlightSec = spotlightLive
    ? Math.max(0, Math.ceil((spotlightLive.endsAt - hudNow) / 1000))
    : 0;

  return (
    <header className="game-hud-bar" aria-label="Agency stats">
      <div className="game-hud-main">
        <div className="game-hud-clout-block">
          <div className="game-hud-clout-label">Clout</div>
          <div className="game-hud-clout-value" title={formatIntegerExact(clout)}>
            {formatNumber(clout)}
          </div>
        </div>
        <div className="game-hud-grid">
          <div className="game-hud-cell">
            <span className="game-hud-k">Followers</span>
            <span className="game-hud-v" title={formatIntegerExact(followers)}>
              {formatNumber(followers)}
            </span>
            <span className="game-hud-sub">
              +{followerBonuses.cloutBonusPct}% Clout · −{followerBonuses.hireDiscountPct}% costs
            </span>
          </div>
          <div className="game-hud-cell">
            <span className="game-hud-k">Reputation</span>
            <span className="game-hud-v">{Math.floor(reputation)}%</span>
            <span className="game-hud-sub">Deals move rep · shapes income</span>
          </div>
          <div className="game-hud-cell">
            <span className="game-hud-k">Gems</span>
            <span className="game-hud-v game-hud-gems" title={formatIntegerExact(gems)}>
              {formatNumber(gems)} 💎
            </span>
            <span className="game-hud-sub">Prestige, trophies, daily brief</span>
          </div>
          <div className="game-hud-cell">
            <span className="game-hud-k">Catalog era</span>
            <span className="game-hud-v">{catalogEra + 1} / 4</span>
            <span className="game-hud-sub">New hires & deals unlock by prestige depth</span>
          </div>
          <div className="game-hud-cell">
            <span className="game-hud-k">Agency / sec</span>
            <span
              className="game-hud-v game-hud-passive"
              title={formatRateExact(passiveCloutPerSecond)}
            >
              {formatRate(passiveCloutPerSecond)}
            </span>
          </div>
          <div className="game-hud-cell">
            <span className="game-hud-k">Per post</span>
            <span className="game-hud-v game-hud-click" title={formatRateExact(clickCloutPerClick)}>
              {formatRate(clickCloutPerClick)}
            </span>
          </div>
        </div>
      </div>
      <div className="game-hud-meta-row">
        <span className="game-hud-meta" title="UTC week rotation">
          Deals meta: <strong>{dealSeason.label}</strong>
        </span>
        <span className="game-hud-meta" title="Weekly passive spotlight on one roster archetype">
          Algorithm lane: <strong>{metaName}</strong> ×1.1 passive
        </span>
        {spotlightLive ? (
          <span className="game-hud-meta game-hud-spotlight">
            Spotlight rush <strong>×{spotlightLive.mult.toFixed(2)}</strong> · {spotlightSec}s
          </span>
        ) : null}
      </div>
      <div className="game-hud-run">
        <div className="game-hud-run-label">
          <span>This run → prestige</span>
          <span
            title={`${formatIntegerExact(runCloutEarned)} / ${formatIntegerExact(required)}`}
          >
            {formatNumber(runCloutEarned)} / {formatNumber(required)}
          </span>
        </div>
        <div className="game-hud-run-bar" aria-hidden>
          <div className="game-hud-run-fill" style={{ width: `${runProgress * 100}%` }} />
        </div>
        <div className="game-hud-run-foot">
          <span title={formatIntegerExact(lifetimeClout)}>Lifetime {formatNumber(lifetimeClout)}</span>
          <span>
            Manual posts {totalClicks.toLocaleString()} · Staff {staffCount}
          </span>
        </div>
      </div>
    </header>
  );
};
