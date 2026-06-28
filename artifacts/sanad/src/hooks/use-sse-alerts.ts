import { useState, useEffect, useRef, useCallback } from "react";

export interface LabAlert {
  id: string;
  patientId: number;
  patientName: string;
  nationalId: string;
  testName: string;
  result: string;
  status: "critical" | "abnormal";
  severity: "critical" | "warning";
  title: string;
  significance: string;
  action: string;
  timestamp: string;
  read: boolean;
}

export function useSseAlerts(role: string) {
  const [alerts, setAlerts] = useState<LabAlert[]>([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!role) return;
    let destroyed = false;

    const connect = () => {
      if (destroyed) return;
      // EventSource cannot send an Authorization header, so the stream
      // endpoint accepts the JWT as a query parameter instead.
      const token = localStorage.getItem("sanad_jwt") ?? "";
      const es = new EventSource(`/api/events/stream?token=${encodeURIComponent(token)}`);
      esRef.current = es;

      es.onopen = () => setConnected(true);

      es.addEventListener("lab_alert", (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as Omit<LabAlert, "id" | "read">;
          const alert: LabAlert = {
            ...data,
            id: `${Date.now()}-${Math.random()}`,
            read: false,
          };
          setAlerts(prev => [alert, ...prev].slice(0, 50));
        } catch {
        }
      });

      es.onerror = () => {
        setConnected(false);
        es.close();
        if (!destroyed) {
          retryTimerRef.current = setTimeout(connect, 5000);
        }
      };
    };

    connect();

    return () => {
      destroyed = true;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      esRef.current?.close();
      setConnected(false);
    };
  }, [role]);

  const markRead = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  }, []);

  const clearAll = useCallback(() => setAlerts([]), []);

  const unreadCount = alerts.filter(a => !a.read).length;

  return { alerts, connected, unreadCount, markRead, clearAll };
}
