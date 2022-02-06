import { View, Text, ActivityIndicator } from "react-native";
import React, { useState, useEffect } from "react";
import { Auth, DataStore } from "aws-amplify";
import { User } from "../../src/models";
import styles from "./styles";

const myID = "u1";

const Message = ({ message }) => {
  const [user, setUser] = useState<User | undefined>();

  const [isMe, setIsMe] = useState<boolean>(false);

  useEffect(() => {
    DataStore.query(User, message.userID).then(setUser);
  }, []);

  useEffect(() => {
    const checkIfMe = async () => {
      if (!user) {
        return;
      }
      const authUser = await Auth.currentAuthenticatedUser();
      setIsMe(user.id === authUser.attributes.sub);
    };
    checkIfMe();
  }, [user]);

  if (!user) {
    return <ActivityIndicator />;
  }

  return (
    <View
      style={[
        styles.container,
        isMe ? styles.rightContainer : styles.leftContainer,
      ]}
    >
      <Text style={{ color: isMe ? "black" : "white" }}>{message.content}</Text>
    </View>
  );
};

export default Message;
