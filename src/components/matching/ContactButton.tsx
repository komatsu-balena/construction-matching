'use client';

import { useState } from 'react';
import styles from './ContactButton.module.css';

interface ContactButtonProps {
  companyId: string;
  existingRequest: { id: string; status: string } | null;
}

export default function ContactButton({ companyId, existingRequest }: ContactButtonProps) {
  const [request, setRequest] = useState(existingRequest);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (request?.status === 'accepted') {
    return (
      <span className={styles.acceptedBadge}>✓ コンタクト承認済み</span>
    );
  }

  if (request?.status === 'pending') {
    return (
      <span className={styles.pendingBadge}>📋 リクエスト送信済み</span>
    );
  }

  if (request?.status === 'rejected') {
    return (
      <span className={styles.rejectedBadge}>✕ リクエスト辞退済み</span>
    );
  }

  async function handleSend() {
    setLoading(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_company_id: companyId, message }),
      });
      if (res.ok) {
        const data = await res.json();
        setRequest(data.data);
        setShowModal(false);
      }
    } catch (err) {
      console.error('Contact request error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className={styles.btn}
        onClick={() => setShowModal(true)}
      >
        📋 コンタクトリクエスト
      </button>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>コンタクトリクエストを送る</h3>
            <p className={styles.modalDesc}>
              挨拶メッセージ（任意）を入力して送信してください。
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={styles.messageInput}
              placeholder="はじめまして。御社の工事実績を拝見し、ぜひお取引をご検討いただければと思いご連絡させていただきました。"
              rows={4}
              maxLength={500}
            />
            <p className={styles.charCount}>{message.length}/500</p>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowModal(false)}
              >
                キャンセル
              </button>
              <button
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={loading}
              >
                {loading ? '送信中...' : '送信する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
