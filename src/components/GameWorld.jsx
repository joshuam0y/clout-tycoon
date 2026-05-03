import { useMemo, useRef, useState } from 'react';
import './GameWorld.css';
import { influencerTypes, buildingTypes } from '../data/gameData';
import { getLocalGridBuffMultiplier } from '../utils/gameMath';

const CELL_SIZE = 36;
const VIEW_COLS = 36;
const VIEW_ROWS = 24;
const DRAG_THRESHOLD_PX = 5;

/** Viewport top-left in world px; (0,0) is screen center — pads cluster on origin */
const INITIAL_VIEW_OFFSET = { x: -18 * CELL_SIZE, y: -12 * CELL_SIZE };

export const GameWorld = ({ influencers, buildings, selectedTool, onCellClick }) => {
  const [viewOffset, setViewOffset] = useState(INITIAL_VIEW_OFFSET);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef(null);
  const suppressPlacementClickRef = useRef(false);

  const viewportWorldBand = useMemo(() => {
    const ox = viewOffset.x;
    const oy = viewOffset.y;
    const vw = VIEW_COLS * CELL_SIZE;
    const vh = VIEW_ROWS * CELL_SIZE;
    const pad = CELL_SIZE * 4;
    return {
      minWX: Math.floor((ox - pad) / CELL_SIZE),
      maxWX: Math.ceil((ox + vw + pad) / CELL_SIZE),
      minWY: Math.floor((oy - pad) / CELL_SIZE),
      maxWY: Math.ceil((oy + vh + pad) / CELL_SIZE)
    };
  }, [viewOffset]);

  const handleCellClick = (x, y) => {
    if (suppressPlacementClickRef.current) return;
    if (selectedTool && !isDragging) {
      onCellClick({ x, y });
    }
  };

  const selectedBuildingType = useMemo(() => {
    if (selectedTool?.type !== 'building') return null;
    return buildingTypes.find(t => t.id === selectedTool.id) ?? null;
  }, [selectedTool]);

  const selectedInfluencerType = useMemo(() => {
    if (selectedTool?.type !== 'influencer') return null;
    return influencerTypes.find(t => t.id === selectedTool.id) ?? null;
  }, [selectedTool]);

  const selectedPlacementSize = selectedBuildingType?.size ?? (selectedInfluencerType ? 1 : 0);

  const doesBuildingCoverTile = (building, tileX, tileY) => {
    const type = buildingTypes.find(t => t.id === building.typeId);
    if (!type) return false;

    return (
      tileX >= building.position.x &&
      tileX < building.position.x + type.size &&
      tileY >= building.position.y &&
      tileY < building.position.y + type.size
    );
  };

  const hoveredPlacedBuilding = useMemo(() => {
    if (selectedTool || !hoveredCell) return null;
    for (let i = buildings.length - 1; i >= 0; i--) {
      if (doesBuildingCoverTile(buildings[i], hoveredCell.x, hoveredCell.y)) return buildings[i];
    }
    return null;
  }, [selectedTool, hoveredCell, buildings]);

  const hoveredTalentOnly = useMemo(() => {
    if (selectedTool || !hoveredCell || hoveredPlacedBuilding) return null;
    return (
      influencers.find(
        inf => inf.position.x === hoveredCell.x && inf.position.y === hoveredCell.y
      ) ?? null
    );
  }, [selectedTool, hoveredCell, hoveredPlacedBuilding, influencers]);

  const hoveredTalentGridBuff = useMemo(() => {
    if (!hoveredTalentOnly) return 1;
    return getLocalGridBuffMultiplier(hoveredTalentOnly, buildings);
  }, [hoveredTalentOnly, buildings]);

  const getPlacementState = anchor => {
    if (!selectedTool || !anchor || selectedPlacementSize <= 0) {
      return { valid: false, isOutOfBounds: false, reason: '' };
    }

    for (let y = anchor.y; y < anchor.y + selectedPlacementSize; y++) {
      for (let x = anchor.x; x < anchor.x + selectedPlacementSize; x++) {
        const influencerOccupied = influencers.some(
          influencer => influencer.position.x === x && influencer.position.y === y
        );
        if (influencerOccupied) {
          return { valid: false, isOutOfBounds: false, reason: 'Occupied by influencer' };
        }

        const buildingOccupied = buildings.some(building => doesBuildingCoverTile(building, x, y));
        if (buildingOccupied) {
          return { valid: false, isOutOfBounds: false, reason: 'Occupied by building' };
        }
      }
    }

    return { valid: true, isOutOfBounds: false, reason: '' };
  };

  const hoveredPlacementState = useMemo(
    () => getPlacementState(hoveredCell),
    [hoveredCell, selectedTool, selectedPlacementSize, influencers, buildings]
  );

  const footprintPreviewTiles = useMemo(() => {
    if (!selectedTool || !hoveredCell || selectedPlacementSize <= 0) return [];

    const tiles = [];
    for (let y = hoveredCell.y; y < hoveredCell.y + selectedPlacementSize; y++) {
      for (let x = hoveredCell.x; x < hoveredCell.x + selectedPlacementSize; x++) {
        tiles.push({ x, y });
      }
    }

    return tiles;
  }, [selectedTool, hoveredCell, selectedPlacementSize]);

  const visibleCells = useMemo(() => {
    const { minWX, maxWX, minWY, maxWY } = viewportWorldBand;
    const ox = viewOffset.x;
    const oy = viewOffset.y;
    const cells = [];

    for (let wy = minWY; wy <= maxWY; wy++) {
      for (let wx = minWX; wx <= maxWX; wx++) {
        cells.push({
          worldX: wx,
          worldY: wy,
          left: wx * CELL_SIZE - ox,
          top: wy * CELL_SIZE - oy
        });
      }
    }
    return cells;
  }, [viewportWorldBand, viewOffset]);

  const previewTiles = useMemo(() => {
    if (!selectedBuildingType || !hoveredCell) return [];

    const minX = hoveredCell.x;
    const maxX = hoveredCell.x + selectedBuildingType.size - 1;
    const minY = hoveredCell.y;
    const maxY = hoveredCell.y + selectedBuildingType.size - 1;
    const tiles = [];
    const { minWX, maxWX, minWY, maxWY } = viewportWorldBand;

    for (let y = minWY; y <= maxWY; y++) {
      for (let x = minWX; x <= maxWX; x++) {
        const dx = x < minX ? minX - x : x > maxX ? x - maxX : 0;
        const dy = y < minY ? minY - y : y > maxY ? y - maxY : 0;
        const distance = dx + dy;

        if (distance <= selectedBuildingType.range) {
          tiles.push({
            x,
            y,
            isFootprint: x >= minX && x <= maxX && y >= minY && y <= maxY
          });
        }
      }
    }

    return tiles;
  }, [selectedBuildingType, hoveredCell, viewportWorldBand]);

  /** Inspect mode: show buff footprint + radius for a placed building (no text tooltip). */
  const placedBuildingHoverTiles = useMemo(() => {
    if (selectedTool || !hoveredPlacedBuilding) return [];
    const ht = buildingTypes.find(t => t.id === hoveredPlacedBuilding.typeId);
    if (!ht) return [];
    const hb = hoveredPlacedBuilding;
    const minX = hb.position.x;
    const maxX = hb.position.x + ht.size - 1;
    const minY = hb.position.y;
    const maxY = hb.position.y + ht.size - 1;
    const tiles = [];
    const { minWX, maxWX, minWY, maxWY } = viewportWorldBand;

    for (let y = minWY; y <= maxWY; y++) {
      for (let x = minWX; x <= maxWX; x++) {
        const dx = x < minX ? minX - x : x > maxX ? x - maxX : 0;
        const dy = y < minY ? minY - y : y > maxY ? y - maxY : 0;
        const distance = dx + dy;
        if (distance <= ht.range) {
          tiles.push({
            x,
            y,
            isFootprint: x >= minX && x <= maxX && y >= minY && y <= maxY
          });
        }
      }
    }
    return tiles;
  }, [selectedTool, hoveredPlacedBuilding, viewportWorldBand]);

  const hoveredPlacedBuildingType = useMemo(() => {
    if (!hoveredPlacedBuilding) return null;
    return buildingTypes.find(t => t.id === hoveredPlacedBuilding.typeId) ?? null;
  }, [hoveredPlacedBuilding]);

  const boostedInfluencerIds = useMemo(() => {
    if (!selectedBuildingType || !hoveredCell) return new Set();

    const minX = hoveredCell.x;
    const maxX = hoveredCell.x + selectedBuildingType.size - 1;
    const minY = hoveredCell.y;
    const maxY = hoveredCell.y + selectedBuildingType.size - 1;
    const ids = new Set();

    influencers.forEach(influencer => {
      const x = influencer.position.x;
      const y = influencer.position.y;
      const dx = x < minX ? minX - x : x > maxX ? x - maxX : 0;
      const dy = y < minY ? minY - y : y > maxY ? y - maxY : 0;
      const distance = dx + dy;
      if (distance <= selectedBuildingType.range) {
        ids.add(influencer.id);
      }
    });

    return ids;
  }, [selectedBuildingType, hoveredCell, influencers]);

  const visibleBuildings = useMemo(() => {
    const { minWX, maxWX, minWY, maxWY } = viewportWorldBand;

    return buildings.filter(building => {
      const type = buildingTypes.find(t => t.id === building.typeId);
      if (!type) return false;

      const bMinX = building.position.x;
      const bMaxX = building.position.x + type.size - 1;
      const bMinY = building.position.y;
      const bMaxY = building.position.y + type.size - 1;
      return !(bMaxX < minWX || bMinX > maxWX || bMaxY < minWY || bMinY > maxWY);
    });
  }, [buildings, viewportWorldBand]);

  const visibleInfluencers = useMemo(() => {
    const { minWX, maxWX, minWY, maxWY } = viewportWorldBand;

    return influencers.filter(
      influencer =>
        influencer.position.x >= minWX &&
        influencer.position.x <= maxWX &&
        influencer.position.y >= minWY &&
        influencer.position.y <= maxWY
    );
  }, [influencers, viewportWorldBand]);

  const toScreen = (worldX, worldY) => ({
    left: worldX * CELL_SIZE - viewOffset.x,
    top: worldY * CELL_SIZE - viewOffset.y
  });

  const handleMouseDown = event => {
    suppressPlacementClickRef.current = false;
    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      offsetStartX: viewOffset.x,
      offsetStartY: viewOffset.y,
      moved: false
    };
  };

  const handleMouseMove = event => {
    if (!dragStateRef.current) return;

    const dxPx = event.clientX - dragStateRef.current.startX;
    const dyPx = event.clientY - dragStateRef.current.startY;
    const movedEnough = Math.abs(dxPx) > DRAG_THRESHOLD_PX || Math.abs(dyPx) > DRAG_THRESHOLD_PX;
    if (!movedEnough) return;

    dragStateRef.current.moved = true;
    setViewOffset({
      x: dragStateRef.current.offsetStartX - dxPx,
      y: dragStateRef.current.offsetStartY - dyPx
    });
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    const moved = dragStateRef.current?.moved ?? false;
    dragStateRef.current = null;
    if (moved) suppressPlacementClickRef.current = true;
    requestAnimationFrame(() => {
      suppressPlacementClickRef.current = false;
      setIsDragging(false);
    });
  };

  return (
    <div className="game-world">
      <div className="world-grid-wrap">
        <div
          className={`world-grid ${isDragging ? 'dragging' : ''}`}
          style={{
            width: VIEW_COLS * CELL_SIZE,
            height: VIEW_ROWS * CELL_SIZE
          }}
          onMouseLeave={() => {
            setHoveredCell(null);
            handleMouseUp();
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
        {/* Grid cells */}
        {visibleCells.map(cell => (
          <div
            key={`${cell.worldX}-${cell.worldY}`}
            className={`grid-cell ${
              selectedTool
                ? hoveredCell
                  ? hoveredPlacementState.valid
                    ? 'clickable'
                    : 'blocked'
                  : 'clickable'
                : ''
            }`}
            style={{
              left: cell.left,
              top: cell.top,
              width: CELL_SIZE,
              height: CELL_SIZE
            }}
            onMouseEnter={() => setHoveredCell({ x: cell.worldX, y: cell.worldY })}
            onClick={() => handleCellClick(cell.worldX, cell.worldY)}
          />
        ))}

        {/* Placement footprint preview */}
        {footprintPreviewTiles.map(tile => (
          <div
            key={`footprint-${tile.x}-${tile.y}`}
            className={`placement-footprint ${hoveredPlacementState.valid ? 'valid' : 'invalid'}`}
            style={{
              ...toScreen(tile.x, tile.y),
              width: CELL_SIZE,
              height: CELL_SIZE,
              borderColor: hoveredPlacementState.valid
                ? (selectedBuildingType?.color ?? selectedInfluencerType?.color ?? 'var(--neon-green)')
                : 'var(--neon-orange)'
            }}
          />
        ))}

        {/* Building range preview while placing */}
        {previewTiles.map(tile => (
          <div
            key={`preview-${tile.x}-${tile.y}`}
            className={`range-preview-tile ${tile.isFootprint ? 'footprint' : 'in-range'}`}
            style={{
              ...toScreen(tile.x, tile.y),
              width: CELL_SIZE,
              height: CELL_SIZE,
              borderColor: selectedBuildingType?.color ?? 'var(--neon-cyan)'
            }}
          />
        ))}

        {/* Placed building inspect: buff radius only (visual, no tooltip) */}
        {placedBuildingHoverTiles.map(tile => (
          <div
            key={`placed-hover-${tile.x}-${tile.y}`}
            className={`placed-building-hover-tile ${tile.isFootprint ? 'footprint' : 'in-range'}`}
            style={{
              ...toScreen(tile.x, tile.y),
              width: CELL_SIZE,
              height: CELL_SIZE,
              borderColor: hoveredPlacedBuildingType?.color ?? 'var(--neon-cyan)'
            }}
          />
        ))}

        {selectedBuildingType && hoveredCell && (
          <div className="range-preview-legend">
            <span className="legend-item footprint">Footprint</span>
            <span className="legend-item in-range">Buff range</span>
            <span className="legend-item boosted">{boostedInfluencerIds.size} boosted</span>
            <span className={`legend-item place ${hoveredPlacementState.valid ? 'valid' : 'invalid'}`}>
              {hoveredPlacementState.valid ? 'Can place' : hoveredPlacementState.reason || 'Cannot place'}
            </span>
          </div>
        )}

        {selectedInfluencerType && hoveredCell && (
          <div className="range-preview-legend">
            <span className={`legend-item place ${hoveredPlacementState.valid ? 'valid' : 'invalid'}`}>
              {hoveredPlacementState.valid ? 'Can place influencer' : hoveredPlacementState.reason || 'Cannot place'}
            </span>
          </div>
        )}

        {/* Buildings */}
        {visibleBuildings.map(building => {
          const type = buildingTypes.find(t => t.id === building.typeId);
          return (
            <div
              key={building.id}
              className="building"
              style={{
                ...toScreen(building.position.x, building.position.y),
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
        {visibleInfluencers.map(influencer => {
          const type = influencerTypes.find(t => t.id === influencer.typeId);
          const isBoostedPreview = boostedInfluencerIds.has(influencer.id);
          return (
            <div
              key={influencer.id}
              className={`influencer floating ${isBoostedPreview ? 'boosted-preview' : ''}`}
              style={{
                ...toScreen(influencer.position.x, influencer.position.y),
                width: CELL_SIZE,
                height: CELL_SIZE,
                borderColor: type.color,
                boxShadow: isBoostedPreview
                  ? `0 0 24px ${selectedBuildingType?.color ?? type.color}, 0 0 10px ${type.color}`
                  : `0 0 15px ${type.color}`,
                animationDelay: `${Math.random() * 3}s`
              }}
            >
              <span className="influencer-icon">{type.icon}</span>
              <div className="influencer-particles" style={{ backgroundColor: type.color }} />
            </div>
          );
        })}

        {hoveredTalentOnly &&
          !selectedTool &&
          (() => {
            const tt = influencerTypes.find(t => t.id === hoveredTalentOnly.typeId);
            if (!tt) return null;
            const p = toScreen(hoveredTalentOnly.position.x, hoveredTalentOnly.position.y);
            return (
              <div
                className="entity-hover-tooltip talent-hover-tooltip"
                style={{
                  left: p.left,
                  top: p.top,
                  width: CELL_SIZE
                }}
              >
                <div className="entity-hover-title">
                  {tt.icon} {tt.name}
                </div>
                <div className="entity-hover-line">
                  Base on tile: <strong>{tt.baseCloutPerSecond.toFixed(2)}</strong> Clout/s before grid buffs
                </div>
                <div className="entity-hover-line talent-hover-buff">
                  Grid buff (structures + pairings):{' '}
                  <strong>×{hoveredTalentGridBuff >= 10 ? hoveredTalentGridBuff.toFixed(1) : hoveredTalentGridBuff.toFixed(2)}</strong>
                </div>
              </div>
            );
          })()}

        <div className="camera-hint">Drag to pan · infinite grid</div>
        </div>
      </div>
    </div>
  );
};
