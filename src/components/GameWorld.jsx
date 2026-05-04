import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './GameWorld.css';
import {
  influencerTypes,
  buildingTypes,
  passiveCatalogTunedCps,
  PASSIVE_GLOBAL_MULT
} from '../data/gameData';
import { getLocalGridBuffMultiplier } from '../utils/gameMath';
import { formatRate } from '../utils/formatNumber';

const CELL_SIZE = 36;
const VIEW_COLS = 36;
const VIEW_ROWS = 24;
const DRAG_THRESHOLD_PX = 5;
/** After a pan, block the synthetic click (esp. mobile ~300ms later) so tiles don’t place by accident */
const DRAG_SUPPRESS_CLICK_MS = 420;

/** Viewport top-left in world px; (0,0) is screen center — pads cluster on origin */
const INITIAL_VIEW_OFFSET = { x: -18 * CELL_SIZE, y: -12 * CELL_SIZE };

/** Stable 0–3s delay from id (avoid Math.random in render). */
function animationDelayFromId(id) {
  const s = String(id);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${(Math.abs(h) % 3000) / 1000}s`;
}

/** One paragraph for hover cards — trim without ugly mid-word cuts when possible. */
function clipTooltipDescription(text, max = 168) {
  const s = (text ?? '').trim();
  if (!s) return '';
  if (s.length <= max) return s;
  const slice = s.slice(0, max);
  const lastSentence = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('.'));
  if (lastSentence > 48) return slice.slice(0, lastSentence + 1).trim();
  const soft = slice.lastIndexOf(' ');
  if (soft > max * 0.65) return `${slice.slice(0, soft).trim()}…`;
  return `${slice.trimEnd()}…`;
}

export const GameWorld = ({ influencers, buildings, selectedTool, onCellClick, passiveByInfluencerId }) => {
  const [viewOffset, setViewOffset] = useState(INITIAL_VIEW_OFFSET);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef(null);
  const suppressPlacementClickRef = useRef(false);
  /** Coalesce pan to one setState per animation frame (touch can fire >60 move events/sec). */
  const panRafRef = useRef(null);
  const pendingViewOffsetRef = useRef(null);
  const gridRef = useRef(null);
  /** Window listeners for pan (mobile loses pointerleave / element-bound moves). */
  const detachWindowPanRef = useRef(null);

  useEffect(() => {
    const onKey = e => {
      if (e.code !== 'Home' || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const t = e.target;
      if (t instanceof HTMLElement) {
        const tag = t.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable) return;
      }
      e.preventDefault();
      setViewOffset({ ...INITIAL_VIEW_OFFSET });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(
    () => () => {
      if (panRafRef.current != null) {
        cancelAnimationFrame(panRafRef.current);
        panRafRef.current = null;
      }
      detachWindowPanRef.current?.();
      detachWindowPanRef.current = null;
    },
    []
  );

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

  const placementToolHint = useMemo(() => {
    if (selectedInfluencerType) return `${selectedInfluencerType.icon} ${selectedInfluencerType.name}`;
    if (selectedBuildingType) return `${selectedBuildingType.icon} ${selectedBuildingType.name}`;
    return '';
  }, [selectedInfluencerType, selectedBuildingType]);

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

  const getPlacementState = useCallback(
    anchor => {
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
    },
    [selectedTool, selectedPlacementSize, influencers, buildings]
  );

  const hoveredPlacementState = useMemo(
    () => getPlacementState(hoveredCell),
    [hoveredCell, getPlacementState]
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
    const cells = [];

    for (let wy = minWY; wy <= maxWY; wy++) {
      for (let wx = minWX; wx <= maxWX; wx++) {
        cells.push({
          worldX: wx,
          worldY: wy,
          left: wx * CELL_SIZE,
          top: wy * CELL_SIZE
        });
      }
    }
    return cells;
  }, [viewportWorldBand]);

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

  /** Inspect mode: show buff footprint + radius for a placed building + hover card. */
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

  const hoveredBuildingTalentInRange = useMemo(() => {
    if (!hoveredPlacedBuilding || !hoveredPlacedBuildingType) return 0;
    const ht = hoveredPlacedBuildingType;
    const hb = hoveredPlacedBuilding;
    const minX = hb.position.x;
    const maxX = hb.position.x + ht.size - 1;
    const minY = hb.position.y;
    const maxY = hb.position.y + ht.size - 1;
    let n = 0;
    for (const inf of influencers) {
      const x = inf.position.x;
      const y = inf.position.y;
      const dx = x < minX ? minX - x : x > maxX ? x - maxX : 0;
      const dy = y < minY ? minY - y : y > maxY ? y - maxY : 0;
      if (dx + dy <= ht.range) n += 1;
    }
    return n;
  }, [hoveredPlacedBuilding, hoveredPlacedBuildingType, influencers]);

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

  /** Layer-local coords (camera transform applies pan — avoids updating thousands of cell styles per frame). */
  const toWorldLayer = (worldX, worldY) => ({
    left: worldX * CELL_SIZE,
    top: worldY * CELL_SIZE
  });

  const handlePointerDown = event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    detachWindowPanRef.current?.();
    detachWindowPanRef.current = null;
    if (panRafRef.current != null) {
      cancelAnimationFrame(panRafRef.current);
      panRafRef.current = null;
    }
    pendingViewOffsetRef.current = null;
    suppressPlacementClickRef.current = false;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetStartX: viewOffset.x,
      offsetStartY: viewOffset.y,
      moved: false
    };
    /* Without capture, pointer events (and click) reach the grid cell under the cursor — required for placement.
       With capture, the grid steals the event target and cell onClick never fires. */
    if (!selectedTool) {
      const gridEl = gridRef.current;
      if (gridEl) {
        gridEl.setPointerCapture(event.pointerId);
      }
      const pid = event.pointerId;
      const winOpts = { capture: true, passive: false };
      const onWinMove = ev => {
        if (ev.pointerId !== pid) return;
        handlePointerMove(ev);
        if (dragStateRef.current?.moved) ev.preventDefault();
      };
      const onWinEnd = ev => {
        if (ev.pointerId !== pid) return;
        detachWindowPanRef.current?.();
        detachWindowPanRef.current = null;
        endPointerDrag(ev);
      };
      window.addEventListener('pointermove', onWinMove, winOpts);
      window.addEventListener('pointerup', onWinEnd, winOpts);
      window.addEventListener('pointercancel', onWinEnd, winOpts);
      detachWindowPanRef.current = () => {
        window.removeEventListener('pointermove', onWinMove, winOpts);
        window.removeEventListener('pointerup', onWinEnd, winOpts);
        window.removeEventListener('pointercancel', onWinEnd, winOpts);
      };
    }
  };

  const flushPanViewOffset = useCallback(() => {
    panRafRef.current = null;
    const next = pendingViewOffsetRef.current;
    if (next) {
      pendingViewOffsetRef.current = null;
      setViewOffset(next);
    }
  }, []);

  const handlePointerMove = event => {
    if (!dragStateRef.current || event.pointerId !== dragStateRef.current.pointerId) return;

    const dxPx = event.clientX - dragStateRef.current.startX;
    const dyPx = event.clientY - dragStateRef.current.startY;
    const movedEnough = Math.abs(dxPx) > DRAG_THRESHOLD_PX || Math.abs(dyPx) > DRAG_THRESHOLD_PX;
    if (!movedEnough) return;

    const firstPan = !dragStateRef.current.moved;
    dragStateRef.current.moved = true;
    pendingViewOffsetRef.current = {
      x: dragStateRef.current.offsetStartX - dxPx,
      y: dragStateRef.current.offsetStartY - dyPx
    };
    if (panRafRef.current == null) {
      panRafRef.current = requestAnimationFrame(flushPanViewOffset);
    }
    if (firstPan) setIsDragging(true);
  };

  const endPointerDrag = event => {
    if (!dragStateRef.current || event.pointerId !== dragStateRef.current.pointerId) return;
    detachWindowPanRef.current?.();
    detachWindowPanRef.current = null;
    const gridEl = gridRef.current;
    if (gridEl) {
      try {
        gridEl.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
    }
    if (panRafRef.current != null) {
      cancelAnimationFrame(panRafRef.current);
      panRafRef.current = null;
    }
    flushPanViewOffset();

    const moved = dragStateRef.current.moved;
    dragStateRef.current = null;
    if (moved) {
      suppressPlacementClickRef.current = true;
      window.setTimeout(() => {
        suppressPlacementClickRef.current = false;
      }, DRAG_SUPPRESS_CLICK_MS);
    }
    requestAnimationFrame(() => {
      setIsDragging(false);
    });
  };

  return (
    <main id="game-main" className="game-world" tabIndex={-1} aria-label="Agency grid">
      <div className="world-grid-wrap">
        <div
          ref={gridRef}
          className={`world-grid ${isDragging ? 'dragging' : ''}`}
          style={{
            width: VIEW_COLS * CELL_SIZE,
            height: VIEW_ROWS * CELL_SIZE
          }}
          onPointerLeave={() => {
            setHoveredCell(null);
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={selectedTool ? handlePointerMove : undefined}
          onPointerUp={endPointerDrag}
          onPointerCancel={endPointerDrag}
        >
        <div
          className="world-grid-camera"
          style={{
            transform: `translate3d(${-viewOffset.x}px, ${-viewOffset.y}px, 0)`,
            willChange: isDragging ? 'transform' : 'auto'
          }}
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
              onPointerEnter={() => setHoveredCell({ x: cell.worldX, y: cell.worldY })}
              onClick={() => handleCellClick(cell.worldX, cell.worldY)}
            />
          ))}

          {/* Placement footprint preview */}
          {footprintPreviewTiles.map(tile => (
            <div
              key={`footprint-${tile.x}-${tile.y}`}
              className={`placement-footprint ${hoveredPlacementState.valid ? 'valid' : 'invalid'}`}
              style={{
                ...toWorldLayer(tile.x, tile.y),
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
                ...toWorldLayer(tile.x, tile.y),
                width: CELL_SIZE,
                height: CELL_SIZE,
                borderColor: selectedBuildingType?.color ?? 'var(--neon-cyan)'
              }}
            />
          ))}

          {/* Placed building inspect: buff radius + hover card */}
          {placedBuildingHoverTiles.map(tile => (
            <div
              key={`placed-hover-${tile.x}-${tile.y}`}
              className={`placed-building-hover-tile ${tile.isFootprint ? 'footprint' : 'in-range'}`}
              style={{
                ...toWorldLayer(tile.x, tile.y),
                width: CELL_SIZE,
                height: CELL_SIZE,
                borderColor: hoveredPlacedBuildingType?.color ?? 'var(--neon-cyan)'
              }}
            />
          ))}

          {/* Buildings */}
          {visibleBuildings.map(building => {
            const type = buildingTypes.find(t => t.id === building.typeId);
            return (
              <div
                key={building.id}
                className="building"
                style={{
                  ...toWorldLayer(building.position.x, building.position.y),
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
                  ...toWorldLayer(influencer.position.x, influencer.position.y),
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  borderColor: type.color,
                  boxShadow: isBoostedPreview
                    ? `0 0 24px ${selectedBuildingType?.color ?? type.color}, 0 0 10px ${type.color}`
                    : `0 0 15px ${type.color}`,
                  animationDelay: animationDelayFromId(influencer.id)
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
              const p = toWorldLayer(hoveredTalentOnly.position.x, hoveredTalentOnly.position.y);
              return (
                <div
                  className="entity-hover-tooltip talent-hover-tooltip"
                  style={{
                    left: p.left + CELL_SIZE / 2,
                    top: p.top
                  }}
                >
                  <div className="entity-hover-title">
                    {tt.icon} {tt.name}
                  </div>
                  <div className="entity-hover-line">
                    Agency (this tile){' '}
                    <strong>{formatRate(passiveByInfluencerId?.[hoveredTalentOnly.id] ?? 0)}</strong> Clout/s
                  </div>
                  <div className="entity-hover-line">
                    Tuned base on tile <strong>{formatRate(passiveCatalogTunedCps(tt.baseCloutPerSecond))}</strong> Clout/s
                    (passive balance ×{PASSIVE_GLOBAL_MULT}; no grid buffs).
                  </div>
                  <div className="entity-hover-line talent-hover-buff">
                    Grid buff (structures + pairings){' '}
                    <strong>
                      ×
                      {hoveredTalentGridBuff >= 10
                        ? hoveredTalentGridBuff.toFixed(1)
                        : hoveredTalentGridBuff.toFixed(2)}
                    </strong>
                  </div>
                </div>
              );
            })()}
        </div>

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

        </div>

        {hoveredPlacedBuilding &&
          hoveredPlacedBuildingType &&
          !selectedTool &&
          (() => {
            const bt = hoveredPlacedBuildingType;
            const desc = clipTooltipDescription(bt.description);
            return (
              <div
                className="entity-hover-tooltip building-hover-tooltip"
                style={{
                  borderColor: bt.color,
                  boxShadow: `0 10px 32px rgba(0, 0, 0, 0.58), 0 0 28px ${bt.color}40, inset 0 1px 0 rgba(255, 255, 255, 0.07)`
                }}
              >
                <div className="entity-hover-title">
                  {bt.icon} {bt.name}
                </div>
                <div className="entity-hover-line">
                  Footprint <strong>{bt.size}×{bt.size}</strong> · Buff radius <strong>{bt.range}</strong> (from edge)
                  {' · '}
                  <strong>{hoveredBuildingTalentInRange}</strong>{' '}
                  {hoveredBuildingTalentInRange === 1 ? 'talent' : 'talents'} in range
                  {bt.effect === 'multiply' && bt.multiplier ? (
                    <>
                      {' · '}
                      Passive <strong>×{bt.multiplier}</strong>
                    </>
                  ) : null}
                </div>
                {desc ? <div className="entity-hover-desc">{desc}</div> : null}
              </div>
            );
          })()}

        <div className="camera-hint">
          {selectedTool
            ? placementToolHint
              ? `Placing ${placementToolHint} — valid tiles cyan, blocked red · tap to confirm · Esc clears · Home recenters · drag to pan`
              : 'Placement mode — tap the grid · Esc clears tool · Home recenters · drag to pan'
            : 'Drag / swipe to pan · Home recenters camera · infinite grid'}
        </div>
      </div>
    </main>
  );
};
