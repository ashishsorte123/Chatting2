import React from "react";
import { FlatList, LogBox, StyleSheet, View } from "react-native";
import Users from "../assets/dummy-data/Users";
import UserItem from "../components/UserItem";

export default function UsersScreen() {
  LogBox.ignoreAllLogs();
  return (
    <View style={styles.page}>
      <FlatList
        data={Users}
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
