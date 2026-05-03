import { useEffect, useMemo, useState } from 'react';
import './BrandDealPopup.css';
import { brandDealTypes, computeBrandDealPayouts } from '../data/gameData';
import { formatNumber } from '../utils/formatNumber';

export const BrandDealPopup = ({
  activeBrandDeal,
  clout,
  followers,
  lifetimeClout,
  reputation,
  prestigeMultiplier,
  gemCloutMult,
  onAccept,
  onDecline
}) => {
  /** Re-render cadence while the modal is open (deal countdown reads wall clock below). */
  const [, bumpTimer] = useState(0);

  useEffect(() => {
    if (!activeBrandDeal) return;
    const id = setInterval(() => bumpTimer(n => n + 1), 100);
    return () => clearInterval(id);
  }, [activeBrandDeal]);

  /* eslint-disable react-hooks/purity -- live countdown needs Date.now vs expiresAt */
  const timeLeft = activeBrandDeal
    ? Math.max(0, activeBrandDeal.expiresAt - Date.now())
    : 0;
  /* eslint-enable react-hooks/purity */

  const deal = useMemo(
    () => (activeBrandDeal ? brandDealTypes.find(d => d.id === activeBrandDeal.typeId) : null),
    [activeBrandDeal]
  );

  const payouts = useMemo(() => {
    if (!deal) return null;
    return computeBrandDealPayouts(deal, {
      clout,
      followers,
      lifetimeClout,
      prestigeMultiplier,
      gemCloutMult
    });
  }, [deal, clout, followers, lifetimeClout, prestigeMultiplier, gemCloutMult]);

  if (!activeBrandDeal || !deal || !payouts) return null;

  const timeLeftSeconds = Math.ceil(timeLeft / 1000);
  const dealDuration = Math.max(
    1,
    activeBrandDeal.expiresAt - (activeBrandDeal.startedAt ?? activeBrandDeal.expiresAt - 20000)
  );
  const progress = (timeLeft / dealDuration) * 100;

  const repAfter = Math.max(0, Math.min(100, reputation + payouts.reputationDelta));
  const cloutPct = Math.round(deal.cloutShare * 1000) / 10;
  const folPct = Math.round(deal.followersShare * 1000) / 10;

  return (
    <div className="brand-deal-overlay">
      <div
        className="brand-deal-popup glow-pulse"
        style={{ borderColor: deal.color }}
      >
        <div className="deal-header" style={{ borderColor: deal.color }}>
          <h3 style={{ color: deal.color, textShadow: `0 0 15px ${deal.color}` }}>
            Brand Deal Available!
          </h3>
          <div className="deal-timer" style={{ color: deal.color }}>
            {timeLeftSeconds}s
          </div>
        </div>

        <div className="deal-content">
          <div className="deal-title">{deal.name}</div>
          <div className="deal-description">{deal.description}</div>
          <div className="deal-share-hint">
            Payouts ≈ <strong>{cloutPct}%</strong> of banked Clout &amp; <strong>{folPct}%</strong> of followers
            (both scale up as lifetime Clout grows), before prestige / 💎 multipliers on Clout.
          </div>

          <div className="deal-rewards">
            <div className="reward-item">
              <span className="reward-label">Clout (this accept)</span>
              <span className="reward-value clout">
                +{formatNumber(Math.floor(payouts.earnedClout))}
              </span>
            </div>
            <div className="reward-item">
              <span className="reward-label">Followers</span>
              <span className="reward-value followers">
                +{formatNumber(Math.floor(payouts.followerGain))}
              </span>
            </div>
            <div className="reward-item">
              <span className="reward-label">Reputation</span>
              <span
                className={`reward-value ${payouts.reputationDelta >= 0 ? 'positive' : 'negative'}`}
              >
                {payouts.reputationDelta >= 0 ? '+' : ''}
                {payouts.reputationDelta} pts → ~{Math.round(repAfter)}%
              </span>
            </div>
          </div>
        </div>

        <div className="deal-progress-bar">
          <div
            className="deal-progress"
            style={{
              width: `${progress}%`,
              backgroundColor: deal.color
            }}
          />
        </div>

        <div className="deal-actions">
          <button type="button" className="decline-deal-button" onClick={onDecline}>
            Decline
          </button>
          <button
            type="button"
            className="accept-deal-button primary"
            onClick={onAccept}
            style={{
              borderColor: deal.color,
              boxShadow: `0 0 20px ${deal.color}`
            }}
          >
            Accept Deal
          </button>
        </div>
      </div>
    </div>
  );
};
