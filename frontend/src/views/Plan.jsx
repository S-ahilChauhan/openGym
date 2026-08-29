import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { DAYN, uid, exCount } from '../lib/format.js'
import { streakWeeks } from '../lib/history.js'
import { t } from '../lib/i18n.js'
import { getStreakRank } from '../utils/ranks.js'
import { dayAssignSheet, loadStarterPlan, planToolsSheet } from '../sheets.jsx'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import { glyphOf, DEFAULT_GLYPH } from '../lib/glyphs.js'

export default function Plan({ rankWeeks = null } = {}) {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const rank = getStreakRank(rankWeeks ?? streakWeeks(S))

  const addRoutine = () => {
    const r = { id: uid(), name: t('New routine'), emoji: DEFAULT_GLYPH, ex: [] }
    update(s => { s.routines.push(r) })
    nav('/plan/r/' + r.id)
  }

  return <>
    <div className="hdr" style={planStyles.header}>
      <div><div style={{ ...planStyles.eyebrow, color: rank.badgeColor }}>{t('Discipline & routines')}</div><h1 style={planStyles.viewTitle}>{t('Training plan')}</h1><div className="sub">{t('Your weekly routine')} · {rank.fullTitle}</div></div>
      <div style={{ ...planStyles.rankPill, color: rank.badgeColor, borderColor: rank.badgeColor, boxShadow: `0 0 12px ${rank.glowColor}` }}>LVL {rank.level} · {rank.kanji}</div>
      <button className="iconbtn" onClick={planToolsSheet} aria-label={t('Share your plan')} title={t('Share your plan')}><Icon name="upload" /></button>
    </div>
    <div className="cols"><div>
      <h4 className="sec">{t('Week schedule')}</h4>
      <div className="list" style={{ ...planStyles.surface, display: 'flex', flexDirection: 'column' }}>
        {[1, 2, 3, 4, 5, 6, 0].map(d => {
          const r = S.routines.find(x => x.id === S.week[d])
          return <div key={d} className="item" style={{ borderLeft: `3px solid ${rank.badgeColor}` }} onClick={() => dayAssignSheet(d)}>
            <div className="grow"><div className="tt">{t(DAYN[d])}</div></div>
            {r ? <span className="tag acc"><Icon name={glyphOf(r.emoji)} />{r.name}</span> : <span className="tag">{t('Rest')}</span>}
            <Icon name="chevronRight" className="chev" /></div>
        })}
      </div>
    </div><div>
      <div className="row between" style={{ marginTop: 22, marginBottom: 10 }}>
        <h4 className="sec" style={{ margin: 0 }}>{t('Routines')}</h4>
        <Button size="sm" variant="tinted" icon="plus" onClick={addRoutine} style={{ ...planStyles.newRoutineBtn, backgroundColor: rank.badgeColor }}>{t('Routine')}</Button>
      </div>
      {S.routines.length ? <div className="list" style={planStyles.routineList}>{S.routines.map(r => <div key={r.id} className="item" style={{ ...planStyles.routineCard, borderLeft: `4px solid ${rank.badgeColor}` }} onClick={() => nav('/plan/r/' + r.id)}>
        <span className="lrow-i"><Icon name={glyphOf(r.emoji)} /></span>
        <div className="grow"><div className="row between"><div className="tt">{r.name}</div><span style={{ ...planStyles.activeTag, color: rank.badgeColor }}>{t('Active')}</span></div><div className="ss">{exCount(r.ex.length)}</div></div>
        <Icon name="chevronRight" className="chev" /></div>)}</div> : <>
        <div className="empty"><div className="ico"><Icon name="clipboard" /></div>{t('No routines yet.')}<br />{t('Create one or load the starter plan.')}</div>
        <Button icon="sparkles" onClick={loadStarterPlan}>{t('Load starter plan (Push / Pull / Legs)')}</Button>
      </>}
    </div></div>
  </>
}

const planStyles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 12 },
  eyebrow: { fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 3 },
  viewTitle: { fontSize: '1.8rem', fontWeight: '800', margin: '0.15rem 0 0', letterSpacing: '-0.5px' },
  rankPill: { border: '1px solid', borderRadius: '20px', padding: '0.35rem 0.75rem', fontSize: '0.72rem', fontWeight: '800', backgroundColor: 'rgba(20, 20, 25, 0.8)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' },
  newRoutineBtn: { border: 'none', color: '#0e0e12', fontWeight: '800', fontSize: '0.78rem', borderRadius: '16px', padding: '0.45rem 0.85rem' },
  surface: { backgroundColor: 'rgba(18, 18, 22, 0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)' },
  routineList: { display: 'flex', flexDirection: 'column', gap: '0.9rem' },
  routineCard: { backgroundColor: 'rgba(18, 18, 22, 0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)', padding: '1.15rem' },
  activeTag: { fontSize: '0.7rem', fontWeight: '700' }
}
