import { FlatList, StyleSheet, Text, View } from "react-native";
import React from "react";
import Message from "../components/Message";
import chatRoomData from "../assets/dummy-data/Chats";
import MessageInput from "../components/MessageInput";
import { useRoute, useNavigation } from "@react-navigation/core";

export default function ChatRoomScreen() {
  const route = useRoute();

  const navigation = useNavigation();

  navigation.setOptions({ title: "Elon Musk" });

  console.log("Displaying chat room:", route.params?.id);
  return (
    <View style={styles.page}>
      <FlatList
        data={chatRoomData.messages}
        renderItem={({ item }) => <Message message={item} />}
        inverted
      />
      <MessageInput />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "white",
    flex: 1,
  },
});
