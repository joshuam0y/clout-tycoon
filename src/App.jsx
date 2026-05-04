import { useState, useEffect } from 'react';
import './App.css';
import { formatNumber } from './utils/formatNumber';
import { unlockAudioContext } from './utils/sound';
import { useGameState } from './hooks/useGameState';
import { GameWorld } from './components/GameWorld';
import { ControlPanel } from './components/ControlPanel';
import { ShopPanel } from './components/ShopPanel';
import { BrandDealPopup } from './components/BrandDealPopup';
import { Notifications } from './components/Notifications';
import { MonetizationPanel } from './components/MonetizationPanel';
import { HowToPlayModal } from './components/HowToPlayModal';
import { GameHudBar } from './components/GameHudBar';
import { AgencyMenu } from './components/AgencyMenu';
import { useMatchMedia } from './hooks/useMatchMedia';

/** Layout breakpoint: single-column shell + bottom tabs (see App.css). */
const MOBILE_LAYOUT_QUERY = '(max-width: 900px)';

function App() {
  const gameState = useGameState();
  const {
    clickPostContent,
    prestige,
    activeBrandDeal,
    selectedTool,
    setSelectedTool
  } = gameState;
  const [showMonetizationPanel, setShowMonetizationPanel] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(true);
  const [agencyMenuOpen, setAgencyMenuOpen] = useState(false);
  const [agencySaveBlocking, setAgencySaveBlocking] = useState(false);
  const isNarrowShell = useMatchMedia(MOBILE_LAYOUT_QUERY);
  /** Mobile-only: which full-screen pane is visible */
  const [mobileTab, setMobileTab] = useState('grid');

  useEffect(() => {
    const prime = () => {
      void unlockAudioContext();
    };
    window.addEventListener('pointerdown', prime, { capture: true });
    window.addEventListener('keydown', prime, { capture: true });
    return () => {
      window.removeEventListener('pointerdown', prime, { capture: true });
      window.removeEventListener('keydown', prime, { capture: true });
    };
  }, []);

  useEffect(() => {
    document.title = `Clout Tycoon · ${formatNumber(gameState.clout)} Clout · P${gameState.prestigeCount}`;
  }, [gameState.clout, gameState.prestigeCount]);

  /* After choosing a hire/build tool in the shop, jump to the grid to place it */
  useEffect(() => {
    if (!isNarrowShell || !selectedTool) return;
    queueMicrotask(() => setMobileTab('grid'));
  }, [isNarrowShell, selectedTool]);

  useEffect(() => {
    const onKey = e => {
      const el = e.target;
      const inTextField =
        el instanceof HTMLElement &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable);

      if (e.code === 'KeyI' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (inTextField) return;
        if (showMonetizationPanel || activeBrandDeal) return;
        e.preventDefault();
        setHowToPlayOpen(v => !v);
        return;
      }

      if (howToPlayOpen) return;
      if (inTextField) return;
      if (e.code === 'Escape') {
        if (agencySaveBlocking) return;
        if (showMonetizationPanel) {
          e.preventDefault();
          setShowMonetizationPanel(false);
          return;
        }
        if (activeBrandDeal) return;
        if (selectedTool) {
          e.preventDefault();
          setSelectedTool(null);
        }
        return;
      }
      if (showMonetizationPanel || activeBrandDeal) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        clickPostContent();
        return;
      }
      if (e.code === 'KeyP') {
        e.preventDefault();
        prestige();
        return;
      }
      if (e.code === 'KeyG') {
        e.preventDefault();
        setShowMonetizationPanel(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    howToPlayOpen,
    setHowToPlayOpen,
    showMonetizationPanel,
    activeBrandDeal,
    clickPostContent,
    prestige,
    selectedTool,
    setSelectedTool,
    agencySaveBlocking
  ]);

  const handleCellClick = (position) => {
    if (!selectedTool) return;

    const { type, id } = selectedTool;

    if (type === 'influencer') {
      const success = gameState.hireInfluencer(id, position);
      if (success) {
        setSelectedTool(null);
      }
    } else if (type === 'building') {
      const success = gameState.placeBuilding(id, position);
      if (success) {
        setSelectedTool(null);
      }
    }
  };

  return (
    <div className="app">
      <a href="#game-main" className="skip-link">
        Skip to grid
      </a>
      {/* Neon grid background */}
      <div className="neon-grid" />

      {/* Scanline effect */}
      <div className="scanline" />

      <div className="game-shell">
        <GameHudBar
          clout={gameState.clout}
          followers={gameState.followers}
          reputation={gameState.reputation}
          gems={gameState.gems}
          passiveCloutPerSecond={gameState.passiveCloutPerSecond}
          clickCloutPerClick={gameState.clickCloutPerClick}
          lifetimeClout={gameState.lifetimeClout}
          runCloutEarned={gameState.runCloutEarned}
          prestigeRunCloutRequired={gameState.prestigeRunCloutRequired}
          totalClicks={gameState.totalClicks}
          staffCount={gameState.managers.length}
          catalogEra={gameState.catalogEra}
          gemPassiveTimedBoost={gameState.gemPassiveTimedBoost}
          onOpenAgencyMenu={() => setAgencyMenuOpen(true)}
        />

        <AgencyMenu
          open={agencyMenuOpen}
          onClose={() => setAgencyMenuOpen(false)}
          namedSaveSlots={gameState.namedSaveSlots}
          activeProfileName={gameState.activeProfileName}
          lastProfileSyncAt={gameState.lastProfileSyncAt}
          onSaveNamed={gameState.saveGameNamed}
          onLoadNamed={gameState.loadGameNamed}
          onDeleteNamedSave={gameState.deleteNamedSaveSlot}
          onClearProfileBackup={gameState.clearProfileBackup}
          onResetLocalSave={gameState.resetAllLocalProgress}
          saveVaultHotkeyActive={!howToPlayOpen && !showMonetizationPanel && !activeBrandDeal}
          onAgencySaveBlockingChange={setAgencySaveBlocking}
        />

        <div
          className={`game-layout ${isNarrowShell ? 'game-layout--mobile' : ''}`}
          aria-label="Agency panels and grid"
        >
          <div
            className={`game-layout__pane game-layout__pane--command ${
              isNarrowShell && mobileTab !== 'command' ? 'is-hidden' : ''
            }`}
          >
            <ControlPanel
              prestigeCount={gameState.prestigeCount}
              clickCloutPerClick={gameState.clickCloutPerClick}
              runCloutEarned={gameState.runCloutEarned}
              prestigeRunCloutRequired={gameState.prestigeRunCloutRequired}
              activeFrenzy={gameState.activeFrenzy}
              onClickPostContent={gameState.clickPostContent}
              onPrestige={gameState.prestige}
              onOpenShop={() => setShowMonetizationPanel(true)}
              onOpenHowToPlay={() => setHowToPlayOpen(true)}
            />
          </div>

          <div
            className={`game-layout__pane game-layout__pane--grid ${
              isNarrowShell && mobileTab !== 'grid' ? 'is-hidden' : ''
            }`}
          >
            <GameWorld
              influencers={gameState.influencers}
              buildings={gameState.buildings}
              selectedTool={selectedTool}
              onCellClick={handleCellClick}
              passiveByInfluencerId={gameState.passiveByInfluencerId}
            />
          </div>

          <div
            className={`game-layout__pane game-layout__pane--shop ${
              isNarrowShell && mobileTab !== 'shop' ? 'is-hidden' : ''
            }`}
          >
            <ShopPanel
              clout={gameState.clout}
              followers={gameState.followers}
              selectedTool={selectedTool}
              onSelectTool={setSelectedTool}
              influencers={gameState.influencers}
              buildings={gameState.buildings}
              clickUpgradeLevels={gameState.clickUpgradeLevels}
              onBuyClickUpgrade={gameState.buyClickUpgrade}
              managers={gameState.managers}
              onBuyManager={gameState.buyManager}
              passiveByTalentType={gameState.passiveByTalentType}
              prestigeCount={gameState.prestigeCount}
              catalogEra={gameState.catalogEra}
            />
          </div>
        </div>

        {isNarrowShell && (
          <nav className="mobile-tab-bar" aria-label="Switch section">
            <button
              type="button"
              className={`mobile-tab-bar__btn ${mobileTab === 'grid' ? 'is-active' : ''}`}
              onClick={() => setMobileTab('grid')}
              aria-current={mobileTab === 'grid' ? 'page' : undefined}
            >
              Grid
            </button>
            <button
              type="button"
              className={`mobile-tab-bar__btn ${mobileTab === 'command' ? 'is-active' : ''}`}
              onClick={() => setMobileTab('command')}
              aria-current={mobileTab === 'command' ? 'page' : undefined}
            >
              Command
            </button>
            <button
              type="button"
              className={`mobile-tab-bar__btn ${mobileTab === 'shop' ? 'is-active' : ''}`}
              onClick={() => setMobileTab('shop')}
              aria-current={mobileTab === 'shop' ? 'page' : undefined}
            >
              Shop
            </button>
          </nav>
        )}
      </div>

      {/* Brand deal popup */}
      <BrandDealPopup
        activeBrandDeal={gameState.activeBrandDeal}
        clout={gameState.clout}
        followers={gameState.followers}
        lifetimeClout={gameState.lifetimeClout}
        reputation={gameState.reputation}
        prestigeMultiplier={gameState.prestigeMultiplier}
        gemCloutMult={gameState.gemCloutMult}
        onAccept={gameState.acceptBrandDeal}
        onDecline={gameState.declineBrandDeal}
        deferEscapeDecline={agencySaveBlocking}
      />

      {howToPlayOpen && <HowToPlayModal onClose={() => setHowToPlayOpen(false)} />}

      {/* Notifications */}
      <Notifications notifications={gameState.notifications} />

      {/* Monetization panel */}
      {showMonetizationPanel && (
        <MonetizationPanel
          onClose={() => setShowMonetizationPanel(false)}
          deferEscapeClose={agencySaveBlocking}
          gems={gameState.gems}
          gemCloutMultStacks={gameState.gemCloutMultStacks}
          gemClickMultStacks={gameState.gemClickMultStacks}
          gemPassiveMultStacks={gameState.gemPassiveMultStacks}
          maxGemCloutStacks={gameState.maxGemCloutStacks}
          maxGemClickStacks={gameState.maxGemClickStacks}
          maxGemPassiveStacks={gameState.maxGemPassiveStacks}
          passiveCloutPerSecond={gameState.passiveCloutPerSecond}
          achievementDefs={gameState.achievementDefs}
          achievementsUnlocked={gameState.achievementsUnlocked}
          gachaCosts={gameState.gachaCosts}
          gemEconomy={gameState.gemEconomy}
          onBuyGemStack={gameState.buyGemCloutStack}
          onBuyGemClickStack={gameState.buyGemClickStack}
          onBuyGemPassiveStack={gameState.buyGemPassiveStack}
          onCloutSurge={gameState.buyCloutSurge}
          onGachaPull={gameState.pullGacha}
          onGrantGemPack={gameState.grantGemsFromPack}
          onMarketInject={gameState.marketCloutInjection}
          dailyReward={gameState.dailyReward}
          onClaimDaily={gameState.claimDailyReward}
          onBuyReputationPolish={gameState.buyReputationPolish}
          onBuySpotlightRush={gameState.buySpotlightRush}
          spotlightRushCost={gameState.gemSinkCosts.spotlightRush}
          reputationPolishCost={gameState.gemSinkCosts.reputationPolish}
        />
      )}
    </div>
  );
}

export default App;
