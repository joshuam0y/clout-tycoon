import { useState, useEffect } from 'react';
import './App.css';
import { useGameState } from './hooks/useGameState';
import { GameWorld } from './components/GameWorld';
import { ControlPanel } from './components/ControlPanel';
import { ShopPanel } from './components/ShopPanel';
import { BrandDealPopup } from './components/BrandDealPopup';
import { Notifications } from './components/Notifications';
import { MonetizationPanel } from './components/MonetizationPanel';
import { HowToPlayModal } from './components/HowToPlayModal';

function App() {
  const gameState = useGameState();
  const { clickPostContent, prestige, activeBrandDeal } = gameState;
  const [showMonetizationPanel, setShowMonetizationPanel] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(true);

  useEffect(() => {
    const onKey = e => {
      if (howToPlayOpen || showMonetizationPanel || activeBrandDeal) return;
      const el = e.target;
      if (el instanceof HTMLElement) {
        const tag = el.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable) return;
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        clickPostContent();
        return;
      }
      if (e.code === 'KeyP') {
        e.preventDefault();
        prestige();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [howToPlayOpen, showMonetizationPanel, activeBrandDeal, clickPostContent, prestige]);

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
      {/* Neon grid background */}
      <div className="neon-grid" />

      {/* Scanline effect */}
      <div className="scanline" />

      <div className="game-layout">
        {/* Left panel - Controls and stats */}
        <ControlPanel
          clout={gameState.clout}
          followers={gameState.followers}
          reputation={gameState.reputation}
          prestigeCount={gameState.prestigeCount}
          prestigeMultiplier={gameState.prestigeMultiplier}
          passiveCloutPerSecond={gameState.passiveCloutPerSecond}
          clickCloutPerClick={gameState.clickCloutPerClick}
          lifetimeClout={gameState.lifetimeClout}
          runCloutEarned={gameState.runCloutEarned}
          gems={gameState.gems}
          staffCount={gameState.managers.length}
          totalClicks={gameState.totalClicks}
          prestigeRunCloutRequired={gameState.prestigeRunCloutRequired}
          activeFrenzy={gameState.activeFrenzy}
          onClickPostContent={gameState.clickPostContent}
          onPrestige={gameState.prestige}
          onOpenShop={() => setShowMonetizationPanel(true)}
          onOpenHowToPlay={() => setHowToPlayOpen(true)}
          onExportSave={gameState.exportSaveToFile}
          onImportSave={gameState.importSaveFromFileText}
        />

        {/* Center - Game world */}
        <GameWorld
          influencers={gameState.influencers}
          buildings={gameState.buildings}
          selectedTool={gameState.selectedTool}
          onCellClick={handleCellClick}
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
        />
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
      />

      {howToPlayOpen && <HowToPlayModal onClose={() => setHowToPlayOpen(false)} />}

      {/* Notifications */}
      <Notifications notifications={gameState.notifications} />

      {/* Monetization panel */}
      {showMonetizationPanel && (
        <MonetizationPanel
          onClose={() => setShowMonetizationPanel(false)}
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
        />
      )}
    </div>
  );
}

export default App;
