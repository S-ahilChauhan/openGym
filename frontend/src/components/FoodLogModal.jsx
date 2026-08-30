// frontend/src/components/FoodLogModal.jsx
import React, { useState, useMemo } from 'react'
import { COMMON_FOODS, CUISINES, scaleNutrients } from '../lib/dietDb.js'

export default function FoodLogModal({ category, onClose, onAddFood }) {
  const [activeCuisine, setActiveCuisine] = useState('All')
  const [search, setSearch] = useState('')
  const [selectedFood, setSelectedFood] = useState(null)
  const [quantity, setQuantity] = useState(100)

  // Custom food manual inputs
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customKcal, setCustomKcal] = useState('')
  const [customP, setCustomP] = useState('')
  const [customC, setCustomC] = useState('')
  const [customF, setCustomF] = useState('')

  const filteredFoods = useMemo(() => {
    return COMMON_FOODS.filter((f) => {
      const matchCuisine = activeCuisine === 'All' || f.cuisine === activeCuisine
      const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase())
      return matchCuisine && matchSearch
    })
  }, [activeCuisine, search])

  const handleSelectFood = (food) => {
    setSelectedFood(food)
    setQuantity(food.baseQty)
  }

  const liveScaled = useMemo(() => {
    if (!selectedFood) return null
    return scaleNutrients(selectedFood, quantity)
  }, [selectedFood, quantity])

  const handleConfirmAdd = () => {
    if (isCustomMode) {
      if (!customName || !customKcal) return
      onAddFood({
        name: customName,
        portion: '1 custom serving',
        calories: Number(customKcal) || 0,
        protein: Number(customP) || 0,
        carbs: Number(customC) || 0,
        fat: Number(customF) || 0,
        fiber: 0,
        sodium: 0,
      })
      onClose()
      return
    }

    if (!selectedFood || !liveScaled) return
    onAddFood({
      name: selectedFood.name,
      portion: `${quantity} ${selectedFood.unit}`,
      ...liveScaled,
    })
    onClose()
  }

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <span style={styles.eyebrow}>LOG TO {category?.toUpperCase() || 'MEAL'}</span>
            <h2 style={styles.title}>{selectedFood ? 'Adjust Quantity & Macros' : 'Select Food'}</h2>
          </div>
          <button type="button" onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* STEP 1: Search & Filter (When no food selected) */}
        {!selectedFood && !isCustomMode && (
          <>
            <input
              type="text"
              placeholder="Search across all cuisines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
              autoFocus
            />

            {/* Cuisine Filter Pills */}
            <div style={styles.cuisineRow}>
              {CUISINES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCuisine(c)}
                  style={{
                    ...styles.cuisinePill,
                    backgroundColor: activeCuisine === c ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: activeCuisine === c ? '#34D399' : 'rgba(255, 255, 255, 0.1)',
                    color: activeCuisine === c ? '#34D399' : '#aaa',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Catalog List */}
            <div style={styles.catalogList}>
              {filteredFoods.map((item) => (
                <div key={item.id} onClick={() => handleSelectFood(item)} style={styles.foodRow}>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#fff' }}>{item.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#777', marginTop: '2px' }}>
                      Base: {item.baseQty} {item.unit} • <span style={{ color: '#F43F5E' }}>{item.protein}g P</span> • {item.carbs}g C • {item.fat}g F
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#34D399' }}>{item.calories} kcal</div>
                    <span style={{ fontSize: '0.65rem', color: '#666' }}>{item.cuisine}</span>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={() => setIsCustomMode(true)} style={styles.customToggleBtn}>
              + Custom Food Entry
            </button>
          </>
        )}

        {/* STEP 2: Live Dynamic Quantity Scaling View */}
        {selectedFood && !isCustomMode && liveScaled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={styles.selectedBanner}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>{selectedFood.name}</h3>
                <span style={{ fontSize: '0.72rem', color: '#888' }}>{selectedFood.cuisine} Cuisine</span>
              </div>
              <button type="button" onClick={() => setSelectedFood(null)} style={styles.backBtn}>
                Change
              </button>
            </div>

            {/* Quantity Input with Step Increments */}
            <div style={styles.qtyBox}>
              <label style={styles.label}>QUANTITY ({selectedFood.unit})</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  style={styles.qtyInput}
                />
                <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - (selectedFood.baseQty >= 10 ? 25 : 1)))} style={styles.stepBtn}>
                  -{selectedFood.baseQty >= 10 ? '25' : '1'}
                </button>
                <button type="button" onClick={() => setQuantity((q) => q + (selectedFood.baseQty >= 10 ? 25 : 1))} style={styles.stepBtn}>
                  +{selectedFood.baseQty >= 10 ? '25' : '1'}
                </button>
                <button type="button" onClick={() => setQuantity((q) => q * 2)} style={styles.stepBtn}>
                  2x
                </button>
              </div>
            </div>

            {/* Live Scaled Calories & Macros */}
            <div style={styles.macroCard}>
              <div style={{ textAlign: 'center', marginBottom: '0.8rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: '#34D399' }}>{liveScaled.calories}</div>
                <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: '700' }}>TOTAL CALORIES (KCAL)</div>
              </div>

              <div style={styles.macroGrid}>
                <div style={{ ...styles.macroTile, borderTopColor: '#F43F5E' }}>
                  <span style={{ fontSize: '0.65rem', color: '#888', fontWeight: '800' }}>PROTEIN</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#F43F5E' }}>{liveScaled.protein}g</span>
                </div>
                <div style={{ ...styles.macroTile, borderTopColor: '#F59E0B' }}>
                  <span style={{ fontSize: '0.65rem', color: '#888', fontWeight: '800' }}>CARBS</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#F59E0B' }}>{liveScaled.carbs}g</span>
                </div>
                <div style={{ ...styles.macroTile, borderTopColor: '#10B981' }}>
                  <span style={{ fontSize: '0.65rem', color: '#888', fontWeight: '800' }}>FATS</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#10B981' }}>{liveScaled.fat}g</span>
                </div>
              </div>

              {/* Micros Drawer */}
              <div style={styles.microStrip}>
                <span>🌾 Fiber: <strong>{liveScaled.fiber}g</strong></span>
                <span>🧂 Sodium: <strong>{liveScaled.sodium}mg</strong></span>
                {liveScaled.potassium > 0 && <span>🍌 Potassium: <strong>{liveScaled.potassium}mg</strong></span>}
                {liveScaled.calcium > 0 && <span>🥛 Calcium: <strong>{liveScaled.calcium}mg</strong></span>}
              </div>
            </div>

            <button type="button" onClick={handleConfirmAdd} style={styles.confirmBtn}>
              + Add {quantity} {selectedFood.unit} to {category} ⚔️
            </button>
          </div>
        )}

        {/* STEP 3: Custom Food Input View */}
        {isCustomMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={styles.selectedBanner}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>Custom Food Item</h3>
              <button type="button" onClick={() => setIsCustomMode(false)} style={styles.backBtn}>
                Back
              </button>
            </div>

            <div>
              <label style={styles.label}>FOOD NAME</label>
              <input
                type="text"
                placeholder="e.g., Mom's Special Dal"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={styles.label}>CALORIES (KCAL)</label>
                <input
                  type="number"
                  placeholder="kcal"
                  value={customKcal}
                  onChange={(e) => setCustomKcal(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>PROTEIN (G)</label>
                <input
                  type="number"
                  placeholder="g"
                  value={customP}
                  onChange={(e) => setCustomP(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>CARBS (G)</label>
                <input
                  type="number"
                  placeholder="g"
                  value={customC}
                  onChange={(e) => setCustomC(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>FATS (G)</label>
                <input
                  type="number"
                  placeholder="g"
                  value={customF}
                  onChange={(e) => setCustomF(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <button type="button" onClick={handleConfirmAdd} style={{ ...styles.confirmBtn, marginTop: '0.5rem' }}>
              + Add Custom Item to {category} ⚔️
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: 'rgba(18, 18, 24, 0.98)',
    borderTop: '1px solid rgba(255, 255, 255, 0.12)',
    borderTopLeftRadius: '28px',
    borderTopRightRadius: '28px',
    padding: '1.4rem 1.4rem 2.2rem',
    boxSizing: 'border-box',
    maxHeight: '88vh',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  eyebrow: {
    fontSize: '0.65rem',
    fontWeight: '800',
    letterSpacing: '1px',
    color: '#34D399',
  },
  title: {
    fontSize: '1.35rem',
    fontWeight: '900',
    color: '#fff',
    margin: '2px 0 0',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '1.2rem',
    cursor: 'pointer',
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem 0.9rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '14px',
    color: '#fff',
    fontSize: '0.85rem',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '8px',
  },
  cuisineRow: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    paddingBottom: '8px',
    marginBottom: '8px',
  },
  cuisinePill: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '4px 10px',
    fontSize: '0.72rem',
    fontWeight: '700',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  catalogList: {
    maxHeight: '280px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '10px',
  },
  foodRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.65rem 0.85rem',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    cursor: 'pointer',
    border: '1px solid rgba(255, 255, 255, 0.04)',
  },
  selectedBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderRadius: '14px',
    border: '1px solid rgba(52, 211, 153, 0.2)',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#34D399',
    fontSize: '0.78rem',
    fontWeight: '800',
    cursor: 'pointer',
  },
  qtyBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '14px',
    padding: '0.85rem',
  },
  label: {
    display: 'block',
    fontSize: '0.68rem',
    fontWeight: '800',
    color: '#888',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  qtyInput: {
    flex: 2,
    padding: '0.65rem',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1.5px solid #34D399',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '1.1rem',
    fontWeight: '800',
    textAlign: 'center',
    outline: 'none',
  },
  stepBtn: {
    flex: 1,
    padding: '0.65rem 0',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.78rem',
    fontWeight: '800',
    cursor: 'pointer',
  },
  macroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '1rem',
  },
  macroGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginBottom: '10px',
  },
  macroTile: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '10px',
    padding: '0.6rem 0.4rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    borderTop: '3px solid',
  },
  microStrip: {
    display: 'flex',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: '6px',
    fontSize: '0.7rem',
    color: '#aaa',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    paddingTop: '8px',
  },
  confirmBtn: {
    width: '100%',
    padding: '0.85rem',
    backgroundColor: '#34D399',
    color: '#000',
    fontWeight: '900',
    fontSize: '0.9rem',
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 18px rgba(52, 211, 153, 0.35)',
  },
  customToggleBtn: {
    width: '100%',
    padding: '0.65rem',
    backgroundColor: 'transparent',
    border: '1px dashed rgba(255, 255, 255, 0.15)',
    borderRadius: '12px',
    color: '#aaa',
    fontSize: '0.78rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  input: {
    width: '100%',
    padding: '0.65rem 0.8rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.82rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
}