"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type RailConversation = {
  id: string;
  type: "DM" | "GROUP";
  title: string | null;
  messages: Array<{
    body: string;
    createdAt: string | Date;
  }>;
  members: Array<{
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }>;
};

function formatTime(value: string | Date | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ConversationRail({
  conversations,
  currentUserId,
}: {
  conversations: RailConversation[];
  currentUserId: string;
}) {
  const pathname = usePathname();

  return (
    <div className="rail-list">
      {conversations.map((conversation) => {
        const other = conversation.members.find((m) => m.user.id !== currentUserId);
        const name =
          conversation.type === "GROUP"
            ? conversation.title ?? "Untitled Group"
            : other?.user.name ?? other?.user.email ?? "Direct Message";
        const preview = conversation.messages[0]?.body ?? "No messages yet";
        const isActive = pathname === `/conversations/${conversation.id}`;
        const time = formatTime(conversation.messages[0]?.createdAt);

        return (
          <Link
            key={conversation.id}
            href={`/conversations/${conversation.id}`}
            className={`rail-item${isActive ? " active" : ""}`}
          >
            {conversation.type === "DM" && other?.user.image ? (
              <img className="chat-avatar-img" src={other.user.image} alt={name} />
            ) : (
              <div className={`chat-avatar ${conversation.type === "GROUP" ? "group" : "user"}`} />
            )}
            <div className="rail-item-content">
              <div className="rail-item-row">
                <div className="rail-item-name">{name}</div>
                <div className="rail-item-time">{time}</div>
              </div>
              <div className="rail-item-preview">{preview}</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
