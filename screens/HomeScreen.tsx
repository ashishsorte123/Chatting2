import React, { useState, useEffect } from "react";
import {
  FlatList,
  Image,
  LogBox,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import chatRoomsData from "../assets/dummy-data/ChatRooms";
import ChatRoomItem from "../components/ChatRoomItem";
import { Auth, DataStore } from "aws-amplify";
import { ChatRoom, ChatRoomUser } from "../src/models";

export default function HomeScreen() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);

  useEffect(() => {
    const fetchChatRooms = async () => {
      const userData = await Auth.currentAuthenticatedUser();

      const chatRooms = (await DataStore.query(ChatRoomUser))
        .filter(
          (chatRoomUser) => chatRoomUser.user.id === userData.attributes.sub
        )
        .map((chatRoomUser) => chatRoomUser.chatRoom);

      setChatRooms(chatRooms);
    };
    fetchChatRooms();
  }, []);
  const onPress = () => {
    Auth.signOut();
  };
  LogBox.ignoreAllLogs();
  return (
    <View style={styles.page}>
      <FlatList
        data={chatRooms}
        renderItem={({ item }) => <ChatRoomItem chatRoom={item} />}
        showsVerticalScrollIndicator={false}
      />

      {/* <Pressable
        onPress={onPress}
        style={{
          backgroundColor: "red",
          height: 50,
          margin: 10,
          borderRadius: 25,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text>Logout</Text>
      </Pressable> */}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "white",
    flex: 1,
  },
});
