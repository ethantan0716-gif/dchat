"use client";
import { useEffect, useMemo, useState } from "react";
import { useRef } from "react";

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
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    const timer = setInterval(() => {
      setTypingIndicator(true);
      setTimeout(() => setTypingIndicator(false), 1800);
    }, 12000);

    return () => clearInterval(timer);
  }, []);

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

  function appendEmoji(emoji: string) {
    setText((current) => `${current}${emoji}`);
    setShowEmoji(false);
  }

  function triggerAttachPicker() {
    fileInputRef.current?.click();
  }

  function onAttachSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setText((current) => `${current}${current ? " " : ""}[Attachment: ${selected.name}]`);
    event.target.value = "";
  }

  function startVoiceInput() {
    type SpeechRecognitionCtor = new () => {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onresult: ((event: unknown) => void) | null;
      onerror: ((event: { error: string }) => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
    };

    const ctor = (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition;

    if (!ctor) {
      alert("Voice input is not supported on this browser.");
      return;
    }

    const recognition = new ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = (event as { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }).results?.[0]?.[0]
        ?.transcript ?? "";
      if (transcript) {
        setText((current) => `${current}${current ? " " : ""}${transcript}`);
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    setIsListening(true);
    recognition.start();
  }

  return (
    <section className="chat-main">
      <header className="chat-header">
        <div className="chat-header-title">{headerTitle}</div>
        {headerSubtitle ? <div className="chat-header-subtitle">{headerSubtitle}</div> : null}
      </header>
      <div className="message-list">
        {sortedMessages.map((message, index) => {
          const own = message.senderId === currentUserId;
          const isLatestOwn =
            own &&
            index ===
              [...sortedMessages]
                .map((m) => m.senderId === currentUserId)
                .lastIndexOf(true);

          return (
            <article key={message.id} className={`message${own ? " own" : ""}`}>
              <div>{message.body}</div>
              <div className="message-meta">
                {message.sender.name ?? "Unknown"} · {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                {own ? <span className="message-status">{isLatestOwn ? "✓✓" : "✓"}</span> : null}
              </div>
            </article>
          );
        })}
        {typingIndicator ? (
          <div className="typing-indicator">
            <span />
            <span />
            <span />
            <em>Typing...</em>
          </div>
        ) : null}
      </div>
      <form className="chat-composer" onSubmit={handleSend}>
        <input ref={fileInputRef} type="file" hidden onChange={onAttachSelected} />
        <button
          type="button"
          className="icon-btn"
          aria-label="Emoji picker"
          onClick={() => setShowEmoji((v) => !v)}
        >
          🙂
        </button>
        <button type="button" className="icon-btn" aria-label="Attach file" onClick={triggerAttachPicker}>
          📎
        </button>
        {showEmoji ? (
          <div className="emoji-popover">
            {["😀", "😂", "😍", "👍", "🎉", "🙏", "🔥", "❤️"].map((emoji) => (
              <button key={emoji} type="button" className="emoji-btn" onClick={() => appendEmoji(emoji)}>
                {emoji}
              </button>
            ))}
          </div>
        ) : null}
        <input
          aria-label="Message"
          placeholder="Write a message"
          maxLength={2000}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="button" className="icon-btn" aria-label="Voice message" onClick={startVoiceInput}>
          {isListening ? "●" : "🎤"}
        </button>
        <button className="btn" type="submit" disabled={sending}>
          {sending ? "..." : "➤"}
        </button>
      </form>
    </section>
  );
}
