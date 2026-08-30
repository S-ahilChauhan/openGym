// frontend/src/views/Diet.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { todayISO, fmtDate } from '../lib/format.js'
import { MEAL_CATEGORIES, computeDailyTotals } from '../lib/dietDb.js'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import FoodLogModal from '../components/FoodLogModal.jsx'

export default function Diet() {
  const nav = useNavigate()
  const S = useStore((s) => s.S) || {}
  const update = useStore((s) => s.update)

  const [dateKey, setDateKey] = useState(todayISO())
  const [activeMealCategory, setActiveMealCategory] = useState(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const dietConfig = S.diet || {
    targets: { calories: 2400, protein: 180, carbs: 250, fat: 65, water: 3.5 },
    logs: {},
  }

  const currentLog = dietConfig.logs?.[dateKey] || {
    water: 0,
    meals: [],
  }

  const totals = computeDailyTotals(currentLog.meals || [])
  const targets = dietConfig.targets || { calories: 2400, protein: 180, carbs: 250, fat: 65, water: 3.5 }

  // Extract latest bodyweight for the macro calculator
  const userWeight = S.bodyweight?.slice(-1)[0]?.w || 75

  const handleAddWater = (deltaLiters) => {
    update((s) => {
      if (!s.diet) s.diet = { targets, logs: {} }
      if (!s.diet.logs) s.diet.logs = {}
      if (!s.diet.logs[dateKey]) s.diet.logs[dateKey] = { water: 0, meals: [] }

      const current = s.diet.logs[dateKey].water || 0
      s.diet.logs[dateKey].water = Math.max(0, Number((current + deltaLiters).toFixed(2)))
      s.diet.logs[dateKey].protein = totals.protein
      s.diet.logs[dateKey].carbs = totals.carbs
      s.diet.logs[dateKey].fat = totals.fat
    })
  }

  const handleAddFood = (scaledFood) => {
    const newEntry = {
      id: `m_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      category: activeMealCategory,
      name: scaledFood.name,
      portion: scaledFood.portion || '1 serving',
      calories: Number(scaledFood.calories) || 0,
      protein: Number(scaledFood.protein) || 0,
      carbs: Number(scaledFood.carbs) || 0,
      fat: Number(scaledFood.fat) || 0,
      fiber: Number(scaledFood.fiber) || 0,
      sodium: Number(scaledFood.sodium) || 0,
    }

    update((s) => {
      if (!s.diet) s.diet = { targets, logs: {} }
      if (!s.diet.logs) s.diet.logs = {}
      if (!s.diet.logs[dateKey]) s.diet.logs[dateKey] = { water: 0, meals: [] }
      if (!s.diet.logs[dateKey].meals) s.diet.logs[dateKey].meals = []

      s.diet.logs[dateKey].meals.push(newEntry)

      const updatedTotals = computeDailyTotals(s.diet.logs[dateKey].meals)
      s.diet.logs[dateKey].protein = updatedTotals.protein
      s.diet.logs[dateKey].carbs = updatedTotals.carbs
      s.diet.logs[dateKey].fat = updatedTotals.fat
    })

    setActiveMealCategory(null)
  }

  const handleRemoveFood = (mealId) => {
    update((s) => {
      if (!s.diet?.logs?.[dateKey]?.meals) return
      s.diet.logs[dateKey].meals = s.diet.logs[dateKey].meals.filter((m) => m.id !== mealId)

      const updatedTotals = computeDailyTotals(s.diet.logs[dateKey].meals)
      s.diet.logs[dateKey].protein = updatedTotals.protein
      s.diet.logs[dateKey].carbs = updatedTotals.carbs
      s.diet.logs[dateKey].fat = updatedTotals.fat
    })
  }

  const handleShiftDate = (days) => {
    const cur = new Date(dateKey)
    cur.setDate(cur.getDate() + days)
    setDateKey(cur.toISOString().slice(0, 10))
  }

  const handleSaveTargets = (newTargets) => {
    update((s) => {
      if (!s.diet) s.diet = { targets: newTargets, logs: {} }
      else s.diet.targets = newTargets
    })
    setIsSettingsOpen(false)
  }

  return (
    <div style={dietStyles.pageWrapper}>
      {/* 1. Header & Date Carousel */}
      <div style={dietStyles.topBar}>
        <div>
          <span style={dietStyles.eyebrow}>WARRIOR FUEL</span>
          <h1 style={dietStyles.title}>Diet & Nutrition</h1>
        </div>
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          style={dietStyles.gearBtn}
          title="Macro Targets"
        >
          ⚙️ Target
        </button>
      </div>

      {/* Date Switcher */}
      <div style={dietStyles.dateSelector}>
        <button type="button" onClick={() => handleShiftDate(-1)} style={dietStyles.navDateBtn}>
          ‹
        </button>
        <span style={dietStyles.currentDateLabel}>
          {dateKey === todayISO() ? 'Today · ' : ''}
          {fmtDate(dateKey, true)}
        </span>
        <button type="button" onClick={() => handleShiftDate(1)} style={dietStyles.navDateBtn}>
          ›
        </button>
      </div>

      {/* 2. Main Macro Overview Card */}
      <div style={dietStyles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#fff' }}>
              {totals.calories}
              <span style={{ fontSize: '0.85rem', color: '#888', marginLeft: '4px' }}>
                / {targets.calories} kcal
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#aaa', marginTop: '2px' }}>
              {Math.max(0, targets.calories - totals.calories)} kcal remaining
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#34D399' }}>
            {Math.min(100, Math.round((totals.calories / (targets.calories || 1)) * 100))}%
          </div>
        </div>

        {/* 3 Macro Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: 'PROTEIN', cur: totals.protein, max: targets.protein, unit: 'g', color: '#F43F5E' },
            { label: 'CARBS', cur: totals.carbs, max: targets.carbs, unit: 'g', color: '#F59E0B' },
            { label: 'FATS', cur: totals.fat, max: targets.fat, unit: 'g', color: '#10B981' },
          ].map((m) => {
            const pct = Math.min(100, Math.round((m.cur / (m.max || 1)) * 100))
            return (
              <div key={m.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: '700', marginBottom: '3px' }}>
                  <span style={{ color: '#aaa' }}>{m.label}</span>
                  <span style={{ color: '#fff' }}>{m.cur} / {m.max}{m.unit}</span>
                </div>
                <div style={dietStyles.barTrack}>
                  <div style={{ ...dietStyles.barFill, width: `${pct}%`, backgroundColor: m.color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. Water Intake Card */}
      <div style={dietStyles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.1rem' }}>💧</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff' }}>HYDRATION</span>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#38BDF8' }}>
            {currentLog.water || 0} / {targets.water} L
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button type="button" onClick={() => handleAddWater(0.25)} style={dietStyles.waterBtn}>+250 ml</button>
          <button type="button" onClick={() => handleAddWater(0.5)} style={dietStyles.waterBtn}>+500 ml</button>
          <button type="button" onClick={() => handleAddWater(1.0)} style={dietStyles.waterBtn}>+1.0 L</button>
          <button type="button" onClick={() => handleAddWater(-0.25)} style={{ ...dietStyles.waterBtn, color: '#ef4444' }}>-250 ml</button>
        </div>
      </div>

      {/* 4. Meals Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {MEAL_CATEGORIES.map((cat) => {
          const categoryMeals = (currentLog.meals || []).filter((m) => m.category === cat.name)
          const catCalories = categoryMeals.reduce((sum, item) => sum + (item.calories || 0), 0)

          return (
            <div key={cat.id} style={dietStyles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{cat.emoji}</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff' }}>{cat.name}</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#888' }}>
                  {catCalories} kcal
                </span>
              </div>

              {/* Items in Meal */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                {categoryMeals.map((item) => (
                  <div key={item.id} style={dietStyles.foodRow}>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#fff' }}>{item.name}</div>
                      <div style={{ fontSize: '0.68rem', color: '#888' }}>
                        {item.portion} • {item.protein}g P • {item.carbs}g C • {item.fat}g F
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#fff' }}>{item.calories} kcal</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFood(item.id)}
                        style={dietStyles.removeFoodBtn}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActiveMealCategory(cat.name)}
                style={dietStyles.addFoodTriggerBtn}
              >
                + Add Food to {cat.name}
              </button>
            </div>
          )
        })}
      </div>

      {/* 5. Food Selector Modal with Dynamic Scaler */}
      {activeMealCategory && (
        <FoodLogModal
          category={activeMealCategory}
          onClose={() => setActiveMealCategory(null)}
          onAddFood={handleAddFood}
        />
      )}

      {/* 6. Settings Modal with 1-Click Presets */}
      {isSettingsOpen && (
        <MacroSettingsModal
          currentTargets={targets}
          userWeight={userWeight}
          onSave={handleSaveTargets}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  )
}

function MacroSettingsModal({ currentTargets, userWeight = 75, onSave, onClose }) {
  const [cal, setCal] = useState(currentTargets.calories || 2400)
  const [prot, setProt] = useState(currentTargets.protein || 180)
  const [carb, setCarb] = useState(currentTargets.carbs || 250)
  const [fat, setFat] = useState(currentTargets.fat || 65)
  const [water, setWater] = useState(currentTargets.water || 3.5)
  const [activePreset, setActivePreset] = useState(null)

  const baseMaintenanceKcal = Math.round((Number(userWeight) || 75) * 33)

  const applyPreset = (type) => {
    setActivePreset(type)
    let targetKcal = baseMaintenanceKcal
    let proteinMultiplier = 2.0

    if (type === 'cut') {
      targetKcal = baseMaintenanceKcal - 400
      proteinMultiplier = 2.2
    } else if (type === 'bulk') {
      targetKcal = baseMaintenanceKcal + 300
      proteinMultiplier = 2.0
    } else {
      proteinMultiplier = 2.0
    }

    const targetProt = Math.round((Number(userWeight) || 75) * proteinMultiplier)
    const targetFat = Math.round((Number(userWeight) || 75) * 0.85)
    const calFromProtAndFat = (targetProt * 4) + (targetFat * 9)
    const remainingKcal = Math.max(0, targetKcal - calFromProtAndFat)
    const targetCarbs = Math.round(remainingKcal / 4)

    setCal(targetKcal)
    setProt(targetProt)
    setFat(targetFat)
    setCarb(targetCarbs)
    setWater(type === 'bulk' ? 4.0 : 3.5)
  }

  return (
    <div style={dietStyles.modalBackdrop} onClick={onClose}>
      <div style={dietStyles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#34D399', letterSpacing: '1px' }}>
              WARRIOR METABOLISM
            </span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff' }}>Target Macros</h3>
          </div>
          <button type="button" onClick={onClose} style={dietStyles.closeBtn}>✕</button>
        </div>

        {/* 1-Click Goal Presets */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ ...dietStyles.settingLabel, marginBottom: '6px' }}>
            AUTO-CALCULATE PRESET ({userWeight} kg)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <button
              type="button"
              onClick={() => applyPreset('cut')}
              style={{
                ...presetBtnStyle,
                borderColor: activePreset === 'cut' ? '#EF4444' : 'rgba(255,255,255,0.1)',
                backgroundColor: activePreset === 'cut' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.03)',
                color: activePreset === 'cut' ? '#EF4444' : '#fff'
              }}
            >
              <span style={{ fontSize: '0.85rem' }}>🗡️</span>
              <span style={{ fontSize: '0.74rem', fontWeight: 800 }}>CUT</span>
              <span style={{ fontSize: '0.62rem', color: '#888' }}>-400 kcal</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('maintain')}
              style={{
                ...presetBtnStyle,
                borderColor: activePreset === 'maintain' ? '#38BDF8' : 'rgba(255,255,255,0.1)',
                backgroundColor: activePreset === 'maintain' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                color: activePreset === 'maintain' ? '#38BDF8' : '#fff'
              }}
            >
              <span style={{ fontSize: '0.85rem' }}>⚖️</span>
              <span style={{ fontSize: '0.74rem', fontWeight: 800 }}>MAINTAIN</span>
              <span style={{ fontSize: '0.62rem', color: '#888' }}>Baseline</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('bulk')}
              style={{
                ...presetBtnStyle,
                borderColor: activePreset === 'bulk' ? '#10B981' : 'rgba(255,255,255,0.1)',
                backgroundColor: activePreset === 'bulk' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                color: activePreset === 'bulk' ? '#10B981' : '#fff'
              }}
            >
              <span style={{ fontSize: '0.85rem' }}>⚡</span>
              <span style={{ fontSize: '0.74rem', fontWeight: 800 }}>BULK</span>
              <span style={{ fontSize: '0.62rem', color: '#888' }}>+300 kcal</span>
            </button>
          </div>
        </div>

        {/* Manual Fine-Tuning */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <label style={dietStyles.settingLabel}>CALORIES (KCAL)</label>
            <input
              type="number"
              value={cal}
              onChange={(e) => { setCal(Number(e.target.value)); setActivePreset(null) }}
              style={dietStyles.input}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <div>
              <label style={dietStyles.settingLabel}>PROTEIN (G)</label>
              <input
                type="number"
                value={prot}
                onChange={(e) => { setProt(Number(e.target.value)); setActivePreset(null) }}
                style={dietStyles.input}
              />
            </div>
            <div>
              <label style={dietStyles.settingLabel}>CARBS (G)</label>
              <input
                type="number"
                value={carb}
                onChange={(e) => { setCarb(Number(e.target.value)); setActivePreset(null) }}
                style={dietStyles.input}
              />
            </div>
            <div>
              <label style={dietStyles.settingLabel}>FATS (G)</label>
              <input
                type="number"
                value={fat}
                onChange={(e) => { setFat(Number(e.target.value)); setActivePreset(null) }}
                style={dietStyles.input}
              />
            </div>
          </div>

          <div>
            <label style={dietStyles.settingLabel}>DAILY WATER TARGET (LITERS)</label>
            <input
              type="number"
              step="0.1"
              value={water}
              onChange={(e) => setWater(Number(e.target.value))}
              style={dietStyles.input}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSave({ calories: cal, protein: prot, carbs: carb, fat, water })}
          style={{ ...dietStyles.confirmBtn, marginTop: '1rem' }}
        >
          Save Macro Targets ⚔️
        </button>
      </div>
    </div>
  )
}

const presetBtnStyle = {
  border: '1px solid',
  borderRadius: '12px',
  padding: '0.6rem 0.3rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
}

const dietStyles = {
  pageWrapper: {
    padding: '1.2rem 1rem 5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
    maxWidth: '480px',
    margin: '0 auto',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontSize: '0.68rem',
    fontWeight: 800,
    letterSpacing: '1px',
    color: '#34D399',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    color: '#fff',
    margin: '2px 0 0',
  },
  gearBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
    padding: '0.4rem 0.75rem',
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  dateSelector: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    padding: '4px 10px',
  },
  navDateBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '2px 8px',
  },
  currentDateLabel: {
    fontSize: '0.8rem',
    fontWeight: 800,
    color: '#fff',
  },
  card: {
    backgroundColor: 'rgba(16, 16, 22, 0.65)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '1rem',
    boxSizing: 'border-box',
  },
  barTrack: {
    height: '6px',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  waterBtn: {
    flex: 1,
    padding: '0.5rem 0',
    borderRadius: '10px',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    color: '#38BDF8',
    fontSize: '0.74rem',
    fontWeight: 800,
    cursor: 'pointer',
  },
  foodRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '10px',
    padding: '0.5rem 0.75rem',
  },
  removeFoodBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontSize: '0.78rem',
    cursor: 'pointer',
  },
  addFoodTriggerBtn: {
    width: '100%',
    padding: '0.6rem',
    borderRadius: '10px',
    border: '1px dashed rgba(255, 255, 255, 0.15)',
    backgroundColor: 'transparent',
    color: '#aaa',
    fontSize: '0.75rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  modalCard: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'rgba(18, 18, 24, 0.98)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '24px',
    padding: '1.3rem',
    boxSizing: 'border-box',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '1.1rem',
    cursor: 'pointer',
  },
  input: {
    width: '100%',
    padding: '0.55rem 0.75rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '0.8rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  confirmBtn: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#34D399',
    color: '#000',
    fontWeight: 800,
    fontSize: '0.85rem',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  settingLabel: {
    fontSize: '0.68rem',
    fontWeight: 800,
    color: '#888',
    display: 'block',
    marginBottom: '3px',
  },
}