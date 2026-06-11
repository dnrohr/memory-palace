import { Audio } from "expo-av";
import type { AudioArtifact } from "../../../src/transcription/contracts";

export type AudioCaptureDraft = {
  artifact: AudioArtifact;
  transcript: string;
  retainAudio: boolean;
};

export type AudioCaptureSession = {
  startedAt: string;
  recording: Audio.Recording;
};

export async function requestAudioCapturePermission(): Promise<boolean> {
  const permission = await Audio.requestPermissionsAsync();
  return permission.granted;
}

export async function startAudioCapture(): Promise<AudioCaptureSession> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true
  });

  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  await recording.startAsync();

  return {
    startedAt: new Date().toISOString(),
    recording
  };
}

export async function stopAudioCapture(session: AudioCaptureSession): Promise<AudioArtifact> {
  await session.recording.stopAndUnloadAsync();
  const status = await session.recording.getStatusAsync();
  const uri = session.recording.getURI();

  if (!uri) {
    throw new Error("Audio recording did not produce a file URI.");
  }

  return {
    uri,
    mimeType: "audio/m4a",
    ...("durationMillis" in status && typeof status.durationMillis === "number" ? { durationMs: status.durationMillis } : {})
  };
}

export function recordingDurationMs(session: AudioCaptureSession): number {
  return Math.max(0, Date.now() - Date.parse(session.startedAt));
}
