import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import moment from "moment";
import useCachedResources from "./hooks/useCachedResources";
import useColorScheme from "./hooks/useColorScheme";
import Navigation from "./navigation";
import Amplify, { Auth, DataStore, Hub } from "aws-amplify";
import config from "./src/aws-exports";
import { withAuthenticator } from "aws-amplify-react-native";
import React, { useEffect, useState } from "react";
import { Message, User } from "./src/models";

Amplify.configure({
  ...config,
  Analytics: {
    disabled: true,
  },
});

function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Create listener
    // console.log("registering listener");
    const listener = Hub.listen("datastore", async (hubData) => {
      const { event, data } = hubData.payload;
      if (
        event === "outboxMutationProcessed" &&
        data.model === Message &&
        !["DELIVERED", "READ"].includes(data.element.status)
      ) {
        // set the message status to delivered
        DataStore.save(
          Message.copyOf(data.element, (updated) => {
            updated.status = "DELIVERED";
          })
        );
      }
    });
    // Remove listener
    return () => listener();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
    const subscription = DataStore.observe(User, user.id).subscribe((msg) => {
      // console.log(msg.model, msg.opType, msg.element);
      if (msg.model === User && msg.opType === "UPDATE") {
        setUser(msg.element);
      }
    });

    return () => subscription.unsubscribe();
  }, [user?.id]);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      // console.log("Update last online");
      await updateLastOnline();
    }, 1 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchUser = async () => {
    const userData = await Auth.currentAuthenticatedUser();
    const user = await DataStore.query(User, userData.attributes.sub);
    if (user) {
      setUser(user);
    }
  };

  const updateLastOnline = async () => {
    if (!user) {
      return;
    }
    // console.log("saving");
    // console.log(user.lastOnlineAt);
    // console.log(user.updatedAt);

    const response = await DataStore.save(
      User.copyOf(user, (updated) => {
        updated.lastOnlineAt = +new Date();
      })
    );
    setUser(response);
  };

  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <SafeAreaProvider>
        <Navigation colorScheme={colorScheme} />
        <StatusBar />
      </SafeAreaProvider>
    );
  }
}

export default withAuthenticator(App);
