import { useMemo } from 'react';
import { influencerTypes, buildingTypes } from '../data/gameData';
import './AgencyRoadmapBar.css';

export const AgencyRoadmapBar = ({ influencerCount, buildingCount }) => {
  const roadmap = useMemo(() => {
    const starter = influencerTypes.find(i => i.id === 'pet') ?? influencerTypes[0];
    const desk = buildingTypes.find(b => b.id === 'desk');
    const studio = buildingTypes.find(b => b.id === 'studio');
    return { starter, desk, studio };
  }, []);

  const placementCount = influencerCount + buildingCount;
  if (placementCount >= 8 || !roadmap.starter) return null;

  return (
    <div className="agency-roadmap-bar">
      <div className="roadmap-bar-row">
        <span className="roadmap-bar-label">Suggested start</span>
        <div className="roadmap-bar-chips">
          <span className="roadmap-bar-chip">
            <span className="roadmap-bar-ico">{roadmap.starter.icon}</span>
            {roadmap.starter.name}
          </span>
          <span className="roadmap-bar-arrow" aria-hidden>
            →
          </span>
          <span className="roadmap-bar-chip">
            <span className="roadmap-bar-ico">{roadmap.desk?.icon}</span>
            {roadmap.desk?.name ?? 'Desk'}
          </span>
          <span className="roadmap-bar-arrow" aria-hidden>
            →
          </span>
          <span className="roadmap-bar-chip">
            <span className="roadmap-bar-ico">{roadmap.studio?.icon}</span>
            {roadmap.studio?.name ?? 'Studio'}
          </span>
        </div>
      </div>
      <p className="roadmap-bar-sub">
        <strong>Agency Shop</strong> → <strong>Talent</strong> or <strong>Builds</strong>, then a grid tile. Drag
        to pan.
      </p>
    </div>
  );
};
