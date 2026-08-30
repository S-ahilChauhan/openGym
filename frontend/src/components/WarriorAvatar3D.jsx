// frontend/src/components/WarriorAvatar3D.jsx
import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const toCm = (val, fallbackCm) => {
  const num = Number(val)
  if (!num || isNaN(num) || num <= 0) return fallbackCm
  return num < 55 ? Math.round(num * 2.54) : Math.round(num)
}

export default function WarriorAvatar3D({ profile, bioScan, accent = '#34D399' }) {
  const mountRef = useRef(null)
  const [viewMode, setViewMode] = useState('physique') // 'physique' or 'anatomy'
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const heightCm = Number(profile?.heightCm) || 175
  const chestCm = toCm(profile?.measurements?.chest, 100)
  const waistCm = toCm(profile?.measurements?.waist, 97)
  const shouldersCm = toCm(profile?.measurements?.shoulders, 114)
  const bicepCm = toCm(profile?.measurements?.bicepL || profile?.measurements?.bicepR, 38)
  const thighCm = toCm(profile?.measurements?.thighL || profile?.measurements?.thighR, 58)
  const bodyFatPct = Number(bioScan?.bodyFatPct) || 25

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const width = mount.clientWidth || 340
    const height = mount.clientHeight || 390

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000)
    camera.position.set(0, 0.05, 4.4)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    mount.appendChild(renderer.domElement)

    const ambLight = new THREE.AmbientLight(0xffffff, 0.9)
    scene.add(ambLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.3)
    keyLight.position.set(3, 5, 4)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(
      viewMode === 'anatomy' ? new THREE.Color(accent) : 0x77bbff,
      2.0
    )
    rimLight.position.set(-3, 2, -3)
    scene.add(rimLight)

    const fillLight = new THREE.PointLight(0xffffff, 0.8, 15)
    fillLight.position.set(0, -2, 2)
    scene.add(fillLight)

    const pedestalGeo = new THREE.CylinderGeometry(1.25, 1.35, 0.06, 36)
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x090a0f,
      roughness: 0.2,
      metalness: 0.8,
    })
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat)
    pedestal.position.set(0, -1.38, 0)
    scene.add(pedestal)

    const ringGeo = new THREE.RingGeometry(1.2, 1.28, 36)
    const ringMat = new THREE.MeshBasicMaterial({
      color: viewMode === 'anatomy' ? new THREE.Color(accent) : 0x38bdf8,
      side: THREE.DoubleSide,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2
    ring.position.set(0, -1.34, 0)
    scene.add(ring)

    const pivotGroup = new THREE.Group()
    scene.add(pivotGroup)

    const loader = new GLTFLoader()
    loader.load(
      '/models/muscle_figure.glb',
      (gltf) => {
        const model = gltf.scene

        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())

        const baseHeight = 2.45
        const baseScale = baseHeight / (size.y || 1)

        const rHeight = heightCm / 175
        const rChest = Math.max(0.75, Math.min(1.4, chestCm / 100))
        const rShoulder = Math.max(0.75, Math.min(1.4, shouldersCm / 114))
        const rArm = Math.max(0.75, Math.min(1.4, bicepCm / 38))
        const rLeg = Math.max(0.75, Math.min(1.4, thighCm / 58))

        const isPhysique = viewMode === 'physique'
        const fatDelta = isPhysique ? Math.max(0, bodyFatPct - 12) : 0
        const rWaist = isPhysique
          ? Math.max(0.9, Math.min(1.7, (waistCm / 84) * (1 + fatDelta * 0.025)))
          : Math.max(0.75, Math.min(1.2, waistCm / 90))

        model.traverse((child) => {
          if (child.isMesh && child.geometry) {
            const geo = child.geometry.clone()
            const pos = geo.attributes.position
            const normals = geo.attributes.normal
            const v = new THREE.Vector3()
            const n = new THREE.Vector3()

            if (child.material) {
              if (isPhysique) {
                // Soft human skin look with higher roughness to hide hard muscle grooves
                child.material.roughness = 0.75
                child.material.metalness = 0.0
                child.material.color.setHex(0xb8a291) // Natural warm skin tone for True Body
              } else {
                child.material.roughness = 0.35
                child.material.metalness = 0.3
                child.material.color.setHex(0x555960) // Cyber écorché gray for Anatomy
              }
            }

            for (let i = 0; i < pos.count; i++) {
              v.fromBufferAttribute(pos, i)
              if (normals) n.fromBufferAttribute(normals, i)

              const relY = (v.y - center.y) / (size.y / 2)
              const relX = Math.abs(v.x - center.x) / (size.x / 2)

              if (isPhysique) {
                // TRUE PHYSIQUE: Soften all sharp vertex cuts and fill in muscle striations with fat
                if (relY > 0.25 && relY < 0.75) {
                  // Smooth out chest and back definition
                  v.x *= (rChest * 0.8 + 0.2)
                  v.z *= (rChest * 0.85 + 0.15)
                }
                // Belly & Waist padding (hides abs completely at 25% BF)
                if (relY >= -0.3 && relY <= 0.35) {
                  v.x *= rWaist
                  v.z *= (rWaist * 1.15) // Soft protruding midsection
                }
                // Soften arms and legs
                if (relY > -0.6 && relY <= 0.55) {
                  v.x *= (rArm * 0.9 + 0.1)
                  v.z *= (rArm * 0.9 + 0.1)
                }
                // Inflate overall subcutaneous fat layer uniformly along surface normals
                if (normals && fatDelta > 0) {
                  v.addScaledVector(n, fatDelta * 0.005)
                }
              } else {
                // ANATOMY MODE: Sharp muscle fibers and crisp definition
                if (relY > 0.25 && relY < 0.75 && relX < 0.75) {
                  v.x *= (rChest * 0.6 + rShoulder * 0.4)
                  v.z *= rChest
                } else if (relY > 0.55 && relY < 0.85 && relX >= 0.6) {
                  v.x *= rShoulder
                  v.z *= (rShoulder * 0.7 + rChest * 0.3)
                } else if (relY >= -0.25 && relY <= 0.3) {
                  v.x *= rWaist
                  v.z *= rWaist
                } else if (relY > -0.3 && relY <= 0.55 && relX >= 0.7) {
                  v.x *= rArm
                  v.z *= rArm
                } else if (relY < -0.15 && relY > -0.7) {
                  v.x *= rLeg
                  v.z *= rLeg
                }
              }

              pos.setXYZ(i, v.x, v.y, v.z)
            }

            geo.computeVertexNormals()
            child.geometry = geo
          }
        })

        model.position.x = -center.x * baseScale
        model.position.y = -box.min.y * baseScale - 1.34
        model.position.z = -center.z * baseScale
        model.rotation.y = Math.PI / 2

        model.scale.set(baseScale, baseScale * rHeight, baseScale)

        pivotGroup.add(model)
        setIsLoading(false)
        setLoadError(false)
      },
      undefined,
      (error) => {
        console.warn('Could not load /models/muscle_figure.glb', error)
        setIsLoading(false)
        setLoadError(true)
      }
    )

    let isDragging = false
    let prevX = 0
    let prevY = 0
    let autoRotate = true
    let autoRotateTimer = null

    const dom = renderer.domElement
    dom.style.touchAction = 'none'
    dom.style.cursor = 'grab'

    const onStart = (clientX, clientY) => {
      isDragging = true
      autoRotate = false
      dom.style.cursor = 'grabbing'
      if (autoRotateTimer) clearTimeout(autoRotateTimer)
      prevX = clientX
      prevY = clientY
    }

    const onMove = (clientX, clientY) => {
      if (!isDragging) return
      const deltaX = clientX - prevX
      const deltaY = clientY - prevY

      pivotGroup.rotation.y += deltaX * 0.013
      const currentPitch = pivotGroup.rotation.x
      pivotGroup.rotation.x = Math.max(-0.35, Math.min(0.35, currentPitch + deltaY * 0.008))

      prevX = clientX
      prevY = clientY
    }

    const onEnd = () => {
      if (!isDragging) return
      isDragging = false
      dom.style.cursor = 'grab'
      autoRotateTimer = setTimeout(() => {
        autoRotate = true
      }, 3000)
    }

    const onMouseDown = (e) => onStart(e.clientX, e.clientY)
    const onMouseMove = (e) => onMove(e.clientX, e.clientY)
    const onMouseUp = () => onEnd()

    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        onStart(e.touches[0].clientX, e.touches[0].clientY)
      }
    }
    const onTouchMove = (e) => {
      if (e.touches.length === 1) {
        onMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }
    const onTouchEnd = () => onEnd()

    dom.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    dom.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)

    let animId
    let lastTime = performance.now()

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const now = performance.now()
      const delta = (now - lastTime) / 1000
      lastTime = now

      if (autoRotate) {
        pivotGroup.rotation.y += delta * 0.35
      }

      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!mount) return
      const nw = mount.clientWidth || 340
      const nh = mount.clientHeight || 390
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      if (autoRotateTimer) clearTimeout(autoRotateTimer)
      window.removeEventListener('resize', handleResize)
      dom.removeEventListener('mousedown', onMouseDown)
      dom.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      dom.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [profile, bioScan, accent, viewMode, heightCm, chestCm, waistCm, shouldersCm, bicepCm, thighCm, bodyFatPct])

  return (
    <div style={containerStyle}>
      <div style={topBarStyle}>
        <div>
          <div style={titleStyle}>3D BODY SCANNER</div>
          <div style={subTitleStyle}>
            {viewMode === 'physique' ? 'TRUE PHYSIQUE · FAT & SKIN' : 'UNDERLYING MUSCULAR ANATOMY'}
          </div>
        </div>

        <div style={segmentedContainer}>
          <button
            type="button"
            onClick={() => setViewMode('physique')}
            style={{
              ...segmentBtn,
              backgroundColor: viewMode === 'physique' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
              color: viewMode === 'physique' ? '#38BDF8' : '#888',
              borderColor: viewMode === 'physique' ? 'rgba(56, 189, 248, 0.5)' : 'transparent',
            }}
          >
            🧍 True Body
          </button>
          <button
            type="button"
            onClick={() => setViewMode('anatomy')}
            style={{
              ...segmentBtn,
              backgroundColor: viewMode === 'anatomy' ? `${accent}30` : 'transparent',
              color: viewMode === 'anatomy' ? accent : '#888',
              borderColor: viewMode === 'anatomy' ? accent : 'transparent',
            }}
          >
            🧬 Anatomy
          </button>
        </div>
      </div>

      <div style={statsOverlay}>
        <span style={statPill}>📏 {heightCm} cm</span>
        <span style={statPill}>🥋 Chest {chestCm} cm</span>
        <span style={statPill}>📐 Waist {waistCm} cm</span>
        <span style={statPill}>💪 Arm {bicepCm} cm</span>
        <span style={{ ...statPill, borderColor: '#F59E0B', color: '#F59E0B' }}>
          🔥 {bodyFatPct}% BF
        </span>
      </div>

      {isLoading && (
        <div style={loaderStyle}>
          <div style={{ fontSize: '0.78rem', color: '#888', fontWeight: '700' }}>
            Morphing 3D Body Biometrics...
          </div>
        </div>
      )}

      {loadError && (
        <div style={loaderStyle}>
          <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '700', textAlign: 'center', padding: '1rem' }}>
            Place <code>muscle_figure.glb</code> inside <code>frontend/public/models/</code>
          </div>
        </div>
      )}

      <div ref={mountRef} style={{ width: '100%', height: '100%', touchAction: 'none' }} />

      <div style={footerStyle}>
        <span>Drag to rotate & tilt freely ↺</span>
      </div>
    </div>
  )
}

const containerStyle = {
  width: '100%',
  height: '390px',
  position: 'relative',
  borderRadius: '24px',
  backgroundColor: '#0a0a0e',
  background: 'radial-gradient(circle at 50% 35%, #181a24 0%, #06070a 85%)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
  overflow: 'hidden',
  marginBottom: '1rem',
  boxSizing: 'border-box',
  userSelect: 'none',
}

const topBarStyle = {
  position: 'absolute',
  top: '12px',
  left: '16px',
  right: '16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  zIndex: 10,
}

const titleStyle = {
  fontSize: '0.82rem',
  fontWeight: '900',
  letterSpacing: '1.2px',
  color: '#ffffff',
  fontFamily: 'Impact, -apple-system, sans-serif',
}

const subTitleStyle = {
  fontSize: '0.56rem',
  fontWeight: '700',
  color: '#888',
  letterSpacing: '0.5px',
}

const segmentedContainer = {
  display: 'inline-flex',
  backgroundColor: 'rgba(0, 0, 0, 0.65)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '16px',
  padding: '2px',
  backdropFilter: 'blur(10px)',
}

const segmentBtn = {
  border: '1px solid transparent',
  borderRadius: '14px',
  padding: '4px 9px',
  fontSize: '0.64rem',
  fontWeight: '800',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  outline: 'none',
}

const statsOverlay = {
  position: 'absolute',
  top: '52px',
  left: '16px',
  right: '16px',
  display: 'flex',
  gap: '4px',
  flexWrap: 'wrap',
  zIndex: 10,
  pointerEvents: 'none',
}

const statPill = {
  fontSize: '0.62rem',
  fontWeight: '700',
  backgroundColor: 'rgba(0, 0, 0, 0.65)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '10px',
  padding: '3px 7px',
  color: '#ddd',
  backdropFilter: 'blur(8px)',
}

const loaderStyle = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 5,
}

const footerStyle = {
  position: 'absolute',
  bottom: '10px',
  left: '16px',
  right: '16px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '0.65rem',
  color: '#777',
  fontWeight: '700',
  zIndex: 10,
  pointerEvents: 'none',
}