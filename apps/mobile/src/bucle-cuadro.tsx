import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import { AccessibilityInfo, AppState, Image, StyleSheet, View } from "react-native";
import type { BucleMovil } from "./bucles";

function VideoMudo({ src }: { src: string }) {
  const [visible, setVisible] = useState(false);
  const [roto, setRoto] = useState(false);
  const player = useVideoPlayer(src, (reproductor) => {
    reproductor.muted = true;
    reproductor.loop = true;
    reproductor.audioMixingMode = "mixWithOthers";
    reproductor.showNowPlayingNotification = false;
    reproductor.play();
  });

  useEffect(() => {
    const estado = player.addListener("statusChange", ({ status, error }) => {
      if (error || status === "error") setRoto(true);
      if (status === "readyToPlay") setVisible(true);
    });
    const app = AppState.addEventListener("change", (siguiente) => {
      if (siguiente === "active") player.play();
      else player.pause();
    });
    return () => {
      estado.remove();
      app.remove();
    };
  }, [player]);

  if (roto) return null;
  return (
    <VideoView
      player={player}
      nativeControls={false}
      contentFit="contain"
      allowsPictureInPicture={false}
      style={[StyleSheet.absoluteFill, { opacity: visible ? 1 : 0 }]}
    />
  );
}

export function BucleCuadro({ bucle, poster, alt }: { bucle: BucleMovil; poster: string; alt: string }) {
  const [reduce, setReduce] = useState(true);
  const src = bucle.mp4 || bucle.webm;

  useEffect(() => {
    let vivo = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((valor) => {
      if (vivo) setReduce(valor);
    });
    const aviso = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => {
      vivo = false;
      aviso.remove();
    };
  }, []);

  return (
    <View style={{ width: "100%", height: "100%", backgroundColor: "#100E0C" }}>
      <Image source={{ uri: poster }} accessibilityElementsHidden blurRadius={28} resizeMode="cover" style={[StyleSheet.absoluteFill, { opacity: 0.55 }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(16,14,12,0.5)" }]} />
      <Image source={{ uri: poster }} accessibilityLabel={alt} resizeMode="contain" style={StyleSheet.absoluteFill} />
      {src && !reduce ? <VideoMudo src={src} /> : null}
    </View>
  );
}
