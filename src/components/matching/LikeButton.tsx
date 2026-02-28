'use client';

import { useState } from 'react';
import styles from './LikeButton.module.css';

interface LikeButtonProps {
  companyId: string;
  initialLiked: boolean;
  likeId?: string;
}

export default function LikeButton({ companyId, initialLiked, likeId }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [currentLikeId, setCurrentLikeId] = useState(likeId);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);

    try {
      if (liked && currentLikeId) {
        // いいね解除
        const res = await fetch(`/api/likes/${currentLikeId}`, { method: 'DELETE' });
        if (res.ok) {
          setLiked(false);
          setCurrentLikeId(undefined);
        }
      } else {
        // いいね
        setAnimating(true);
        setTimeout(() => setAnimating(false), 600);
        const res = await fetch('/api/likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to_company_id: companyId }),
        });
        if (res.ok) {
          const data = await res.json();
          setLiked(true);
          setCurrentLikeId(data.data.id);
        }
      }
    } catch (err) {
      console.error('Like error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`${styles.btn} ${liked ? styles.liked : ''} ${animating ? styles.animating : ''}`}
      title={liked ? 'いいねを解除' : 'いいね'}
    >
      <span className={styles.heart}>{liked ? '❤️' : '🤍'}</span>
      <span className={styles.label}>{liked ? 'いいね済み' : 'いいね'}</span>
    </button>
  );
}
