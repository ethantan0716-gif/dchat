"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type InboxConversation = {
  id: string;
  type: "DM" | "GROUP";
  title: string | null;
  messages: Array<{ body: string; createdAt: string | Date }>;
  members: Array<{
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }>;
};

export function InboxList({
  conversations,
  currentUserId,
}: {
  conversations: InboxConversation[];
  currentUserId: string;
}) {
  const [query, setQuery] = useState("");

  function formatTime(value: string | Date | undefined) {
    if (!value) return "";
    const date = new Date(value);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;

    return conversations.filter((conversation) => {
      const otherMember = conversation.members.find((m) => m.user.id !== currentUserId);
      const name =
        conversation.type === "GROUP"
          ? conversation.title ?? "Untitled group"
          : otherMember?.user.name ?? otherMember?.user.email ?? "Direct message";
      const preview = conversation.messages[0]?.body ?? "";
      return name.toLowerCase().includes(q) || preview.toLowerCase().includes(q);
    });
  }, [conversations, currentUserId, query]);

  return (
    <>
      <div className="inbox-search-wrap">
        <input
          className="inbox-search-input"
          placeholder="Search chats"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="message-list inbox-list">
        {filtered.length === 0 ? (
          <div className="card">
            <h3>No matching chats</h3>
            <p className="muted">Try a different search term.</p>
          </div>
        ) : (
          filtered.map((conversation) => {
            const otherMember = conversation.members.find((m) => m.user.id !== currentUserId);
            const name =
              conversation.type === "GROUP"
                ? conversation.title ?? "Untitled group"
                : otherMember?.user.name ?? otherMember?.user.email ?? "Direct message";
            const preview = conversation.messages[0]?.body ?? "No messages yet";
            const time = formatTime(conversation.messages[0]?.createdAt);

            return (
              <Link key={conversation.id} href={`/conversations/${conversation.id}`} className="inbox-item">
                {conversation.type === "DM" && otherMember?.user.image ? (
                  <img className="chat-avatar-img" src={otherMember.user.image} alt={name} />
                ) : (
                  <div className={`chat-avatar ${conversation.type === "GROUP" ? "group" : "user"}`} />
                )}
                <div className="inbox-item-content">
                  <div className="inbox-item-row">
                    <div className="inbox-item-title">{name}</div>
                    <div className="inbox-item-time">{time}</div>
                  </div>
                  <div className="inbox-item-preview">{preview}</div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
