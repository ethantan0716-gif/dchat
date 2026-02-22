"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { createPusherClient } from "@/lib/pusher-client";
import { conversationChannel } from "@/lib/pusher-shared";

type Sender = {
  id: string;
  name: string | null;
  image: string | null;
};

type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender: Sender;
};

export function ChatRoom({
  conversationId,
  currentUserId,
  headerTitle,
  headerSubtitle,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  headerTitle: string;
  headerSubtitle?: string;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, conversationId]);

  useEffect(() => {
    const client = createPusherClient();
    const channel = client.subscribe(conversationChannel(conversationId));

    channel.bind("message:new", (incoming: ChatMessage) => {
      setMessages((current) => {
        if (current.some((m) => m.id === incoming.id)) {
          return current;
        }
        return [...current, incoming];
      });
    });

    return () => {
      channel.unbind_all();
      client.unsubscribe(conversationChannel(conversationId));
      client.disconnect();
    };
  }, [conversationId]);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages],
  );

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = text.trim();
    if (!body || sending) return;

    setSending(true);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });

      if (!response.ok) {
        throw new Error("Failed to send");
      }

      const data = (await response.json()) as { message: ChatMessage };
      setMessages((current) => (current.some((m) => m.id === data.message.id) ? current : [...current, data.message]));
      setText("");

      await fetch(`/api/conversations/${conversationId}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastReadMessageId: data.message.id }),
      });
    } catch (error) {
      console.error(error);
      alert("Message failed to send.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="chat-main">
      <header className="chat-header">
        <div style={{ marginBottom: 8 }}>
          <Link href="/conversations" className="btn btn-secondary" style={{ display: "inline-block" }}>
            Back to Chats
          </Link>
        </div>
        <div className="chat-header-title">{headerTitle}</div>
        {headerSubtitle ? <div className="chat-header-subtitle">{headerSubtitle}</div> : null}
      </header>
      <div className="message-list">
        {sortedMessages.map((message) => {
          const own = message.senderId === currentUserId;

          return (
            <article key={message.id} className={`message${own ? " own" : ""}`}>
              <div>{message.body}</div>
              <div className="message-meta">
                {message.sender.name ?? "Unknown"} - {new Date(message.createdAt).toLocaleTimeString()}
              </div>
            </article>
          );
        })}
      </div>
      <form className="chat-composer" onSubmit={handleSend}>
        <input
          aria-label="Message"
          placeholder="Write a message"
          maxLength={2000}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn" type="submit" disabled={sending}>
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}
