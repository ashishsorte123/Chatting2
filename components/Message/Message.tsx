import {
  View,
  Text,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Auth, DataStore, Storage } from "aws-amplify";
import { User } from "../../src/models";
import styles from "./styles";
import { S3Image } from "aws-amplify-react-native";
import AudioPlayer from "../AudioPlayer";
import { Ionicons } from "@expo/vector-icons";
import { Message as MessageModal } from "../../src/models";
import MessageReply from "../MessageReply";

const Message = (props) => {
  const { setAsMessageReply, message: propMessage } = props;
  const [message, setMessage] = useState(props.message);
  const [user, setUser] = useState<User | undefined>();
  const [isMe, setIsMe] = useState<boolean | null>(null);
  const [soundURI, setSoundURI] = useState<any>(null);
  const { width } = useWindowDimensions();
  const [repliedTo, setRepliedTo] = useState<MessageModal | undefined>(
    undefined
  );

  useEffect(() => {
    DataStore.query(User, message.userID).then(setUser);
  }, []);

  useEffect(() => {
    setMessage(propMessage);
  }, [propMessage]);

  useEffect(() => {
    if (message?.replyToMessageID) {
      DataStore.query(MessageModal, message.replyToMessageID).then(
        setRepliedTo
      );
    }
  }, [message]);

  useEffect(() => {
    const subscription = DataStore.observe(MessageModal, message.id).subscribe(
      (msg) => {
        // console.log(msg.model, msg.opType, msg.element);
        if (msg.model === MessageModal && msg.opType === "UPDATE") {
          setMessage((message) => ({ ...message, ...msg.element }));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setAsRead();
  }, [isMe, message]);

  useEffect(() => {
    if (message.audio) {
      Storage.get(message.audio).then(setSoundURI);
    }
  }, [message]);

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

  const setAsRead = async () => {
    if (isMe === false && message.status !== "READ") {
      await DataStore.save(
        MessageModal.copyOf(message, (updated) => {
          updated.status = "READ";
        })
      );
    }
  };

  if (!user) {
    return <ActivityIndicator />;
  }

  return (
    <Pressable
      onLongPress={setAsMessageReply}
      style={[
        styles.container,
        isMe ? styles.rightContainer : styles.leftContainer,
        { width: soundURI ? "75%" : "auto" },
      ]}
    >
      {repliedTo && <MessageReply message={repliedTo} />}

      <View style={styles.row}>
        {message.image && (
          <View style={{ marginBottom: message.content ? 10 : 0 }}>
            <S3Image
              imgKey={message.image}
              style={{ width: width * 0.65, aspectRatio: 4 / 3 }}
              resizeMode="cover"
            />
          </View>
        )}

        {soundURI && <AudioPlayer soundURI={soundURI} />}

        {!!message.content && (
          <Text style={{ color: isMe ? "black" : "white" }}>
            {message.content}
          </Text>
        )}

        {isMe && !!message.status && message.status !== "SENT" && (
          <Ionicons
            name={
              message.status === "DELIVERED" ? "checkmark" : "checkmark-done"
            }
            size={16}
            color="grey"
            style={{ marginHorizontal: 5 }}
          />
        )}
      </View>
    </Pressable>
  );
};

export default Message;
