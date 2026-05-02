import { useState } from 'react';
import './MonetizationPanel.css';

export const MonetizationPanel = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('gacha');
  const [isPulling, setIsPulling] = useState(false);

  const handleGachaPull = () => {
    setIsPulling(true);
    setTimeout(() => {
      setIsPulling(false);
      alert('Gacha system placeholder - Would pull a premium influencer card!');
    }, 2000);
  };

  return (
    <div className="monetization-overlay">
      <div className="monetization-panel panel-purple">
        <div className="monetization-header">
          <h2>Premium Shop</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        {/* Tab navigation */}
        <div className="monetization-tabs">
          <button
            className={`tab ${activeTab === 'gacha' ? 'active' : ''}`}
            onClick={() => setActiveTab('gacha')}
          >
            Gacha
          </button>
          <button
            className={`tab ${activeTab === 'boosts' ? 'active' : ''}`}
            onClick={() => setActiveTab('boosts')}
          >
            Boosts
          </button>
          <button
            className={`tab ${activeTab === 'market' ? 'active' : ''}`}
            onClick={() => setActiveTab('market')}
          >
            Market
          </button>
        </div>

        {/* Content */}
        <div className="monetization-content">
          {activeTab === 'gacha' && (
            <div className="gacha-section">
              <h3>Premium Influencer Gacha</h3>
              <p className="section-description">
                Pull premium influencers with superior stats and unique abilities!
              </p>

              <div className={`gacha-machine ${isPulling ? 'pulling' : ''}`}>
                <div className="gacha-display">
                  {isPulling ? (
                    <div className="gacha-animation">
                      <div className="spinner"></div>
                      <p>Summoning...</p>
                    </div>
                  ) : (
                    <div className="gacha-prompt">
                      <span className="gacha-icon">🎰</span>
                      <p>Ready to pull!</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="gacha-options">
                <button
                  className="gacha-button primary"
                  onClick={handleGachaPull}
                  disabled={isPulling}
                >
                  Single Pull (100 💎)
                </button>
                <button
                  className="gacha-button"
                  onClick={handleGachaPull}
                  disabled={isPulling}
                >
                  10x Pull (900 💎)
                </button>
              </div>

              <div className="gacha-rates">
                <h4>Drop Rates</h4>
                <div className="rate-item legendary">⭐⭐⭐ Legendary: 1%</div>
                <div className="rate-item epic">⭐⭐ Epic: 10%</div>
                <div className="rate-item rare">⭐ Rare: 89%</div>
              </div>
            </div>
          )}

          {activeTab === 'boosts' && (
            <div className="boosts-section">
              <h3>Permanent Boosts</h3>
              <p className="section-description">
                One-time purchases that boost your agency forever!
              </p>

              <div className="boost-items">
                <div className="boost-item">
                  <div className="boost-header">
                    <span className="boost-icon">⚡</span>
                    <div className="boost-info">
                      <h4>Clout Multiplier x2</h4>
                      <p>Double all Clout gains permanently</p>
                    </div>
                  </div>
                  <button className="boost-buy">500 💎</button>
                </div>

                <div className="boost-item">
                  <div className="boost-header">
                    <span className="boost-icon">⏱️</span>
                    <div className="boost-info">
                      <h4>Instant Construction</h4>
                      <p>Skip all building timers instantly</p>
                    </div>
                  </div>
                  <button className="boost-buy">200 💎</button>
                </div>

                <div className="boost-item">
                  <div className="boost-header">
                    <span className="boost-icon">👑</span>
                    <div className="boost-info">
                      <h4>VIP Auto-Accept</h4>
                      <p>Automatically accept brand deals</p>
                    </div>
                  </div>
                  <button className="boost-buy">300 💎</button>
                </div>

                <div className="boost-item">
                  <div className="boost-header">
                    <span className="boost-icon">💰</span>
                    <div className="boost-info">
                      <h4>Passive Income Boost</h4>
                      <p>+50% to all passive generation</p>
                    </div>
                  </div>
                  <button className="boost-buy">400 💎</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'market' && (
            <div className="market-section">
              <h3>Market Manipulation</h3>
              <p className="section-description">
                Sabotage rival agencies and dominate the influencer market!
              </p>

              <div className="rival-agencies">
                <div className="rival-card">
                  <div className="rival-header">
                    <h4>TrendHouse Agency</h4>
                    <div className="rival-threat">Threat: High 🔴</div>
                  </div>
                  <div className="rival-stats">
                    <div>Clout: 45.2K</div>
                    <div>Influencers: 12</div>
                  </div>
                  <button className="sabotage-button">Sabotage (150 💎)</button>
                </div>

                <div className="rival-card">
                  <div className="rival-header">
                    <h4>Viral Squad Inc.</h4>
                    <div className="rival-threat">Threat: Medium 🟡</div>
                  </div>
                  <div className="rival-stats">
                    <div>Clout: 28.7K</div>
                    <div>Influencers: 8</div>
                  </div>
                  <button className="sabotage-button">Sabotage (100 💎)</button>
                </div>

                <div className="rival-card">
                  <div className="rival-header">
                    <h4>Content Kings</h4>
                    <div className="rival-threat">Threat: Low 🟢</div>
                  </div>
                  <div className="rival-stats">
                    <div>Clout: 12.1K</div>
                    <div>Influencers: 5</div>
                  </div>
                  <button className="sabotage-button">Sabotage (50 💎)</button>
                </div>
              </div>

              <div className="sabotage-effects">
                <h4>Sabotage Effects</h4>
                <ul>
                  <li>🔻 Reduce rival's Clout by 20%</li>
                  <li>📉 Lower rival's reputation</li>
                  <li>💎 Steal followers for yourself</li>
                  <li>⏰ Slow their production for 5 minutes</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="premium-currency">
          <span className="currency-label">Premium Gems:</span>
          <span className="currency-value">0 💎</span>
          <button className="buy-currency">Buy Gems</button>
        </div>
      </div>
    </div>
  );
};
