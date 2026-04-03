import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  Monitor,
  Shield,
  Sparkles,
  Volume2,
  VolumeX,
  Waves,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  tone: "neutral" | "alert" | "success";
}

type PlaybackState = "song" | "ad";

const palette = {
  background: "#07111A",
  panel: "#10202D",
  panelStrong: "#132838",
  panelSoft: "#0D1A25",
  text: "#F3FAFF",
  textMuted: "#8DA5B5",
  border: "rgba(187, 230, 255, 0.12)",
  accent: "#46E39A",
  accentStrong: "#22C57A",
  danger: "#FF6A5C",
  warning: "#FFD166",
  sky: "#5FC8FF",
} as const;

export default function IndexScreen() {
  const [isArmed, setIsArmed] = useState<boolean>(true);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("song");
  const [launchAtLogin, setLaunchAtLogin] = useState<boolean>(true);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [muteSpotifyOnly, setMuteSpotifyOnly] = useState<boolean>(true);
  const pulse = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log("[AdMute] screen mounted");
  }, []);

  useEffect(() => {
    console.log("[AdMute] playback state changed", { playbackState, isArmed });
  }, [isArmed, playbackState]);

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    glowLoop.start();

    return () => {
      pulseLoop.stop();
      glowLoop.stop();
    };
  }, [glow, pulse]);

  const isMuted = isArmed && playbackState === "ad";

  const statusLabel = useMemo(() => {
    if (!isArmed) {
      return "Idle";
    }

    if (playbackState === "ad") {
      return "Ad muted";
    }

    return "Listening for ads";
  }, [isArmed, playbackState]);

  const activityItems = useMemo<ActivityItem[]>(() => {
    if (!isArmed) {
      return [
        {
          id: "idle",
          title: "Muter paused",
          detail: "Spotify audio will pass through unchanged until you arm the utility again.",
          tone: "neutral",
        },
      ];
    }

    if (playbackState === "ad") {
      return [
        {
          id: "detect",
          title: "Ad signature detected",
          detail: "Playback metadata changed from track mode to promotion mode.",
          tone: "alert",
        },
        {
          id: "mute",
          title: "Spotify muted locally",
          detail: muteSpotifyOnly
            ? "Only the Spotify app output is silenced."
            : "System audio muting fallback is armed.",
          tone: "success",
        },
      ];
    }

    return [
      {
        id: "watching",
        title: "Track playback confirmed",
        detail: "The utility is watching Spotify and keeping volume normal.",
        tone: "neutral",
      },
      {
        id: "restore",
        title: "Unmute ready",
        detail: "If an ad ends, audio returns instantly for the next song.",
        tone: "success",
      },
    ];
  }, [isArmed, muteSpotifyOnly, playbackState]);

  const haloScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const haloOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.8],
  });

  const handleTogglePlayback = () => {
    const nextState: PlaybackState = playbackState === "song" ? "ad" : "song";
    console.log("[AdMute] toggling demo playback", { from: playbackState, to: nextState });
    setPlaybackState(nextState);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#09141F", "#07111A", "#0B1722"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          testID="spotify-ad-muter-scroll"
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.eyebrow}>Fire-and-forget utility</Text>
              <Text style={styles.title}>AdMute</Text>
              <Text style={styles.subtitle}>
                Local-only Spotify ad silencing with zero account setup.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                console.log("[AdMute] armed toggled", { next: !isArmed });
                setIsArmed((current) => !current);
              }}
              style={({ pressed }) => [styles.armButton, pressed ? styles.armButtonPressed : null]}
              testID="spotify-ad-muter-arm-button"
            >
              <Text style={styles.armButtonLabel}>{isArmed ? "Pause" : "Arm"}</Text>
            </Pressable>
          </View>

          <View style={styles.badgeRow}>
            <FeatureBadge icon={Shield} label="Local only" />
            <FeatureBadge icon={Monitor} label="Desktop focused" />
            <FeatureBadge icon={Sparkles} label="No Spotify API" />
          </View>

          <LinearGradient
            colors={["rgba(95, 200, 255, 0.18)", "rgba(70, 227, 154, 0.12)", "rgba(7, 17, 26, 0.82)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.statusCaption}>Current status</Text>
                <Text style={styles.statusValue}>{statusLabel}</Text>
              </View>
              <View
                style={[
                  styles.statusPill,
                  isMuted ? styles.statusPillAlert : isArmed ? styles.statusPillLive : styles.statusPillIdle,
                ]}
              >
                <Text style={styles.statusPillText}>{isMuted ? "Muted" : isArmed ? "Armed" : "Idle"}</Text>
              </View>
            </View>

            <View style={styles.heroCenter}>
              <Animated.View
                style={[
                  styles.halo,
                  {
                    opacity: haloOpacity,
                    transform: [{ scale: haloScale }],
                  },
                ]}
              />
              <View style={[styles.coreOrb, isMuted ? styles.coreOrbMuted : styles.coreOrbListening]}>
                {isMuted ? (
                  <VolumeX color={palette.text} size={34} />
                ) : (
                  <Volume2 color={palette.text} size={34} />
                )}
              </View>
            </View>

            <View style={styles.signalRow}>
              <SignalBar height={18} active={isArmed} />
              <SignalBar height={28} active={isArmed} />
              <SignalBar height={22} active={playbackState === "ad"} alert={playbackState === "ad"} />
              <SignalBar height={36} active={playbackState === "ad"} alert={playbackState === "ad"} />
              <SignalBar height={16} active={isArmed} />
            </View>

            <View style={styles.heroFooter}>
              <View style={styles.trackCard}>
                <Waves color={playbackState === "ad" ? palette.warning : palette.sky} size={18} />
                <View style={styles.trackCopy}>
                  <Text style={styles.trackLabel}>{playbackState === "ad" ? "Ad playback" : "Song playback"}</Text>
                  <Text style={styles.trackSubLabel}>
                    {playbackState === "ad"
                      ? "Spotify is muted until music resumes."
                      : "Audio stays normal while a track is playing."}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={handleTogglePlayback}
                style={({ pressed }) => [styles.demoButton, pressed ? styles.demoButtonPressed : null]}
                testID="spotify-ad-muter-demo-button"
              >
                <Text style={styles.demoButtonText}>
                  {playbackState === "ad" ? "Switch to Song" : "Simulate Ad"}
                </Text>
              </Pressable>
            </View>
          </LinearGradient>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>How it works</Text>
            <Text style={styles.sectionSubtitle}>Keep it simple: detect, mute, restore.</Text>
          </View>

          <View style={styles.flowGrid}>
            <FlowCard step="01" title="Watch Spotify" detail="Observe the desktop app locally and inspect playback changes without cloud services." />
            <FlowCard step="02" title="Spot the ad" detail="When the app flips into ad playback, the muter switches to silence immediately." />
            <FlowCard step="03" title="Bring songs back" detail="As soon as a normal track returns, Spotify volume is restored automatically." />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Utility preferences</Text>
            <Text style={styles.sectionSubtitle}>Minimal options, no account wall.</Text>
          </View>

          <View style={styles.settingsCard}>
            <PreferenceRow
              icon={Monitor}
              title="Launch on login"
              detail="Start quietly with your computer and stay out of the way."
              value={launchAtLogin}
              onValueChange={setLaunchAtLogin}
              testID="spotify-ad-muter-launch-switch"
            />
            <PreferenceRow
              icon={Bell}
              title="Show mute notifications"
              detail="Optionally surface a small confirmation when ads are silenced."
              value={showNotification}
              onValueChange={setShowNotification}
              testID="spotify-ad-muter-notify-switch"
            />
            <PreferenceRow
              icon={VolumeX}
              title="Mute Spotify only"
              detail="Prefer per-app muting rather than touching the whole system volume."
              value={muteSpotifyOnly}
              onValueChange={setMuteSpotifyOnly}
              testID="spotify-ad-muter-spotify-only-switch"
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Live activity</Text>
            <Text style={styles.sectionSubtitle}>What the background worker is doing right now.</Text>
          </View>

          <View style={styles.activityList}>
            {activityItems.map((item) => (
              <View key={item.id} style={styles.activityRow}>
                <View
                  style={[
                    styles.activityDot,
                    item.tone === "alert"
                      ? styles.activityDotAlert
                      : item.tone === "success"
                        ? styles.activityDotSuccess
                        : styles.activityDotNeutral,
                  ]}
                />
                <View style={styles.activityCopy}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activityDetail}>{item.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function FeatureBadge({
  icon: Icon,
  label,
}: {
  icon: typeof Shield;
  label: string;
}) {
  return (
    <View style={styles.featureBadge}>
      <Icon color={palette.text} size={14} />
      <Text style={styles.featureBadgeText}>{label}</Text>
    </View>
  );
}

function FlowCard({ step, title, detail }: { step: string; title: string; detail: string }) {
  return (
    <View style={styles.flowCard}>
      <Text style={styles.flowStep}>{step}</Text>
      <Text style={styles.flowTitle}>{title}</Text>
      <Text style={styles.flowDetail}>{detail}</Text>
    </View>
  );
}

function PreferenceRow({
  icon: Icon,
  title,
  detail,
  value,
  onValueChange,
  testID,
}: {
  icon: typeof Monitor;
  title: string;
  detail: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  testID: string;
}) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceIconWrap}>
        <Icon color={palette.text} size={18} />
      </View>
      <View style={styles.preferenceCopy}>
        <Text style={styles.preferenceTitle}>{title}</Text>
        <Text style={styles.preferenceDetail}>{detail}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? palette.text : "#D7E2E9"}
        trackColor={{ false: "#40505D", true: palette.accentStrong }}
        testID={testID}
      />
    </View>
  );
}

function SignalBar({
  height,
  active,
  alert = false,
}: {
  height: number;
  active: boolean;
  alert?: boolean;
}) {
  return (
    <View
      style={[
        styles.signalBar,
        {
          height,
          opacity: active ? 1 : 0.28,
          backgroundColor: alert ? palette.warning : palette.accent,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  eyebrow: {
    color: palette.textMuted,
    fontSize: 13,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    color: palette.text,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1.1,
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 260,
  },
  armButton: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    minWidth: 86,
    alignItems: "center",
  },
  armButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  armButtonLabel: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "700",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  featureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
  },
  featureBadgeText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: "600",
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: "hidden",
    padding: 20,
    gap: 20,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  statusCaption: {
    color: palette.textMuted,
    fontSize: 13,
    marginBottom: 6,
  },
  statusValue: {
    color: palette.text,
    fontSize: 24,
    fontWeight: "700",
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusPillLive: {
    backgroundColor: "rgba(70, 227, 154, 0.16)",
  },
  statusPillAlert: {
    backgroundColor: "rgba(255, 106, 92, 0.18)",
  },
  statusPillIdle: {
    backgroundColor: "rgba(141, 165, 181, 0.18)",
  },
  statusPillText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: "700",
  },
  heroCenter: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
  },
  halo: {
    position: "absolute",
    width: 168,
    height: 168,
    borderRadius: 999,
    backgroundColor: "rgba(95, 200, 255, 0.22)",
  },
  coreOrb: {
    width: 112,
    height: 112,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  coreOrbListening: {
    backgroundColor: "rgba(70, 227, 154, 0.24)",
  },
  coreOrbMuted: {
    backgroundColor: "rgba(255, 106, 92, 0.28)",
  },
  signalRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 8,
  },
  signalBar: {
    width: 10,
    borderRadius: 999,
  },
  heroFooter: {
    gap: 14,
  },
  trackCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(8, 18, 27, 0.66)",
    borderWidth: 1,
    borderColor: palette.border,
  },
  trackCopy: {
    flex: 1,
    gap: 2,
  },
  trackLabel: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "700",
  },
  trackSubLabel: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  demoButton: {
    backgroundColor: palette.text,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  demoButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  demoButtonText: {
    color: "#07111A",
    fontSize: 15,
    fontWeight: "800",
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: "700",
  },
  sectionSubtitle: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  flowGrid: {
    gap: 12,
  },
  flowCard: {
    backgroundColor: palette.panelSoft,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    gap: 10,
  },
  flowStep: {
    color: palette.sky,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  flowTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: "700",
  },
  flowDetail: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  settingsCard: {
    backgroundColor: palette.panel,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: "hidden",
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  preferenceIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.panelStrong,
  },
  preferenceCopy: {
    flex: 1,
    gap: 4,
  },
  preferenceTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "700",
  },
  preferenceDetail: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  activityList: {
    backgroundColor: palette.panelSoft,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    gap: 16,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 6,
  },
  activityDotNeutral: {
    backgroundColor: palette.sky,
  },
  activityDotAlert: {
    backgroundColor: palette.warning,
  },
  activityDotSuccess: {
    backgroundColor: palette.accent,
  },
  activityCopy: {
    flex: 1,
    gap: 4,
  },
  activityTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "700",
  },
  activityDetail: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
});
