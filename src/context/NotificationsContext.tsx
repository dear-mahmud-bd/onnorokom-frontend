"use client";

// Live-notifications React layer for the student console. Turns the FE-134 hub
// transport into feature state: connects while a student is authenticated,
// collects AssignmentPublished/GradePosted pushes into a capped in-memory list,
// and exposes unread tracking to the bell UI.
//
// Honest scope note: the backend (SignalRNotificationService.cs, BE-054) only
// pushes to students — AssignmentPublished to enrolled students of a published
// assignment, GradePosted to the submitting student. Teachers/admins receive no
// server pushes today, so this provider is mounted in the student console only.
// A future backend push can extend it to those consoles.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  createNotificationConnection,
  onAssignmentPublished,
  onGradePosted,
  startNotificationConnection,
  stopNotificationConnection,
} from "@/lib/realtime/notificationHub";
import { NOTIFICATION_METHODS, type RealtimeNotification } from "@/types";

const MAX_NOTIFICATIONS = 30;

interface NotificationsContextValue {
  notifications: RealtimeNotification[];
  unreadCount: number;
  markAllRead: () => void;
  clear: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

function makeId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const prepend = useCallback((item: RealtimeNotification) => {
    setNotifications((prev) => [item, ...prev].slice(0, MAX_NOTIFICATIONS));
    setUnreadCount((count) => count + 1);
  }, []);

  const markAllRead = useCallback(() => setUnreadCount(0), []);
  const clear = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Guards against React StrictMode's double effect invoke: only the connection
  // owned by the current effect run tears itself down, so we never leave a
  // dangling socket or double-connect.
  const connectionRef = useRef<ReturnType<
    typeof createNotificationConnection
  > | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const connection = createNotificationConnection();
    connectionRef.current = connection;

    onAssignmentPublished(connection, (payload) => {
      prepend({
        id: makeId(),
        type: "AssignmentPublished",
        receivedAt: new Date().toISOString(),
        payload,
      });
    });
    onGradePosted(connection, (payload) => {
      prepend({
        id: makeId(),
        type: "GradePosted",
        receivedAt: new Date().toISOString(),
        payload,
      });
    });

    const startPromise = startNotificationConnection(connection);

    return () => {
      connection.off(NOTIFICATION_METHODS.AssignmentPublished);
      connection.off(NOTIFICATION_METHODS.GradePosted);
      // Wait for start() to settle before stopping. Stopping mid-negotiation —
      // as React StrictMode's mount→cleanup→remount cycle would otherwise do —
      // aborts the negotiate handshake and SignalR logs a noisy "connection was
      // stopped during negotiation" error to the console.
      void startPromise.then(() => stopNotificationConnection(connection));
      if (connectionRef.current === connection) {
        connectionRef.current = null;
      }
    };
  }, [status, prepend]);

  const value = useMemo<NotificationsContextValue>(
    () => ({ notifications, unreadCount, markAllRead, clear }),
    [notifications, unreadCount, markAllRead, clear],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  }
  return ctx;
}
