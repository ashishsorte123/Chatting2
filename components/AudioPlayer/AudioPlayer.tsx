import { View, Text, Pressable } from "react-native";
import React, { useEffect, useState } from "react";
import { Feather } from "@expo/vector-icons";
import styles from "./styles";
import { Audio, AVPlaybackStatus } from "expo-av";

const AudioPlayer = ({ soundURI }) => {
  const [paused, setpaused] = useState(true);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    loadSound();
    () => {
      // unload sound
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [soundURI]);

  const loadSound = async () => {
    if (!soundURI) {
      return;
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: soundURI },
      {},
      onPlaybackStatusUpdate
    );
    setSound(sound);
  };

  // Audio
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      return;
    }
    setAudioProgress(status.positionMillis / (status.durationMillis || 1));
    setpaused(!status.isPlaying);
    setAudioDuration(status.durationMillis || 0);
  };
  

  const playpausedSound = async () => {
    if (!sound) {
      return;
    }
    if (paused) {
      await sound.playFromPositionAsync(0);
    } else {
      await sound.pauseAsync();
    }
  };

  const getDuration = () => {
    const minutes = Math.floor(audioDuration / (60 * 1000));
    const seconds = Math.floor((audioDuration % (60 * 1000)) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <View style={styles.sendAudioContainer}>
      <Pressable onPress={playpausedSound}>
        <Feather name={paused ? "play" : "pause"} size={24} color="grey" />
      </Pressable>

      <View style={styles.audioProgressBG}>
        <View
          style={[styles.audioProgressFG, { left: `${audioProgress * 100}%` }]}
        />
      </View>

      <Text>{getDuration()}</Text>
    </View>
  );
};

export default AudioPlayer;
