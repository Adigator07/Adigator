import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import Redis from "ioredis";

const PORT = Number(process.env.REALTIME_PORT || 4010);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

type PresenceRecord = {
  userId: string;
  name: string;
  currentPage: string;
  feature: string | null;
  device: string | null;
  browser: string | null;
  sessionDurationSeconds: number;
  updatedAt: number;
};

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.get("/health", (_req, res) => res.json({ ok: true, service: "realtime" }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || "*" },
});

const redis = new Redis(REDIS_URL);
const PRESENCE_KEY = "admin:presence";

async function getPresenceMap(): Promise<Record<string, PresenceRecord>> {
  const raw = await redis.get(PRESENCE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, PresenceRecord>;
  } catch {
    return {};
  }
}

async function savePresence(map: Record<string, PresenceRecord>) {
  await redis.set(PRESENCE_KEY, JSON.stringify(map), "EX", 120);
}

function broadcastPresence(map: Record<string, PresenceRecord>) {
  const users = Object.values(map);
  io.emit("presence:update", { count: users.length, users });
}

io.on("connection", (socket) => {
  socket.on("presence:heartbeat", async (payload: Partial<PresenceRecord> & { userId: string; name: string }) => {
    if (!payload?.userId) return;
    const map = await getPresenceMap();
    map[payload.userId] = {
      userId: payload.userId,
      name: payload.name || "User",
      currentPage: payload.currentPage || "/",
      feature: payload.feature || null,
      device: payload.device || null,
      browser: payload.browser || null,
      sessionDurationSeconds: payload.sessionDurationSeconds || 0,
      updatedAt: Date.now(),
    };
    await savePresence(map);
    broadcastPresence(map);
  });

  socket.on("disconnect", async () => {
    // Stale entries expire via Redis TTL + periodic cleanup
  });
});

setInterval(async () => {
  const map = await getPresenceMap();
  const now = Date.now();
  let changed = false;
  for (const [id, rec] of Object.entries(map)) {
    if (now - rec.updatedAt > 45000) {
      delete map[id];
      changed = true;
    }
  }
  if (changed) {
    await savePresence(map);
    broadcastPresence(map);
  } else {
    broadcastPresence(map);
  }
}, 5000);

httpServer.listen(PORT, () => {
  console.log(`[realtime] Socket.io server on :${PORT}`);
});
