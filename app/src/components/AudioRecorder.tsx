import React, { useState, useEffect } from "react";
import { View, Button, Text, StyleSheet } from "react-native";
import { Audio } from "expo-av";

export function AudioRecorder() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [statusMessage, setStatusMessage] = useState("Fala que eu te escuto!");
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  async function startRecording() {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setStatusMessage("Permissão de microfone negada");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await rec.startAsync();
      setRecording(rec);
      setStatusMessage("Estou te ouvindo...");
    } catch (err) {
      console.error(err);
      setStatusMessage("Erro ao iniciar a gravação");
    }
  }

  async function stopRecording() {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordedUri(uri);
      setStatusMessage(`Gravado em: ${uri}`);
      setRecording(null);
    } catch (err) {
      console.error(err);
      setStatusMessage("Erro ao parar a gravação");
    }
  }

  async function playRecording() {
    if (!recordedUri) return;
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordedUri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setStatusMessage("Reproduzindo...");
      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          setStatusMessage("Pronto para reproduzir");
        }
      });
    } catch (err) {
      console.error(err);
      setStatusMessage("Erro ao reproduzir áudio");
    }
  }

  async function uploadForTranscription(uri: string) {
    try {
      setUploading(true);
      setStatusMessage("Transcrevendo sua nota");
      const form = new FormData();
      form.append("audio", {
        uri,
        name: "recording.m4a",
        type: "audio/m4a",
      } as any);
      const response = await fetch("https://seu-backend.com/api/upload", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: form,
      });
      const data = await response.json();
      setTranscription(data.transcription);
      setStatusMessage("Transcrição concluída");
    } catch (err) {
      console.error(err);
      setStatusMessage("Erro na transcrição");
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.status}>{statusMessage}</Text>
      <Button
        title={recording ? "Parar gravação" : "Iniciar gravação"}
        onPress={recording ? stopRecording : startRecording}
      />
      {recordedUri && (
        <View style={styles.playContainer}>
          <Button title="Reproduzir" onPress={playRecording} />
          <Text style={styles.uri}>{recordedUri}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  status: { marginBottom: 8 },
  playContainer: { marginTop: 16 },
  uri: { marginTop: 8, fontSize: 12, color: "gray" },
});
