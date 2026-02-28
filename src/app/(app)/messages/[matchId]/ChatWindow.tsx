'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './chat.module.css';
import { formatRelativeTime } from '@/lib/utils/format';

interface MessageUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_company_id: string;
  sender_user: MessageUser | null;
}

interface ChatWindowProps {
  matchId: string;
  initialMessages: Message[];
  myCompanyId: string;
  currentUserId: string;
}

export default function ChatWindow({
  matchId,
  initialMessages,
  myCompanyId,
  currentUserId,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 最下部へスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Supabase Realtimeで新着メッセージを受信
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          // 自分が送ったメッセージは既に追加済みなのでスキップ
          if (newMsg.sender_company_id === myCompanyId) return;

          // ユーザー情報を取得
          const { data: userData } = await supabase
            .from('users')
            .select('id, full_name, avatar_url')
            .eq('id', (newMsg as unknown as { sender_user_id: string }).sender_user_id)
            .single();

          setMessages((prev) => [
            ...prev,
            { ...newMsg, sender_user: userData as MessageUser | null },
          ]);

          // 既読にする
          await supabase
            .from('messages')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('id', newMsg.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, myCompanyId]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput('');

    try {
      const res = await fetch(`/api/messages/${matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const { data } = await res.json();
        setMessages((prev) => [...prev, data]);
      }
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={styles.chatContainer}>
      {/* メッセージリスト */}
      <div className={styles.messageList}>
        {messages.length === 0 && (
          <div className={styles.emptyChat}>
            <p>まだメッセージがありません。最初のメッセージを送ってみましょう！</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMine = msg.sender_company_id === myCompanyId;
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const showTime = !prevMsg ||
            new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000;

          return (
            <div key={msg.id}>
              {showTime && (
                <div className={styles.timeDivider}>
                  <span>{formatRelativeTime(msg.created_at)}</span>
                </div>
              )}
              <div className={`${styles.messageBubbleWrapper} ${isMine ? styles.mine : styles.theirs}`}>
                {!isMine && (
                  <div className={styles.senderAvatar}>
                    {msg.sender_user?.full_name?.charAt(0) ?? '?'}
                  </div>
                )}
                <div className={styles.bubbleGroup}>
                  {!isMine && msg.sender_user?.full_name && (
                    <p className={styles.senderName}>{msg.sender_user.full_name}</p>
                  )}
                  <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      <div className={styles.inputArea}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.input}
          placeholder="メッセージを入力... (Cmd/Ctrl + Enter で送信)"
          rows={3}
          maxLength={2000}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className={styles.sendBtn}
        >
          {sending ? (
            <span className={styles.spinner} />
          ) : (
            '送信'
          )}
        </button>
      </div>
    </div>
  );
}
