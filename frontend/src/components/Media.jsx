// frontend/src/components/Media.jsx
import React, { useState, useEffect } from 'react';
import { getExerciseMediaUrl, imgSrc } from '../lib/exercises.js';
import Icon from './Icon.jsx';

export function Thumb({ ex, size = 48, style = {} }) {
  const [err, setErr] = useState(false);
  const src = ex ? (typeof imgSrc === 'function' ? imgSrc(ex) : null) || getExerciseMediaUrl(ex) : null;

  if (!src || err) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size > 40 ? '1.4rem' : '1rem',
          flexShrink: 0,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          ...style,
        }}
      >
        ⚡
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={ex?.n || 'Exercise'}
      onError={() => setErr(true)}
      loading="lazy"
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        objectFit: 'contain',
        backgroundColor: '#16161e',
        flexShrink: 0,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        ...style,
      }}
    />
  );
}

export default function Media({ ex, compact = false, minimizable = true }) {
  const [minimized, setMinimized] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [loading, setLoading] = useState(true);

  const mediaUrl = ex ? getExerciseMediaUrl(ex) : null;
  const isVideo = mediaUrl && (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm'));

  useEffect(() => {
    setLoading(true);
    setImgError(false);
  }, [ex?.id, mediaUrl]);

  if (!ex) return null;

  if (minimized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <button
          type="button"
          onClick={() => setMinimized(false)}
          style={mediaStyles.expandBtn}
        >
          <Icon name="eye" />
          <span>Show Visual Demo</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ ...mediaStyles.wrapper, height: compact ? '150px' : '200px' }}>
      {!imgError && mediaUrl ? (
        <>
          {isVideo ? (
            <video
              src={mediaUrl}
              autoPlay
              loop
              muted
              playsInline
              style={mediaStyles.mediaElement}
              onLoadedData={() => setLoading(false)}
              onError={() => {
                setImgError(true);
                setLoading(false);
              }}
            />
          ) : (
            <img
              src={mediaUrl}
              alt={ex.n || 'Exercise demo'}
              style={mediaStyles.mediaElement}
              onLoad={() => setLoading(false)}
              onError={() => {
                setImgError(true);
                setLoading(false);
              }}
              loading="lazy"
            />
          )}
        </>
      ) : (
        /* Aesthetic Fallback Badge */
        <div style={mediaStyles.placeholderBox}>
          <div style={mediaStyles.glowingIconWrap}>
            <span style={{ fontSize: '2.4rem' }}>🏋️</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#eee', fontWeight: '800', marginTop: '8px' }}>
            {ex.n || 'Target Exercise'}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#34D399', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {ex.bp || 'Core'} {ex.tg ? `• ${ex.tg}` : ''}
          </div>
        </div>
      )}

      {/* Minimize Toggle */}
      {minimizable && (
        <button
          type="button"
          onClick={() => setMinimized(true)}
          style={mediaStyles.minimizeBtn}
          title="Minimize Demo"
        >
          <Icon name="xmark" />
        </button>
      )}

      {/* Body Part / Target Tag */}
      {ex.tg && (
        <div style={mediaStyles.targetBadge}>
          ⚡ {ex.tg}
        </div>
      )}
    </div>
  );
}

const mediaStyles = {
  wrapper: {
    position: 'relative',
    width: '100%',
    backgroundColor: 'rgba(15, 15, 20, 0.75)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '20px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
  },
  mediaElement: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    backgroundColor: '#fff',
    borderRadius: '18px',
  },
  placeholderBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  glowingIconWrap: {
    width: '64px',
    height: '64px',
    borderRadius: '20px',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    border: '1px solid rgba(52, 211, 153, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 20px rgba(52, 211, 153, 0.2)',
  },
  minimizeBtn: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'rgba(0, 0, 0, 0.65)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    color: '#bbb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 2,
  },
  targetBadge: {
    position: 'absolute',
    bottom: '10px',
    left: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(52, 211, 153, 0.3)',
    borderRadius: '8px',
    padding: '3px 8px',
    fontSize: '0.68rem',
    fontWeight: '800',
    color: '#34D399',
    textTransform: 'capitalize',
  },
  expandBtn: {
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
    color: '#34D399',
    fontSize: '0.72rem',
    fontWeight: '800',
    padding: '5px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
};