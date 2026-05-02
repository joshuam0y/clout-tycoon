# Clout Agency - Tycoon Clicker Game

A neon-themed browser tycoon game built with React and Vite.

## Game Features

### Core Mechanics
- **Manual Clicking**: Click "Post Content" to earn Clout
- **Passive Income**: Hire influencers that generate Clout automatically (0.5-50 Clout/sec)
- **Building System**: Place structures on a 20x20 grid that boost nearby influencers
- **Brand Deals**: Random event popups that offer burst rewards for Clout, Followers, and Reputation

### Resources
- **Clout**: Primary currency for purchasing influencers and buildings
- **Followers**: Increases income multiplier (1 follower = +0.00001x multiplier)
- **Reputation**: Affects brand deal quality (0-100%)

### Influencer Types (5 total)
1. **Micro Influencer** (50 Clout) - 0.5/sec - Web 1.0 Era
2. **Lifestyle Blogger** (250 Clout) - 2/sec - Web 1.0 Era
3. **Gaming Streamer** (800 Clout) - 5/sec - Social Media Era
4. **Viral Sensations** (2.5K Clout) - 15/sec - Social Media Era
5. **AI Influencer** (10K Clout) - 50/sec - AI Influencer Era

### Building Types (4 total)
1. **Creator Desk** (100 Clout) - 1.5x multiplier, range 1
2. **Content Studio** (500 Clout) - 2x multiplier, range 2
3. **Server Rack** (2K Clout) - 2.5x multiplier, range 3
4. **PR War Room** (8K Clout) - 3x multiplier, range 4

### Brand Deal Events (5 types)
- **Sponsored Post**: 100 Clout, 50 Followers, -2 Reputation
- **Brand Partnership**: 500 Clout, 200 Followers, +5 Reputation
- **Controversy Fuel**: 1.5K Clout, 500 Followers, -15 Reputation
- **Exclusive Deal**: 3K Clout, 1K Followers, +10 Reputation
- **AI Brand Synthesis**: 8K Clout, 2K Followers, 0 Reputation

### Prestige System
- **Unlock at**: 100K lifetime Clout
- **Effect**: Reset everything but gain +50% permanent multiplier
- **Era Progression**: Every 3 prestiges unlocks a new era
  - Era 0: Web 1.0 (Cyan/Blue theme)
  - Era 1: Social Media (Pink/Yellow theme)
  - Era 2: AI Influencer (Pink/Purple theme)

### Premium Shop (UI Placeholders)
- **Gacha System**: Pull premium influencer cards
- **Permanent Boosts**: Clout multipliers, instant timers, auto-accept deals
- **Market Manipulation**: Sabotage rival agencies

## Game Progression

1. Start by clicking "Post Content" manually
2. Save up 50 Clout to hire your first Micro Influencer
3. Place them on the grid to start passive income
4. Build structures near influencers to multiply their output
5. Accept brand deals when they appear (15 second window)
6. Balance reputation - high rep = better deals, low rep = more drama
7. Prestige at 100K lifetime Clout to unlock multipliers
8. Progress through 3 eras, unlocking more powerful content

## Technical Details

- **Framework**: React 18 with Vite
- **State Management**: Custom `useGameState` hook
- **Styling**: Pure CSS with CSS variables (no Tailwind)
- **Game Loop**: 100ms tick interval (10 ticks/second)
- **Target FPS**: 60fps with CSS animations

## How to Run

```bash
npm install
npm run dev
```

Then open http://localhost:5173/ in your browser.

## Controls

- Click "Post Content" button to manually earn Clout
- Select influencers/buildings from the right panel
- Click grid cells to place selected items
- Click "Accept Deal" when brand deals appear
- Click "Premium Shop" to view monetization features (placeholders)
- Click "Prestige" when you have 100K lifetime Clout

Enjoy building your influencer empire!
