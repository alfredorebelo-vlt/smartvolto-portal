const BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export function isSlackConfigured() {
  return !!(BOT_TOKEN && WEBHOOK_URL);
}

// Envia mensagem via Incoming Webhook (para anúncios)
export async function sendWebhookMessage(payload: object): Promise<boolean> {
  if (!WEBHOOK_URL) return false;
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Chama a Slack Web API com Bot Token (POST JSON — maioria dos métodos)
async function slackApi<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T | null> {
  if (!BOT_TOKEN) return null;
  try {
    const res = await fetch(`https://slack.com/api/${method}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BOT_TOKEN}`,
      },
      body: JSON.stringify(params),
    });
    const data = await res.json() as { ok: boolean } & T;
    if (!data.ok) return null;
    return data;
  } catch {
    return null;
  }
}

// Alguns métodos Slack apenas aceitam GET com query string (ex: users.lookupByEmail)
async function slackApiGet<T = unknown>(method: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!BOT_TOKEN) return null;
  try {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`https://slack.com/api/${method}?${qs}`, {
      headers: { Authorization: `Bearer ${BOT_TOKEN}` },
    });
    const data = await res.json() as { ok: boolean } & T;
    if (!data.ok) return null;
    return data;
  } catch {
    return null;
  }
}

// Busca mensagens recentes de um canal (exclui mensagens de sistema via subtype)
export async function getChannelMessages(channelId: string, limit = 10) {
  const data = await slackApi<{
    messages: {
      ts: string;
      text: string;
      user?: string;
      bot_id?: string;
      subtype?: string;
      attachments?: { text?: string }[];
      blocks?: unknown[];
    }[];
  }>("conversations.history", { channel: channelId, limit });

  return (data?.messages ?? []).filter((m) => !m.subtype);
}

// Busca info de um utilizador pelo email
export async function getSlackUserByEmail(email: string): Promise<{ id: string; name: string; real_name: string; teamId?: string } | null> {
  const data = await slackApiGet<{ user: { id: string; name: string; real_name: string; team_id?: string } }>(
    "users.lookupByEmail",
    { email }
  );
  if (!data?.user) return null;
  return { id: data.user.id, name: data.user.name, real_name: data.user.real_name, teamId: data.user.team_id };
}

// Busca o nome de um utilizador Slack pelo ID
export async function getSlackUserName(userId: string): Promise<string | null> {
  const data = await slackApiGet<{ user: { real_name?: string; name?: string } }>(
    "users.info",
    { user: userId }
  );
  return data?.user?.real_name ?? data?.user?.name ?? null;
}

// Formata um anúncio para envio ao Slack via webhook
export function formatAnnouncementMessage(params: {
  title: string;
  content: string;
  authorName: string;
  category?: string | null;
  portalUrl: string;
}) {
  const plain = params.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const preview = plain.length > 300 ? plain.slice(0, 300) + "…" : plain;
  const categoryEmoji: Record<string, string> = {
    milestone: "🏆",
    launch: "🚀",
    people: "👥",
    ops: "⚙️",
    tech: "💻",
  };
  const emoji = params.category ? (categoryEmoji[params.category] ?? "📢") : "📢";

  return {
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: `${emoji} ${params.title}`, emoji: true },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: preview },
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: `Publicado por *${params.authorName}*` },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Ver no portal", emoji: true },
            url: params.portalUrl,
            style: "primary",
          },
        ],
      },
    ],
  };
}
