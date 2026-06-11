import { Audio } from "expo-av";
import type { AudioArtifact } from "../../../src/transcription/contracts";

export type AudioCaptureDraft = {
  artifact: AudioArtifact;
  transcript: string;
  retainAudio: boolean;
};

export type AudioCaptureErrorCode = "permission_denied" | "start_failed" | "stop_failed" | "missing_audio_uri";

export class AudioCaptureError extends Error {
  code: AudioCaptureErrorCode;

  constructor(code: AudioCaptureErrorCode, message: string) {
    super(message);
    this.name = "AudioCaptureError";
    this.code = code;
  }
}

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
  let status: Audio.RecordingStatus;
  try {
    await session.recording.stopAndUnloadAsync();
    status = await session.recording.getStatusAsync();
  } catch (error) {
    throw new AudioCaptureError("stop_failed", error instanceof Error ? error.message : "Recording could not be stopped.");
  }
  const uri = session.recording.getURI();

  if (!uri) {
    throw new AudioCaptureError("missing_audio_uri", "Audio recording did not produce a file URI.");
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
