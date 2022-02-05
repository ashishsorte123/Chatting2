import { useNavigation } from "@react-navigation/core";
import { Auth, DataStore } from "aws-amplify";
import React, { useEffect, useState } from "react";
import {
  Image,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  LogBox,
} from "react-native";
import { ChatRoomUser } from "../../src/models";
import { User } from "../../src/models";
import styles from "./styles";

export default function ChatRoomItem({ chatRoom }) {
  LogBox.ignoreAllLogs();
  // const [users, setUsers] = useState<User[]>([]);

  const [user, setUser] = useState<User | null>(null);

  const navigation = useNavigation();

  console.log(chatRoom);

  useEffect(() => {
    const fetchUsers = async () => {
      const fetchedUsers = (await DataStore.query(ChatRoomUser))
        .filter((chatRoomUser) => chatRoomUser.chatRoom.id === chatRoom.id)
        .map((chatRoomUser) => chatRoomUser.user);
      // setUsers(fetchedUsers);

      const authUser = await Auth.currentAuthenticatedUser();
      setUser(
        fetchedUsers.find((user) => user.id !== authUser.attributes.sub) || null
      );
    };
    fetchUsers();
  }, []);

  const onPress = () => {
    console.log("pressed on", user.name);
    navigation.navigate("ChatRoom", { id: chatRoom.id });
  };

  if (!user) {
    return <ActivityIndicator />;
  }
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Image
        source={{
          uri: user.imageUri,
        }}
        style={styles.image}
      />
      {!!chatRoom.newMessages && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{chatRoom.newMessages}</Text>
        </View>
      )}
      <View style={styles.rightContainer}>
        <View style={styles.row}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.text}>{chatRoom.lastMessage?.createdAt}</Text>
        </View>
        <Text numberOfLines={1} style={styles.text}>
          {chatRoom.lastMessage?.content}
        </Text>
      </View>
    </Pressable>
  );
}
