// frontend/src/components/MacroFuelGrid.jsx
import React from 'react';

export default function MacroFuelGrid({ dietData, dateKey, onQuickAddWater, onOpenDiet }) {
  const targets = dietData?.targets || { protein: 160, carbs: 220, fat: 60, water: 3.0 };
  const today = dietData?.logs?.[dateKey] || { protein: 0, carbs: 0, fat: 0, water: 0 };

  const metrics = [
    {
      id: 'water',
      label: 'WATER',
      current: today.water || 0,
      target: targets.water,
      unit: 'L',
      color: '#38BDF8', // Cyan
      icon: '💧',
    },
    {
      id: 'protein',
      label: 'PROTEIN',
      current: today.protein || 0,
      target: targets.protein,
      unit: 'g',
      color: '#F43F5E', // Rose Crimson
      icon: '🥩',
    },
    {
      id: 'carbs',
      label: 'CARBS',
      current: today.carbs || 0,
      target: targets.carbs,
      unit: 'g',
      color: '#F59E0B', // Amber
      icon: '🍚',
    },
    {
      id: 'fat',
      label: 'FATS',
      current: today.fat || 0,
      target: targets.fat,
      unit: 'g',
      color: '#10B981', // Emerald
      icon: '🥑',
    },
  ];

  return (
    <div style={macroStyles.card} onClick={onOpenDiet}>
      <div style={macroStyles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.9rem' }}>🍱</span>
          <span style={macroStyles.title}>DAILY FUEL & MACROS</span>
        </div>
        <span style={macroStyles.actionLink}>Diet Plan →</span>
      </div>

      <div style={macroStyles.grid}>
        {metrics.map((m) => {
          const pct = Math.min(100, Math.round((m.current / (m.target || 1)) * 100));
          return (
            <div key={m.id} style={macroStyles.metricTile}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#888', letterSpacing: '0.5px' }}>
                  {m.icon} {m.label}
                </span>
                <span style={{ fontSize: '0.65rem', fontWeight: '800', color: m.color }}>
                  {pct}%
                </span>
              </div>

              <div style={{ margin: '4px 0 6px' }}>
                <span style={{ fontSize: '1rem', fontWeight: '900', color: '#fff' }}>
                  {m.current}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#666', marginLeft: '2px' }}>
                  / {m.target}{m.unit}
                </span>
              </div>

              {/* Progress Bar */}
              <div style={macroStyles.barTrack}>
                <div
                  style={{
                    ...macroStyles.barFill,
                    width: `${pct}%`,
                    backgroundColor: m.color,
                    boxShadow: `0 0 8px ${m.color}66`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const macroStyles = {
  card: {
    backgroundColor: 'rgba(16, 16, 22, 0.65)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '1rem',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  title: {
    fontSize: '0.7rem',
    fontWeight: '800',
    color: '#aaa',
    letterSpacing: '0.8px',
  },
  actionLink: {
    fontSize: '0.7rem',
    fontWeight: '800',
    color: '#34D399',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  metricTile: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '0.55rem 0.5rem',
    display: 'flex',
    flexDirection: 'column',
  },
  barTrack: {
    height: '4px',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.4s ease',
  },
};