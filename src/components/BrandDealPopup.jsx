import { useEffect, useMemo, useState } from 'react';
import './BrandDealPopup.css';
import { brandDealTypes } from '../data/gameData';
import { formatNumber } from '../utils/formatNumber';

export const BrandDealPopup = ({ activeBrandDeal, onAccept, onDecline }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!activeBrandDeal) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, activeBrandDeal.expiresAt - Date.now());
      setTimeLeft(remaining);
    }, 100);

    return () => clearInterval(interval);
  }, [activeBrandDeal]);

  const deal = useMemo(
    () => (activeBrandDeal ? brandDealTypes.find(d => d.id === activeBrandDeal.typeId) : null),
    [activeBrandDeal]
  );

  if (!activeBrandDeal || !deal) return null;

  const timeLeftSeconds = Math.ceil(timeLeft / 1000);
  const dealDuration = Math.max(
    1,
    activeBrandDeal.expiresAt - (activeBrandDeal.startedAt ?? activeBrandDeal.expiresAt - 20000)
  );
  const progress = (timeLeft / dealDuration) * 100;

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

          <div className="deal-rewards">
            <div className="reward-item">
              <span className="reward-label">Clout (before rep)</span>
              <span className="reward-value clout">
                +{formatNumber(Math.floor(activeBrandDeal.cloutReward))}
              </span>
            </div>
            <div className="reward-item">
              <span className="reward-label">Followers</span>
              <span className="reward-value followers">
                +{formatNumber(Math.floor(activeBrandDeal.followersReward))}
              </span>
            </div>
            <div className="reward-item">
              <span className="reward-label">Reputation</span>
              <span
                className={`reward-value ${activeBrandDeal.reputationChange >= 0 ? 'positive' : 'negative'}`}
              >
                {activeBrandDeal.reputationChange >= 0 ? '+' : ''}
                {activeBrandDeal.reputationChange}
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
