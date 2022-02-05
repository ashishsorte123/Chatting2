import React, { useState, useEffect } from "react";
import { FlatList, LogBox, StyleSheet, View } from "react-native";
import UserItem from "../components/UserItem";
import { DataStore } from "@aws-amplify/datastore";
import { User } from "../src/models";

export default function UsersScreen() {
  LogBox.ignoreAllLogs();
  LogBox.ignoreLogs(["Setting a timer"]);

  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    DataStore.query(User).then(setUsers);
  });
  return (
    <View style={styles.page}>
      <FlatList
        data={users}
        renderItem={({ item }) => <UserItem user={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "white",
    flex: 1,
  },
});
