import AsyncStorage from "@react-native-async-storage/async-storage";
// import { Audio } from "expo-av";
// import * as Notifications from "expo-notifications";
import { createContext, useContext, useEffect, useState } from "react";

export type Timer = {
  id: string;
  title: string;
  duration: number;
  remainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  endTime: number | null;
};

type TimerContextType = {
  timers: Timer[];
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

  // Carica timer salvati
  useEffect(() => {
    AsyncStorage.getItem("timers").then((data) => {
      if (data) setTimers(JSON.parse(data));
    });
  }, []);

  // Salva timer
  useEffect(() => {
    AsyncStorage.setItem("timers", JSON.stringify(timers));
  }, [timers]);

  // Suono finale
  // async function playSound() {
  //   const { sound } = await Audio.Sound.createAsync(
  //     require("../assets/sounds/timer-end.mp3"),
  //   );
  //   await sound.playAsync();
  // }

  // Notifica finale
  async function scheduleTimerNotification(seconds: number, title: string) {
    // return await Notifications.scheduleNotificationAsync({
    //   content: {
    //     title: "Timer terminato",
    //     body: title,
    //     sound: true,
    //   },
    //   trigger: {
    //     type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    //     seconds,
    //     repeats: false,
    //   },
    // });
  }

  const addTimer = (title: string, duration: number) => {
    const newTimer: Timer = {
      id: Date.now().toString(),
      title,
      duration,
      remainingSeconds: duration,
      isRunning: false,
      isPaused: false,
      endTime: null,
    };
    setTimers((prev) => [...prev, newTimer]);
  };

  const startTimer = (id: string) => {
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              isRunning: true,
              isPaused: false,
              endTime: Date.now() + t.remainingSeconds * 1000,
            }
          : t,
      ),
    );

    const timer = timers.find((t) => t.id === id);
    // if (timer) scheduleTimerNotification(timer.remainingSeconds, timer.title);
  };

  const pauseTimer = (id: string) => {
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              isRunning: false,
              isPaused: true,
              remainingSeconds: Math.max(
                0,
                Math.floor((t.endTime! - Date.now()) / 1000),
              ),
              endTime: null,
            }
          : t,
      ),
    );
  };

  const resumeTimer = (id: string) => {
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              isRunning: true,
              isPaused: false,
              endTime: Date.now() + t.remainingSeconds * 1000,
            }
          : t,
      ),
    );

    const timer = timers.find((t) => t.id === id);
    // if (timer) scheduleTimerNotification(timer.remainingSeconds, timer.title);
  };

  const resetTimer = (id: string) => {
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              isRunning: false,
              isPaused: false,
              remainingSeconds: t.duration,
              endTime: null,
            }
          : t,
      ),
    );
  };

  const deleteTimer = (id: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  };

  // Aggiorna i timer ogni secondo
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) =>
        prev.map((t) => {
          if (!t.isRunning || !t.endTime) return t;

          const remaining = Math.max(
            0,
            Math.floor((t.endTime - Date.now()) / 1000),
          );

          if (remaining === 0) {
            // playSound();
            return {
              ...t,
              isRunning: false,
              isPaused: false,
              remainingSeconds: 0,
              endTime: null,
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
