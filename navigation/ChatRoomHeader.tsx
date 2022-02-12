import React, { useEffect, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { Image, Text, useWindowDimensions, View } from "react-native";
import { Auth, DataStore } from "aws-amplify";
import { ChatRoom, ChatRoomUser, User } from "../src/models";
import moment from "moment";

const ChatRoomHeader = ({ id, children }) => {
  const { width } = useWindowDimensions();
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [chatRoom, setChatRoom] = useState<ChatRoom | undefined>(undefined);

  const fetchUsers = async () => {
    const fetchedUsers = (await DataStore.query(ChatRoomUser))
      .filter((chatRoomUser) => chatRoomUser.chatRoom.id === id)
      .map((chatRoomUser) => chatRoomUser.user);
    setAllUsers(fetchedUsers);

    const authUser = await Auth.currentAuthenticatedUser();
    setUser(
      fetchedUsers.find((user) => user.id !== authUser.attributes.sub) || null
    );
  };

  const fetchChatRoom = async () => {
    DataStore.query(ChatRoom, id).then(setChatRoom);
  };

  useEffect(() => {
    if (!id) {
      return;
    }
    fetchUsers();
    fetchChatRoom();
  }, []);

  const getLastOnlineText = () => {
    if (!user?.lastOnlineAt) {
      return null;
    }
    // if lastOnlineAt is less than 5 minutes ago, show him as ONLINE
    const lastOnlineDiffMS = moment().diff(moment(user?.lastOnlineAt));
    if (lastOnlineDiffMS < 5 * 60 * 1000) {
      // less than 5 minutes
      return "online";
    } else {
      return `Last seen online ${moment(user?.lastOnlineAt).fromNow()}`;
    }
    // console.log(moment().diff(moment(user?.lastOnlineAt)));
  };

  const getUsernames = () => {
    return allUsers.map((user) => user.name).join(", ");
  };

  const isGroup = allUsers.length > 1;

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        width: width - 40,
        marginLeft: -30,
        padding: 10,
        alignItems: "center",
      }}
    >
      <Image
        source={{
          uri: chatRoom?.imageUri || user?.imageUri,
        }}
        style={{ width: 30, height: 30, borderRadius: 30 }}
      />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text
          style={{
            fontWeight: "bold",
            fontSize: 15,
          }}
        >
          {chatRoom?.name || user?.name}
        </Text>

        <Text numberOfLines={1}>
          {isGroup ? getUsernames() : getLastOnlineText()}
        </Text>
      </View>

      <Feather
        name="camera"
        size={24}
        color="black"
        style={{ marginHorizontal: 10 }}
      />

      <Feather
        name="edit-2"
        size={24}
        color="black"
        style={{ marginHorizontal: 10 }}
      />
    </View>
  );
};

export default ChatRoomHeader;
