import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as Notifications from "expo-notifications";
import { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

export type Timer = {
  id: string;
  title: string;
  duration: number;
  remainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  endTime: number | null;
  notificationId?: string | null;
  hasNotified?: boolean; // ⭐ evita doppio suono
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

  // ==================== NOTIFICHE ====================
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Canale Android
  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("timer-channel", {
        name: "Timer",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
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
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        repeats: false,
        channelId: "timer-channel",
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

  // Richiesta permessi
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("Permessi notifica NON concessi");
      }
    })();
  }, []);

  useEffect(() => {
    setTimers((prev) => {
      const exists = prev.some((t) => t.id === "quick");
      if (exists) return prev;

      return [
        {
          id: "quick",
          title: "Quick Timer",
          duration: 0,
          remainingSeconds: 0,
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
              hasNotified: false, // ⭐ reset
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
              hasNotified: false, // ⭐ reset
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

          // ⭐ Timer già finito nel passato → NON suonare di nuovo
          if (t.endTime && Date.now() > t.endTime && !t.hasNotified) {
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

          // ⭐ Timer che finisce ORA
          if (remaining === 0) {
            if (!t.hasNotified) {
              playSound();
            }

            return {
              ...t,
              isRunning: false,
              isPaused: false,
              remainingSeconds: 0,
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
