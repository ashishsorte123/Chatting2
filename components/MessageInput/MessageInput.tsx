import {
  View,
  TextInput,
  Pressable,
  Platform,
  Image,
  Text,
} from "react-native";
import React, { useEffect, useState } from "react";
import {
  SimpleLineIcons,
  Feather,
  AntDesign,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Auth, DataStore, Storage } from "aws-amplify";
import { Message } from "../../src/models";
import { ChatRoom } from "../../src/models";
import styles from "./styles";
import EmojiSelector from "react-native-emoji-selector";
import * as ImagePicker from "expo-image-picker";
import uuid from "react-native-uuid";
import { Audio, AVPlaybackStatus } from "expo-av";
import AudioPlayer from "../AudioPlayer";

const MessageInput = ({ chatRoom }) => {
  const [message, setMessage] = useState("");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [soundURI, setSoundURI] = useState<string | null>(null);
  const [paused, setpaused] = useState(true);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const libraryResponse =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        const photoResponse = await ImagePicker.requestCameraPermissionsAsync();
        await Audio.requestPermissionsAsync();
        if (
          libraryResponse.status !== "granted" ||
          photoResponse.status !== "granted"
        ) {
          alert(
            "Sorry , we need camera roll permissions to make this work !!!"
          );
        }
      }
    })();
  }, []);

  const sendMessage = async () => {
    const user = await Auth.currentAuthenticatedUser();

    const newMessage = await DataStore.save(
      new Message({
        content: message,
        userID: user.attributes.sub,
        chatroomID: chatRoom.id,
      })
    );
    updateLastMessage(newMessage);
    resetFields();
  };

  const updateLastMessage = async (newMessage) => {
    DataStore.save(
      ChatRoom.copyOf(chatRoom, (updatedChatRoom) => {
        updatedChatRoom.LastMessage = newMessage;
      })
    );
  };

  const onPlusClicked = () => {
    console.warn("On plus clicked");
  };

  const onPress = () => {
    if (image) {
      sendImage();
    } else if (soundURI) {
      sendAudio();
    }
    if (message) {
      sendMessage();
    } else {
      onPlusClicked();
    }
  };

  const resetFields = () => {
    setMessage("");
    setIsEmojiPickerOpen(false);
    setImage(null);
    setProgress(0);
    // setSoundURI(null);
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    console.log(result);
    if (!result.cancelled) {
      setImage(result.uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      setImage(result.uri);
    }
  };

  const progressCallback = (progress) => {
    // console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
    setProgress(progress.loaded / progress.total);
  };

  const sendImage = async () => {
    if (!image) {
      return;
    }
    const blob = await getBlob(image);
    const { key } = await Storage.put(`${uuid.v4()}.jpeg`, blob, {
      progressCallback,
    });
    // send message

    const user = await Auth.currentAuthenticatedUser();
    const newMessage = await DataStore.save(
      new Message({
        content: message,
        image: key,
        userID: user.attributes.sub,
        chatroomID: chatRoom.id,
      })
    );
    updateLastMessage(newMessage);
    resetFields();
  };

  const getBlob = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
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

  async function startRecording() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log("Starting recording ...");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
      console.log("Recording started");
    } catch (err) {
      console.log("Failed to start recording", err);
    }
  }

  async function stopRecording() {
    console.log("Stopping recording...");
    if (!recording) {
      return;
    }

    setRecording(null);
    await recording.stopAndUnloadAsync();
    // await Audio.setAudioModeAsync({
    //   allowsRecordingIOS: false,
    // });
    const uri = recording.getURI();
    console.log("Recording stopped and stored at", uri);
    if (!uri) {
      return;
    }
    setSoundURI(uri);
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      {},
      onPlaybackStatusUpdate
    );
    setSound(sound);
  }

  const sendAudio = async () => {
    if (!soundURI) {
      return;
    }
    const uriParts = soundURI.split(".");
    const extension = uriParts[uriParts.length - 1];
    const blob = await getBlob(soundURI);
    const { key } = await Storage.put(`${uuid.v4()}.${extension}`, blob, {
      progressCallback,
    });

    // send message
    const user = await Auth.currentAuthenticatedUser();
    const newMessage = await DataStore.save(
      new Message({
        content: message,
        audio: key,
        userID: user.attributes.sub,
        chatroomID: chatRoom.id,
      })
    );
    updateLastMessage(newMessage);
    resetFields();
  };

  return (
    <View style={[styles.root, { height: isEmojiPickerOpen ? "50%" : "auto" }]}>
      {image && (
        <View style={styles.sendImageContainer}>
          <Image
            source={{ uri: image }}
            style={{ width: 100, height: 100, borderRadius: 10 }}
          />

          <View
            style={{
              flex: 1,
              justifyContent: "flex-start",
              alignSelf: "flex-end",
            }}
          >
            <View
              style={{
                height: 5,
                borderRadius: 5,
                backgroundColor: "#3777f0",
                width: `${progress * 100}%`,
              }}
            />
          </View>

          <Pressable onPress={() => setImage(null)}>
            <AntDesign
              name="close"
              size={24}
              color="black"
              style={{ margin: 5 }}
            />
          </Pressable>
        </View>
      )}

      {soundURI && <AudioPlayer soundURI={soundURI} />}

      <View style={styles.row}>
        <View style={styles.inputContainer}>
          <Pressable
            onPress={() =>
              setIsEmojiPickerOpen((currentValue) => !currentValue)
            }
          >
            <SimpleLineIcons
              name="emotsmile"
              size={24}
              color="#595959"
              style={styles.icon}
            />
          </Pressable>

          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Message..."
          />

          <Pressable onPress={pickImage}>
            <Feather
              name="image"
              size={24}
              color="#595959"
              style={styles.icon}
            />
          </Pressable>

          <Pressable onPress={takePhoto}>
            <Feather
              name="camera"
              size={24}
              color="#595959"
              style={styles.icon}
            />
          </Pressable>

          <Pressable onPressIn={startRecording} onPressOut={stopRecording}>
            <MaterialCommunityIcons
              name={recording ? "microphone" : "microphone-outline"}
              size={24}
              color={recording ? "red" : "#595959"}
              style={styles.icon}
            />
          </Pressable>
        </View>

        <Pressable onPress={onPress} style={styles.buttonContainer}>
          {message || image || soundURI ? (
            <Ionicons name="send" size={18} color="white" />
          ) : (
            <AntDesign name="plus" size={24} color="white" />
          )}
        </Pressable>
      </View>

      {isEmojiPickerOpen && (
        <EmojiSelector
          onEmojiSelected={(emoji) =>
            setMessage((currentMessage) => currentMessage + emoji)
          }
          columns={8}
        />
      )}
    </View>
  );
};

export default MessageInput;
