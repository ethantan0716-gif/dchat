import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth-helpers";
import { assertConversationMember } from "@/lib/conversation-access";
import { pusherServer } from "@/lib/pusher-server";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const formData = await request.formData();

    const socketId = String(formData.get("socket_id") ?? "");
    const channelName = String(formData.get("channel_name") ?? "");

    if (!socketId || !channelName.startsWith("private-conversation-")) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const conversationId = channelName.replace("private-conversation-", "");
    await assertConversationMember(conversationId, session.user.id);

    const auth = pusherServer.authorizeChannel(socketId, channelName);
    return NextResponse.json(auth);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}