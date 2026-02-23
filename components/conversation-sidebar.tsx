"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function ConversationSidebar({
  users,
}: {
  users: Array<{
    id: string;
    name: string | null;
    email: string;
  }>;
}) {
  const router = useRouter();
  const [type, setType] = useState<"DM" | "GROUP">("DM");
  const [title, setTitle] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  const canCreate = useMemo(() => {
    if (type === "DM") {
      return participantIds.length === 1;
    }

    return title.trim().length > 0;
  }, [participantIds.length, title, type]);

  function toggleParticipant(userId: string) {
    setParticipantIds((current) => {
      if (type === "DM") {
        return [userId];
      }
      if (current.includes(userId)) {
        return current.filter((id) => id !== userId);
      }
      return [...current, userId];
    });
  }

  async function createConversation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreate || submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          participantIds,
          ...(type === "GROUP" ? { title: title.trim() } : {}),
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Could not create chat");
      }

      const body = (await response.json()) as { conversation: { id: string } };
      setTitle("");
      setParticipantIds([]);
      router.push(`/conversations/${body.conversation.id}`);
      router.refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create chat");
    } finally {
      setSubmitting(false);
    }
  }

  async function joinConversation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!joinCode.trim() || joining) {
      return;
    }

    setJoining(true);
    setJoinError("");

    try {
      const response = await fetch("/api/conversations/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          joinCode: joinCode.trim().toUpperCase(),
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Could not join chat");
      }

      const body = (await response.json()) as { conversationId: string };
      setJoinCode("");
      router.push(`/conversations/${body.conversationId}`);
      router.refresh();
    } catch (joinConversationError) {
      setJoinError(joinConversationError instanceof Error ? joinConversationError.message : "Could not join chat");
    } finally {
      setJoining(false);
    }
  }

  return (
    <>
      <form className="create-chat-form" onSubmit={createConversation}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>New chat</h3>
        <label className="muted" htmlFor="chat-type" style={{ fontSize: "0.85rem" }}>
          Type
        </label>
        <select
          id="chat-type"
          value={type}
          onChange={(e) => {
            const nextType = e.target.value === "GROUP" ? "GROUP" : "DM";
            setType(nextType);
            setParticipantIds([]);
          }}
        >
          <option value="DM">Direct message</option>
          <option value="GROUP">Group</option>
        </select>

        {type === "GROUP" ? (
          <input
            placeholder="Group title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
        ) : null}

        <div className="participant-list">
          {users.length === 0 && type === "DM" ? (
            <p className="muted" style={{ margin: 0, fontSize: "0.8rem" }}>
              No other users found yet. Ask family to sign in once first.
            </p>
          ) : (
            <>
              {type === "GROUP" ? (
                <p className="muted" style={{ margin: 0, fontSize: "0.8rem" }}>
                  Optional: select members now, or let them join later with a code.
                </p>
              ) : null}
              {users.map((user) => {
                const checked = participantIds.includes(user.id);
                return (
                  <label key={user.id} className="participant-item">
                    <input
                      type={type === "DM" ? "radio" : "checkbox"}
                      name="participant"
                      checked={checked}
                      onChange={() => toggleParticipant(user.id)}
                    />
                    <span>{user.name ?? user.email}</span>
                  </label>
                );
              })}
            </>
          )}
        </div>

        {error ? (
          <p style={{ margin: 0, color: "#b42318", fontSize: "0.8rem" }}>
            {error}
          </p>
        ) : null}

        <button className="btn" type="submit" disabled={!canCreate || submitting}>
          {submitting ? "Creating..." : "Create chat"}
        </button>
      </form>
      <form className="create-chat-form" onSubmit={joinConversation}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>Join group chat</h3>
        <input
          placeholder="Enter join code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          maxLength={12}
        />
        {joinError ? (
          <p style={{ margin: 0, color: "#b42318", fontSize: "0.8rem" }}>
            {joinError}
          </p>
        ) : null}
        <button className="btn" type="submit" disabled={joining || joinCode.trim().length < 6}>
          {joining ? "Joining..." : "Join with code"}
        </button>
      </form>

    </>
  );
}
