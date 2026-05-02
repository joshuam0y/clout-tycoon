import './GameWorld.css';
import { influencerTypes, buildingTypes } from '../data/gameData';

const GRID_SIZE = 20;
const CELL_SIZE = 40;

export const GameWorld = ({ influencers, buildings, selectedTool, onCellClick }) => {
  const handleCellClick = (x, y) => {
    if (selectedTool) {
      onCellClick({ x, y });
    }
  };

  return (
    <div className="game-world">
      <div className="world-grid" style={{
        width: GRID_SIZE * CELL_SIZE,
        height: GRID_SIZE * CELL_SIZE
      }}>
        {/* Grid cells */}
        {Array.from({ length: GRID_SIZE }).map((_, y) =>
          Array.from({ length: GRID_SIZE }).map((_, x) => (
            <div
              key={`${x}-${y}`}
              className={`grid-cell ${selectedTool ? 'clickable' : ''}`}
              style={{
                left: x * CELL_SIZE,
                top: y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE
              }}
              onClick={() => handleCellClick(x, y)}
            />
          ))
        )}

        {/* Buildings */}
        {buildings.map(building => {
          const type = buildingTypes.find(t => t.id === building.typeId);
          return (
            <div
              key={building.id}
              className="building"
              style={{
                left: building.position.x * CELL_SIZE,
                top: building.position.y * CELL_SIZE,
                width: CELL_SIZE * type.size,
                height: CELL_SIZE * type.size,
                borderColor: type.color,
                boxShadow: `0 0 20px ${type.color}, inset 0 0 10px ${type.color}`
              }}
            >
              <span className="building-icon">{type.icon}</span>
              <div className="building-glow" style={{ backgroundColor: type.color }} />
            </div>
          );
        })}

        {/* Influencers */}
        {influencers.map(influencer => {
          const type = influencerTypes.find(t => t.id === influencer.typeId);
          return (
            <div
              key={influencer.id}
              className="influencer floating"
              style={{
                left: influencer.position.x * CELL_SIZE,
                top: influencer.position.y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
                borderColor: type.color,
                boxShadow: `0 0 15px ${type.color}`,
                animationDelay: `${Math.random() * 3}s`
              }}
            >
              <span className="influencer-icon">{type.icon}</span>
              <div className="influencer-particles" style={{ backgroundColor: type.color }} />
            </div>
          );
        })}

        {/* Empty state message */}
        {influencers.length === 0 && buildings.length === 0 && (
          <div className="empty-world">
            <div className="start-message glow-pulse">
              <h2>CLOUT AGENCY</h2>
              <p>Click "Post Content" to begin your empire</p>
              <p>Hire influencers and build your agency</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
