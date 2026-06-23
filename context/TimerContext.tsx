import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as Notifications from "expo-notifications";
import { createContext, useContext, useEffect, useState } from "react";
import { AppState, Platform } from "react-native";

export type Timer = {
  id: string;
  title: string;
  duration: number;
  remainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  endTime: number | null;
  notificationId?: string | null;
  hasNotified?: boolean;
};

type TimerContextType = {
  timers: Timer[];
  setTimers: React.Dispatch<React.SetStateAction<Timer[]>>;
  addTimer: (title: string, duration: number) => void;
  startTimer: (id: string) => void;
  pauseTimer: (id: string) => void;
  resumeTimer: (id: string) => void;
  resetTimer: (id: string) => void;
  deleteTimer: (id: string) => void;
};

const TimerContext = createContext<TimerContextType>(null as any);
export const useTimers = () => useContext(TimerContext);

export function TimerProvider({ children }: any) {
  const [timers, setTimers] = useState<Timer[]>([]);

  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener("change", setAppState);
    return () => sub.remove();
  }, []);

  // ==================== NOTIFICHE ====================
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("timer-channel", {
        name: "Timer",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
      });
    }
  }, []);

  async function scheduleTimerNotification(seconds: number, title: string) {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "Timer terminato",
        body: title,
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(Date.now() + seconds * 1000),
      },
    });
  }

  async function cancelNotification(id?: string | null) {
    if (id) {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch {}
    }
  }

  // ==================== SUONO ====================
  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(
      require("../assets/notifications/timer_end.wav"),
    );
    await sound.playAsync();
  }

  // ==================== STORAGE ====================
  useEffect(() => {
    AsyncStorage.getItem("timers").then((data) => {
      if (data) setTimers(JSON.parse(data));
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("timers", JSON.stringify(timers));
  }, [timers]);

  // Permessi
  useEffect(() => {
    (async () => {
      await Notifications.requestPermissionsAsync();
    })();
  }, []);

  useEffect(() => {
    if (appState === "active") {
      timers.forEach((t) => {
        if (t.notificationId) {
          cancelNotification(t.notificationId);
        }
      });
    }
  }, [appState]);

  // Quick timer auto-create
  useEffect(() => {
    setTimers((prev) => {
      const exists = prev.some((t) => t.id === "quick");
      if (exists) return prev;

      const initial = 300; // ⭐ 5 minuti di default

      return [
        {
          id: "quick",
          title: "Quick Timer",
          duration: initial,
          remainingSeconds: initial,
          isRunning: false,
          isPaused: false,
          endTime: null,
          notificationId: null,
          hasNotified: false,
        },
        ...prev,
      ];
    });
  }, []);

  // ==================== ADD ====================
  const addTimer = (title: string, duration: number) => {
    const newTimer: Timer = {
      id: Date.now().toString(),
      title,
      duration,
      remainingSeconds: duration,
      isRunning: false,
      isPaused: false,
      endTime: null,
      notificationId: null,
      hasNotified: false,
    };
    setTimers((prev) => [...prev, newTimer]);
  };

  // ==================== START ====================
  const startTimer = async (id: string) => {
    const timer = timers.find((t) => t.id === id);
    if (!timer) return;

    const endTime = Date.now() + timer.remainingSeconds * 1000;

    // ⭐ Scheduliamo SEMPRE la notifica
    const notificationId = await scheduleTimerNotification(
      timer.remainingSeconds,
      timer.title,
    );

    setTimers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              isRunning: true,
              isPaused: false,
              endTime,
              notificationId,
              hasNotified: false,
            }
          : t,
      ),
    );
  };

  // ==================== PAUSE ====================
  const pauseTimer = async (id: string) => {
    const timer = timers.find((t) => t.id === id);
    if (!timer) return;

    await cancelNotification(timer.notificationId);

    const remaining = Math.max(
      0,
      Math.floor((timer.endTime! - Date.now()) / 1000),
    );

    setTimers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              isRunning: false,
              isPaused: true,
              remainingSeconds: remaining,
              endTime: null,
              notificationId: null,
            }
          : t,
      ),
    );
  };

  // ==================== RESUME ====================
  const resumeTimer = async (id: string) => {
    const timer = timers.find((t) => t.id === id);
    if (!timer) return;

    const endTime = Date.now() + timer.remainingSeconds * 1000;

    const notificationId = await scheduleTimerNotification(
      timer.remainingSeconds,
      timer.title,
    );

    setTimers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              isRunning: true,
              isPaused: false,
              endTime,
              notificationId,
              hasNotified: false,
            }
          : t,
      ),
    );
  };

  // ==================== RESET ====================
  const resetTimer = async (id: string) => {
    const timer = timers.find((t) => t.id === id);
    if (!timer) return;

    await cancelNotification(timer.notificationId);

    setTimers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              isRunning: false,
              isPaused: false,
              remainingSeconds: t.duration,
              endTime: null,
              notificationId: null,
              hasNotified: false,
            }
          : t,
      ),
    );
  };

  // ==================== DELETE ====================
  const deleteTimer = async (id: string) => {
    const timer = timers.find((t) => t.id === id);
    if (timer) await cancelNotification(timer.notificationId);

    setTimers((prev) => prev.filter((t) => t.id !== id));
  };

  // ==================== COUNTDOWN ====================
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) =>
        prev.map((t) => {
          if (!t.isRunning || !t.endTime) return t;

          const remaining = Math.max(
            0,
            Math.floor((t.endTime - Date.now()) / 1000),
          );

          if (remaining === 0 && !t.hasNotified) {
            playSound();

            // ⭐ Cancella la notifica se l’app è in foreground
            if (t.notificationId) {
              cancelNotification(t.notificationId);
            }

            return {
              ...t,
              remainingSeconds: 0,
              isRunning: false,
              isPaused: false,
              endTime: null,
              notificationId: null,
              hasNotified: true,
            };
          }

          return { ...t, remainingSeconds: remaining };
        }),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <TimerContext.Provider
      value={{
        timers,
        setTimers,
        addTimer,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        deleteTimer,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}
