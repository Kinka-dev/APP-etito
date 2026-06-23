// app/(tabs)/timer.tsx
import Input from "@/components/Input";
import Text from "@/components/Text";
import { COLORS } from "@/constants/colors";
import { useTimers } from "@/context/TimerContext";
import { Ionicons } from "@expo/vector-icons";
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

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

function parseQuickInput(v: string) {
  const [m, s] = v.split(":").map((x) => parseInt(x) || 0);
  return m * 60 + s;
}

export default function TimerScreen() {
  const {
    timers,
    setTimers,
    addTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    resumeTimer,
    deleteTimer,
  } = useTimers();

  const quick = timers.find((t) => t.id === "quick");

  // Crea il quick timer se non esiste ancora
  useEffect(() => {
    if (!quick) {
      setTimers((prev) => [
        ...prev,
        {
          id: "quick",
          title: "Quick",
          duration: 300,
          remainingSeconds: 300,
          isRunning: false,
          isPaused: false,
          endTime: null,
          notificationId: null,
          hasNotified: false,
        },
      ]);
    }
  }, [quick, setTimers]);

  // ==================== EDIT DIRETTO QUICK ====================
  const [isEditingQuick, setIsEditingQuick] = useState(false);
  const [quickInput, setQuickInput] = useState(
    formatTime(quick?.remainingSeconds ?? 300),
  );

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const zoomAnim = useRef(new Animated.Value(1)).current;

  const shake = () => {
    shakeAnim.setValue(0);
    zoomAnim.setValue(1);

    const sequence = [];

    // 12 oscillazioni
    for (let i = 0; i < 12; i++) {
      sequence.push(
        Animated.parallel([
          Animated.timing(shakeAnim, {
            toValue: i % 2 === 0 ? 1 : -1,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(zoomAnim, {
            toValue: 1.12,
            duration: 50,
            useNativeDriver: true,
          }),
        ]),
      );
    }

    // ritorno alla normalità
    sequence.push(
      Animated.parallel([
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(zoomAnim, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]),
    );

    Animated.sequence(sequence).start();
  };

  // Mantieni l'input sincronizzato con il valore reale del quick timer
  useEffect(() => {
    if (!isEditingQuick && quick) {
      setQuickInput(formatTime(quick.remainingSeconds));
    }
  }, [quick?.remainingSeconds]);

  useEffect(() => {
    if (quick && quick.remainingSeconds === 0 && !quick.isRunning) {
      shake();
    }
  }, [quick?.remainingSeconds, quick?.isRunning]);

  // ==================== ANIMAZIONE SPICCHI ====================
  const slices = 24;
  const sliceAnim = useRef(new Animated.Value(0)).current;

  // ==================== ANIMAZIONE TORTA SINCRONIZZATA ====================
  useEffect(() => {
    if (!quick) return;

    // Se il timer è in pausa → fermiamo l'animazione
    if (quick.isPaused) {
      sliceAnim.stopAnimation();
      return;
    }

    // Se il timer è fermo → resettiamo animazione
    if (!quick.isRunning) {
      sliceAnim.stopAnimation();
      sliceAnim.setValue(0);
      return;
    }

    // Timer in esecuzione → animazione sincronizzata
    let progress = 0;

    // Legge il valore attuale dell'animazione
    sliceAnim.stopAnimation((v) => (progress = v));

    const remaining = quick.remainingSeconds * (1 - progress);

    Animated.timing(sliceAnim, {
      toValue: 1,
      duration: remaining * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [quick?.isRunning, quick?.isPaused, quick?.remainingSeconds]);

  // ==================== COUNTDOWN ANIM ====================
  const countdownScale = useRef(new Animated.Value(1)).current;

  // ==================== CONFERMA INPUT QUICK ====================
  const confirmQuickInput = () => {
    const total = parseQuickInput(quickInput);
    if (total <= 0) {
      setQuickInput(formatTime(quick?.remainingSeconds ?? 0));
      setIsEditingQuick(false);
      return;
    }

    setTimers((prev) =>
      prev.map((t) =>
        t.id === "quick"
          ? {
              ...t,
              duration: total,
              remainingSeconds: total,
              isRunning: false,
              isPaused: false,
              endTime: null,
              notificationId: null,
              hasNotified: false,
            }
          : t,
      ),
    );

    setIsEditingQuick(false);
    sliceAnim.setValue(0);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text bold style={styles.title}>
            Timer
          </Text>
        </View>

        {/* ==================== TORTA ==================== */}
        <View style={styles.cakeWrapper}>
          <Animated.View
            style={{
              transform: [
                {
                  rotate: shakeAnim.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ["-10deg", "10deg"], // rotazione più ampia
                  }),
                },
                {
                  scale: zoomAnim, // zoom in/out
                },
              ],
            }}
          >
            <ImageBackground
              source={require("../../assets/images/gallina.png")}
              style={styles.cakeImage}
            >
              {/* timer al centro */}
            </ImageBackground>
          </Animated.View>

          {/* ==================== TESTO + PILL ==================== */}
          <View style={styles.textOverlay}>
            <View style={styles.pill}>
              <Animated.View style={{ transform: [{ scale: countdownScale }] }}>
                {isEditingQuick ? (
                  <Input
                    style={[styles.timerTextInput]}
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
                    <Text bold style={[styles.timerText]}>
                      {formatTime(quick?.remainingSeconds ?? 0)}
                    </Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            </View>
          </View>
        </View>

        {/* CONTROLLI QUICK */}
        <View style={styles.quickControls}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => {
              if (!quick?.isRunning) {
                startTimer("quick");
              } else if (quick?.isPaused) {
                resumeTimer("quick");
              } else {
                pauseTimer("quick");
              }
            }}
          >
            <Ionicons
              name={
                !quick?.isRunning ? "play" : quick?.isPaused ? "play" : "pause"
              }
              size={36}
              color="white"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => {
              resetTimer("quick");
              sliceAnim.setValue(0);
            }}
          >
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

          {timers.filter((t) => t.id !== "quick").length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="timer-outline" size={70} color="#ccc" />
              <Text style={styles.emptyText}>Nessun timer salvato</Text>
            </View>
          ) : (
            timers
              .filter((t) => t.id !== "quick")
              .map((timer: any, index: number) => (
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    marginBottom: -60,
    backgroundColor: "white",
  },
  header: {
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    padding: 15,
    textAlign: "center",
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
    position: "absolute",
    bottom: 50,
    left: 48,
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
