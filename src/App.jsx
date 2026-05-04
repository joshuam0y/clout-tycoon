import { useState, useEffect } from 'react';
import './App.css';
import { formatNumber } from './utils/formatNumber';
import { useGameState } from './hooks/useGameState';
import { GameWorld } from './components/GameWorld';
import { ControlPanel } from './components/ControlPanel';
import { ShopPanel } from './components/ShopPanel';
import { BrandDealPopup } from './components/BrandDealPopup';
import { Notifications } from './components/Notifications';
import { MonetizationPanel } from './components/MonetizationPanel';
import { HowToPlayModal } from './components/HowToPlayModal';
import { GameHudBar } from './components/GameHudBar';

function App() {
  const gameState = useGameState();
  const { clickPostContent, prestige, activeBrandDeal } = gameState;
  const [showMonetizationPanel, setShowMonetizationPanel] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(true);
  const [saveVaultOpen, setSaveVaultOpen] = useState(false);

  useEffect(() => {
    document.title = `Clout Tycoon · ${formatNumber(gameState.clout)} Clout · P${gameState.prestigeCount}`;
  }, [gameState.clout, gameState.prestigeCount]);

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
        if (saveVaultOpen) return;
        if (showMonetizationPanel) {
          e.preventDefault();
          setShowMonetizationPanel(false);
          return;
        }
        if (activeBrandDeal) return;
        if (gameState.selectedTool) {
          e.preventDefault();
          gameState.setSelectedTool(null);
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
    gameState.selectedTool,
    gameState.setSelectedTool,
    saveVaultOpen
  ]);

  const handleCellClick = (position) => {
    if (!gameState.selectedTool) return;

    const { type, id } = gameState.selectedTool;

    if (type === 'influencer') {
      const success = gameState.hireInfluencer(id, position);
      if (success) {
        gameState.setSelectedTool(null);
      }
    } else if (type === 'building') {
      const success = gameState.placeBuilding(id, position);
      if (success) {
        gameState.setSelectedTool(null);
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
        />

        <div className="game-layout" aria-label="Agency panels and grid">
        {/* Left panel - Controls and stats */}
        <ControlPanel
          prestigeCount={gameState.prestigeCount}
          prestigeMultiplier={gameState.prestigeMultiplier}
          clickCloutPerClick={gameState.clickCloutPerClick}
          runCloutEarned={gameState.runCloutEarned}
          prestigeRunCloutRequired={gameState.prestigeRunCloutRequired}
          activeFrenzy={gameState.activeFrenzy}
          onClickPostContent={gameState.clickPostContent}
          onPrestige={gameState.prestige}
          onOpenShop={() => setShowMonetizationPanel(true)}
          onOpenHowToPlay={() => setHowToPlayOpen(true)}
          namedSaveSlots={gameState.namedSaveSlots}
          activeProfileName={gameState.activeProfileName}
          lastProfileSyncAt={gameState.lastProfileSyncAt}
          onSaveNamed={gameState.saveGameNamed}
          onLoadNamed={gameState.loadGameNamed}
          onDeleteNamedSave={gameState.deleteNamedSaveSlot}
          onClearProfileBackup={gameState.clearProfileBackup}
          onResetLocalSave={gameState.resetAllLocalProgress}
          onImportNamedSave={gameState.importNamedSaveJson}
          saveVaultHotkeyActive={!howToPlayOpen && !showMonetizationPanel && !activeBrandDeal}
          onSaveVaultOpenChange={setSaveVaultOpen}
        />

        {/* Center - Game world */}
        <GameWorld
          influencers={gameState.influencers}
          buildings={gameState.buildings}
          selectedTool={gameState.selectedTool}
          onCellClick={handleCellClick}
          passiveByInfluencerId={gameState.passiveByInfluencerId}
        />

        {/* Right panel - Shop */}
        <ShopPanel
          clout={gameState.clout}
          followers={gameState.followers}
          selectedTool={gameState.selectedTool}
          onSelectTool={gameState.setSelectedTool}
          influencers={gameState.influencers}
          buildings={gameState.buildings}
          clickUpgradeLevels={gameState.clickUpgradeLevels}
          onBuyClickUpgrade={gameState.buyClickUpgrade}
          managers={gameState.managers}
          onBuyManager={gameState.buyManager}
          passiveCloutPerSecond={gameState.passiveCloutPerSecond}
          passiveByTalentType={gameState.passiveByTalentType}
          prestigeCount={gameState.prestigeCount}
          catalogEra={gameState.catalogEra}
        />
        </div>
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
        deferEscapeDecline={saveVaultOpen}
      />

      {howToPlayOpen && <HowToPlayModal onClose={() => setHowToPlayOpen(false)} />}

      {/* Notifications */}
      <Notifications notifications={gameState.notifications} />

      {/* Monetization panel */}
      {showMonetizationPanel && (
        <MonetizationPanel
          onClose={() => setShowMonetizationPanel(false)}
          deferEscapeClose={saveVaultOpen}
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
