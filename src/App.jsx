import { useState } from 'react';
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
  const [showMonetizationPanel, setShowMonetizationPanel] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(true);

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

      {/* Main game layout */}
      <div className="game-layout">
        {/* Left panel - Controls and stats */}
        <ControlPanel
          clout={gameState.clout}
          followers={gameState.followers}
          reputation={gameState.reputation}
          currentEra={gameState.currentEra}
          prestigeCount={gameState.prestigeCount}
          prestigeMultiplier={gameState.prestigeMultiplier}
          passiveCloutPerSecond={gameState.passiveCloutPerSecond}
          clickCloutPerClick={gameState.clickCloutPerClick}
          lifetimeClout={gameState.lifetimeClout}
          runCloutEarned={gameState.runCloutEarned}
          gems={gameState.gems}
          totalClicks={gameState.totalClicks}
          onClickPostContent={gameState.clickPostContent}
          onPrestige={gameState.prestige}
          onOpenShop={() => setShowMonetizationPanel(true)}
          onOpenHowToPlay={() => setHowToPlayOpen(true)}
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
          currentEra={gameState.currentEra}
          selectedTool={gameState.selectedTool}
          onSelectTool={gameState.setSelectedTool}
          influencers={gameState.influencers}
          buildings={gameState.buildings}
          clickUpgradeLevels={gameState.clickUpgradeLevels}
          onBuyClickUpgrade={gameState.buyClickUpgrade}
        />
      </div>

      {/* Brand deal popup */}
      <BrandDealPopup
        activeBrandDeal={gameState.activeBrandDeal}
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
