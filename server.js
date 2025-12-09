// SawBladeCamara.js
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

export default function SawBladeCamara({ navigation, route }) {
  const { mode } = route.params || {};
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [loading, setLoading] = useState(false);

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Checking camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>
          Sawce Works needs camera access to slice pics.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      setLoading(true);
      const pic = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });

      navigation.navigate("Results", {
        photoUri: pic.uri,
        mode: mode, // dupe | safety | supply | viral
      });
    } catch (err) {
      console.log("Camera error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        style={{ flex: 1 }}
        ref={cameraRef}
        facing="back"
        autofocus="on"
      />

      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={styles.loadingText}>Summoning Sawce…</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
          <Text style={styles.captureText}>SLICE</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#020612",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    color: "#e0ecff",
    textAlign: "center",
    marginBottom: 16,
  },
  btn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#1a3cff",
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
  },
  captureButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: "#1a3cff",
  },
  captureText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 1,
  },
  loadingOverlay: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#e0ecff",
  },
}); 
