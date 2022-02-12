import React, { useState, useEffect } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import UserItem from "../components/UserItem";
import NewGroupButton from "../components/NewGroupButton";
import { useNavigation } from "@react-navigation/native";
import { ChatRoom, User, ChatRoomUser } from "../src/models";
import { Auth, DataStore } from "aws-amplify";

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const navigation = useNavigation();
  const [isNewGroup, setIsNewGroup] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  useEffect(() => {
    DataStore.query(User).then(setUsers);
  }, []);

  const addUserToChatRoom = async (user: User, chatRoom: ChatRoom) => {
    DataStore.save(
      new ChatRoomUser({
        user,
        chatRoom,
      })
    );
  };

  const createChatRoom = async (users: any[]) => {
    // connect authenticated user with the chat room
    const authUser = await Auth.currentAuthenticatedUser();
    const dbUser = await DataStore.query(User, authUser.attributes.sub);

    // create a chat room
    const newChatRoomData = { newMessages: 0, admin: dbUser };
    if (users.length > 1) {
      newChatRoomData.name = "New group";
      newChatRoomData.imageUri =
        "https://notjustdev-dummy.s3.us-east-2.amazonaws.com/avatars/group.jpeg";
    }
    const newChatRoom = await DataStore.save(new ChatRoom(newChatRoomData));

    if (dbUser) {
      await addUserToChatRoom(dbUser, newChatRoom);
    }

    // connect clicked user with the chat room
    await Promise.all(
      users.map((user: any) => addUserToChatRoom(user, newChatRoom))
    );

    navigation.navigate("ChatRoom", { id: newChatRoom.id });
  };

  const isUserSelected = (user: User) => {
    return selectedUsers.some((selectedUser) => selectedUser.id === user.id);
  };

  const onUserPress = async (user: User) => {
    if (isNewGroup) {
      if (isUserSelected(user)) {
        // remove it from selected
        setSelectedUsers(
          selectedUsers.filter((selectedUser) => selectedUser.id !== user.id)
        );
      } else {
        setSelectedUsers([...selectedUsers, user]);
      }
    } else {
      await createChatRoom([user]);
    }
  };

  const saveGroup = async () => {
    await createChatRoom(selectedUsers);
  };

  return (
    <SafeAreaView style={styles.page}>
      <FlatList
        data={users}
        renderItem={({ item }) => (
          <UserItem
            user={item}
            onPress={() => onUserPress(item)}
            isSelected={isNewGroup ? isUserSelected(item) : undefined}
          />
        )}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <NewGroupButton onPress={() => setIsNewGroup(!isNewGroup)} />
        )}
      />

      {isNewGroup && (
        <Pressable style={styles.button} onPress={saveGroup}>
          <Text style={styles.buttonText}>
            Save group ({selectedUsers.length})
          </Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "white",
    flex: 1,
  },

  button: {
    backgroundColor: "#3777f0",
    marginHorizontal: 10,
    padding: 10,
    alignItems: "center",
    borderRadius: 15,
    margin: 20,
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
