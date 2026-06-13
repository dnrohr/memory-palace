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
};

export async function requestAudioCapturePermission(): Promise<boolean> {
  return false;
}

export async function startAudioCapture(): Promise<AudioCaptureSession> {
  throw new AudioCaptureError(
    "start_failed",
    "Audio capture is temporarily disabled on Android while migrating from expo-av to expo-audio."
  );
}

export async function stopAudioCapture(_session: AudioCaptureSession): Promise<AudioArtifact> {
  throw new AudioCaptureError(
    "stop_failed",
    "Audio capture is temporarily disabled on Android while migrating from expo-av to expo-audio."
  );
}

export function recordingDurationMs(session: AudioCaptureSession): number {
  return Math.max(0, Date.now() - Date.parse(session.startedAt));
}
