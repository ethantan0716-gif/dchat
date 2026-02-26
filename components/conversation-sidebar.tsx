"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function ConversationSidebar() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  const canCreate = useMemo(() => title.trim().length > 0, [title]);

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
          type: "GROUP",
          participantIds: [],
          title: title.trim(),
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Could not create chat");
      }

      const body = (await response.json()) as { conversation: { id: string } };
      setTitle("");
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
        <h3 style={{ margin: 0, fontSize: "1rem" }}>New group chat</h3>
        <input placeholder="Group title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
        <p className="muted" style={{ margin: 0, fontSize: "0.8rem" }}>
          Members will join privately with the join code after this group is created.
        </p>

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
