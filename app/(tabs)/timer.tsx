// app/(tabs)/timer.tsx

import Input from "@/components/Input";
import Text from "@/components/Text";
import { COLORS } from "@/constants/colors";
import { useTimers } from "@/context/TimerContext";
import { Ionicons } from "@expo/vector-icons";
import * as KeepAwake from "expo-keep-awake";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ImageBackground,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function TimerScreen() {
  const { timers, addTimer, startTimer, pauseTimer, resetTimer, deleteTimer } =
    useTimers();

  // ==================== QUICK TIMER ====================
  const [quickTimeLeft, setQuickTimeLeft] = useState(300);
  const [initialQuickTime, setInitialQuickTime] = useState(300);
  const [isQuickRunning, setIsQuickRunning] = useState(false);
  const quickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ==================== EDIT DIRETTO ====================
  const [isEditingQuick, setIsEditingQuick] = useState(false);
  const [quickInput, setQuickInput] = useState("05:00");

  // ==================== ANIMAZIONE SPICCHI ====================
  const slices = 24;
  const sliceAnim = useRef(new Animated.Value(0)).current;

  // ==================== COUNTDOWN ANIM ====================
  const countdownScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (quickTimeLeft <= 10 && quickTimeLeft > 0) {
      Animated.sequence([
        Animated.timing(countdownScale, {
          toValue: 1.25,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(countdownScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [quickTimeLeft]);

  // ==================== KEEP AWAKE ====================
  useEffect(() => {
    const active = isQuickRunning || timers.some((t) => t.isRunning);
    active
      ? KeepAwake.activateKeepAwakeAsync("timers")
      : KeepAwake.deactivateKeepAwake("timers");
  }, [isQuickRunning, timers]);

  // ==================== COUNTDOWN ====================
  useEffect(() => {
    if (isQuickRunning && quickTimeLeft > 0) {
      quickTimerRef.current = setInterval(() => {
        setQuickTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(quickTimerRef.current!);
            setIsQuickRunning(false);
            sliceAnim.setValue(1);
            return 0;
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(quickTimerRef.current!);
  }, [isQuickRunning]);

  // ==================== START / STOP ====================
  const toggleQuickTimer = () => {
    if (!isQuickRunning) {
      // ⭐ Se stai avviando il timer
      sliceAnim.stopAnimation((currentValue) => {
        const remainingSeconds = quickTimeLeft * (1 - currentValue);

        Animated.timing(sliceAnim, {
          toValue: 1,
          duration: remainingSeconds * 1000,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start();
      });
    } else {
      // ⭐ Se stai mettendo in pausa
      sliceAnim.stopAnimation();
    }

    setIsQuickRunning(!isQuickRunning);
  };

  const resetQuickTimer = () => {
    clearInterval(quickTimerRef.current!);
    setIsQuickRunning(false);
    setQuickTimeLeft(300);
    setInitialQuickTime(300);
    sliceAnim.setValue(0);
    setQuickInput("05:00");
  };

  // ==================== EDIT DIRETTO ====================
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    setQuickInput(formatTime(quickTimeLeft));
  }, [quickTimeLeft]);

  const parseQuickInput = (v: string) => {
    const [m, s] = v.split(":").map((x) => parseInt(x) || 0);
    return m * 60 + s;
  };

  const confirmQuickInput = () => {
    const total = parseQuickInput(quickInput);
    if (total <= 0) {
      setQuickInput(formatTime(quickTimeLeft));
      setIsEditingQuick(false);
      return;
    }

    clearInterval(quickTimerRef.current!);
    setIsQuickRunning(false);
    sliceAnim.setValue(0);

    setQuickTimeLeft(total);
    setInitialQuickTime(total);

    setIsEditingQuick(false);
  };

  // ==================== FORM NUOVO TIMER ====================
  const [newTitle, setNewTitle] = useState("");
  const [newMinutes, setNewMinutes] = useState("");
  const [newSeconds, setNewSeconds] = useState("");

  const addNewTimer = () => {
    const minutes = parseInt(newMinutes) || 0;
    const seconds = parseInt(newSeconds) || 0;
    const total = minutes * 60 + seconds;

    if (!newTitle.trim() || total <= 0) return;

    addTimer(newTitle.trim(), total);

    setNewTitle("");
    setNewMinutes("");
    setNewSeconds("");
  };

  // ==================== TIMER SALVATI ====================
  const handleToggleSavedTimer = (timer: any) => {
    if (timer.isRunning) pauseTimer(timer.id);
    else startTimer(timer.id);
  };

  const handleResetSavedTimer = (timer: any) => resetTimer(timer.id);
  const handleDeleteSavedTimer = (timer: any) => deleteTimer(timer.id);

  // ==================== GENERA SPICCHI SVG ====================
  const generateSlicePath = (index: number) => {
    const cx = 512;
    const cy = 512;
    const r = 512;

    const startAngle = (index * 15 * Math.PI) / 180;
    const endAngle = ((index + 1) * 15 * Math.PI) / 180;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);

    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    return `
      M ${cx} ${cy}
      L ${x1} ${y1}
      L ${x2} ${y2}
      Z
    `;
  };

  // ==================== RENDER ====================
  const timerColor =
    quickTimeLeft <= 10 && quickTimeLeft > 0 ? "#e74c3c" : COLORS.text;

  return (
    <ImageBackground
      source={require("../../assets/images/sfondo.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={styles.header}>
            {/* <Image
              source={require("../../assets/images/timer.png")}
              style={styles.icon}
              resizeMode="contain"
            /> */}
            <Text bold style={styles.title}>
              Timer
            </Text>
          </View>

          {/* ==================== TORTA ==================== */}
          <View style={styles.cakeWrapper}>
            <ImageBackground
              source={require("../../assets/images/torta.png")}
              style={styles.cakeImage}
            >
              <Svg width={1024} height={1024} style={styles.svgOverlay}>
                {[...Array(slices)].map((_, i) => {
                  const opacity = sliceAnim.interpolate({
                    inputRange: [i / slices, (i + 1) / slices],
                    outputRange: [0, 1],
                    extrapolate: "clamp",
                  });

                  const stepOpacity = opacity.interpolate({
                    inputRange: [0, 0.999, 1],
                    outputRange: [0, 0, 1],
                  });

                  return (
                    <AnimatedPath
                      key={i}
                      d={generateSlicePath(i)}
                      fill="#fffaf0"
                      opacity={stepOpacity}
                    />
                  );
                })}
              </Svg>
            </ImageBackground>

            {/* ==================== TESTO + PILL ==================== */}
            <View style={styles.textOverlay}>
              <View style={styles.pill}>
                <Animated.View
                  style={{ transform: [{ scale: countdownScale }] }}
                >
                  {isEditingQuick ? (
                    <Input
                      style={[styles.timerTextInput, { color: timerColor }]}
                      value={quickInput}
                      onChangeText={setQuickInput}
                      keyboardType="numeric"
                      autoFocus
                      onBlur={confirmQuickInput}
                      onSubmitEditing={confirmQuickInput}
                      maxLength={5}
                    />
                  ) : (
                    <TouchableOpacity onPress={() => setIsEditingQuick(true)}>
                      <Text
                        bold
                        style={[styles.timerText, { color: timerColor }]}
                      >
                        {formatTime(quickTimeLeft)}
                      </Text>
                    </TouchableOpacity>
                  )}
                </Animated.View>
              </View>
            </View>
          </View>

          {/* CONTROLLI */}
          <View style={styles.quickControls}>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={toggleQuickTimer}
            >
              <Ionicons
                name={isQuickRunning ? "pause" : "play"}
                size={36}
                color="white"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickBtn} onPress={resetQuickTimer}>
              <Ionicons name="refresh" size={36} color="white" />
            </TouchableOpacity>
          </View>

          {/* ==================== NUOVO TIMER ==================== */}

          <View style={styles.formCard}>
            <Text variant="title" style={styles.sectionTitle}>
              Nuovo Timer
            </Text>
            <View style={styles.separator} />

            <Input
              style={styles.input}
              placeholder="Titolo (es. Lievitazione)"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <View style={styles.timeRow}>
              <Input
                style={styles.timeInput}
                placeholder="Min"
                value={newMinutes}
                onChangeText={setNewMinutes}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.colon}>:</Text>
              <Input
                style={styles.timeInput}
                placeholder="Sec"
                value={newSeconds}
                onChangeText={setNewSeconds}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            <TouchableOpacity style={styles.addButton} onPress={addNewTimer}>
              <Ionicons name="add-circle" size={28} color="white" />
              <Text bold style={styles.addButtonText}>
                Aggiungi Timer
              </Text>
            </TouchableOpacity>
          </View>

          {/* ==================== TIMER SALVATI ==================== */}

          <View style={styles.savedCard}>
            <Text variant="title" style={styles.sectionTitle}>
              Timer Salvati
            </Text>
            <View style={styles.separator} />

            {timers.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="timer-outline" size={70} color="#ccc" />
                <Text style={styles.emptyText}>Nessun timer salvato</Text>
              </View>
            ) : (
              timers.map((timer: any, index: number) => (
                <View key={timer.id}>
                  <View style={styles.timerItem}>
                    <View style={styles.timerInfo}>
                      <Text bold style={styles.timerTitle}>
                        {timer.title}
                      </Text>
                      <Text style={styles.timerTime}>
                        {formatTime(timer.remainingSeconds)}
                      </Text>
                    </View>

                    <View style={styles.timerControls}>
                      <TouchableOpacity
                        onPress={() => handleToggleSavedTimer(timer)}
                      >
                        <Ionicons
                          name={
                            timer.isRunning
                              ? timer.isPaused
                                ? "play"
                                : "pause"
                              : "play"
                          }
                          size={32}
                          color={
                            timer.isRunning
                              ? timer.isPaused
                                ? COLORS.primary
                                : "#e74c3c"
                              : COLORS.primary
                          }
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleResetSavedTimer(timer)}
                      >
                        <Ionicons name="refresh" size={32} color="#7f8c8d" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDeleteSavedTimer(timer)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={28}
                          color="#e74c3c"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {index < timers.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

// ==================== STILI ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#fffaf0",
    paddingTop: 50,
    marginBottom: -60,
  },
  header: {
    // paddingVertical: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    padding: 15,
    textAlign: "center",
    marginBottom: 20,
    color: "#000000",
  },
  icon: {
    height: 60,
    width: 60,
    marginBottom: 10,
  },
  screenTitle: {
    fontSize: 28,
    textAlign: "center",
    marginBottom: 20,
  },

  cakeWrapper: {
    width: 300,
    height: 300,
    alignSelf: "center",
    marginVertical: 20,
  },

  cakeImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  svgOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    transform: [{ scale: 300 / 1024 }],
  },

  textOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "box-none",
  },

  pill: {
    backgroundColor: "rgb(255, 255, 255)",
    paddingHorizontal: 8,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  timerText: {
    fontSize: 64,
    lineHeight: 64,
  },

  timerTextInput: {
    fontSize: 56,
    fontFamily: "Outfit-SemiBold",
    textAlign: "center",
    borderBottomWidth: 2,
    borderColor: "#ddd",
    minWidth: 160,
    lineHeight: 56,
  },

  quickControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 10,
    marginBottom: 30,
  },

  quickBtn: {
    width: 70,
    height: 70,
    backgroundColor: COLORS.primary,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },

  // ==================== CARD NUOVO TIMER ====================
  sectionTitle: {
    fontSize: 22,
    textAlign: "center",
    marginBottom: 12,
    color: COLORS.text,
  },

  formCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  input: {
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 12,
    fontSize: 18,
    marginBottom: 12,
    textAlign: "center",
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  timeInput: {
    width: 90,
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 12,
    fontSize: 24,
    textAlign: "center",
  },

  colon: { fontSize: 32, color: "#666", marginHorizontal: 10 },

  addButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  addButtonText: { color: "white", fontSize: 18 },

  // ==================== CARD TIMER SALVATI ====================
  savedCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  timerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },

  timerInfo: { flex: 1 },

  timerTitle: {
    fontSize: 18,
    marginBottom: 4,
  },

  timerTime: {
    fontSize: 28,
    color: COLORS.primary,
  },

  timerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 14,
  },

  empty: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },

  emptyText: {
    fontSize: 18,
    color: "#888",
    marginTop: 16,
  },
  bg: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});
