import { useEffect, useRef, useState, useCallback } from "react";
import { Job } from "@/lib/api";

type FeedStatus = "connecting" | "connected" | "disconnected";

const MAX_RETRIES = 10;
const BASE_DELAY = 2000;

const WS_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
  .replace(/^http/, "ws");

export function useJobFeed(onNewJob: (job: Job) => void) {
  const [status, setStatus] = useState<FeedStatus>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const onNewJobRef = useRef(onNewJob);
  const retriesRef = useRef(0);
  onNewJobRef.current = onNewJob;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_URL}/ws/jobs`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      retriesRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_job" && data.job) {
          onNewJobRef.current(data.job as Job);
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
      if (retriesRef.current < MAX_RETRIES) {
        const delay = Math.min(BASE_DELAY * 2 ** retriesRef.current, 30000);
        retriesRef.current += 1;
        setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return status;
}
