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
  stop: () => Promise<SpeechRecognitionAudioArtifact>;
};

export type SpeechRecognitionAudioArtifact = AudioArtifact & {
  transcript?: string;
  confidence?: number;
};

type SpeechRecognitionResult = {
  transcript: string;
  confidence?: number;
};

type SpeechRecognitionResultEvent = {
  isFinal: boolean;
  results: SpeechRecognitionResult[];
};

type SpeechRecognitionErrorEvent = {
  error?: string;
  message?: string;
};

type SpeechRecognitionSubscription = {
  remove: () => void;
};

type SpeechRecognitionModule = {
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  requestMicrophonePermissionsAsync?: () => Promise<{ granted: boolean }>;
  isRecognitionAvailable: () => boolean;
  start: (options: {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    requiresOnDeviceRecognition: boolean;
    addsPunctuation: boolean;
  }) => void;
  stop: () => void;
  abort: () => void;
  addListener: (
    eventName: "result" | "error" | "end",
    listener: (event: SpeechRecognitionResultEvent | SpeechRecognitionErrorEvent | null) => void
  ) => SpeechRecognitionSubscription;
};

export async function requestAudioCapturePermission(): Promise<boolean> {
  try {
    const module = await loadSpeechRecognitionModule();
    const permissions = module.requestMicrophonePermissionsAsync
      ? await module.requestMicrophonePermissionsAsync()
      : await module.requestPermissionsAsync();
    return permissions.granted;
  } catch {
    return false;
  }
}

export async function startAudioCapture(): Promise<AudioCaptureSession> {
  const module = await loadSpeechRecognitionModule();
  if (!module.isRecognitionAvailable()) {
    throw new AudioCaptureError("start_failed", "Speech recognition is not available on this device.");
  }

  const startedAt = new Date().toISOString();
  const subscriptions: SpeechRecognitionSubscription[] = [];
  let transcript = "";
  let confidence: number | undefined;
  let recognitionError: string | undefined;
  let resolveEnd: (() => void) | undefined;
  let ended = false;
  const endedPromise = new Promise<void>((resolve) => {
    resolveEnd = resolve;
  });
  const cleanup = () => subscriptions.splice(0).forEach((subscription) => subscription.remove());
  const markEnded = () => {
    if (ended) return;
    ended = true;
    resolveEnd?.();
  };

  subscriptions.push(
    module.addListener("result", (event) => {
      const resultEvent = event as SpeechRecognitionResultEvent | null;
      const result = resultEvent?.results[0];
      if (!result?.transcript) return;
      transcript = result.transcript;
      if (typeof result.confidence === "number" && result.confidence >= 0) confidence = result.confidence;
    })
  );
  subscriptions.push(
    module.addListener("error", (event) => {
      const errorEvent = event as SpeechRecognitionErrorEvent | null;
      recognitionError = errorEvent?.message ?? errorEvent?.error ?? "Speech recognition failed.";
      markEnded();
    })
  );
  subscriptions.push(module.addListener("end", markEnded));

  try {
    module.start({
      lang: "en-US",
      interimResults: true,
      continuous: false,
      requiresOnDeviceRecognition: false,
      addsPunctuation: true
    });
  } catch (error) {
    cleanup();
    throw new AudioCaptureError("start_failed", error instanceof Error ? error.message : "Recording could not be started.");
  }

  return {
    startedAt,
    stop: async () => {
      try {
        module.stop();
      } catch {
        module.abort();
      }

      await Promise.race([endedPromise, wait(2500)]);
      cleanup();

      if (recognitionError && !transcript.trim() && !isNoSpeechError(recognitionError)) {
        throw new AudioCaptureError("stop_failed", recognitionError);
      }

      return {
        uri: "speech-recognition://live",
        mimeType: "text/plain",
        durationMs: Math.max(0, Date.now() - Date.parse(startedAt)),
        transcript: transcript.trim(),
        ...(confidence !== undefined ? { confidence } : {})
      };
    }
  };
}

export async function stopAudioCapture(session: AudioCaptureSession): Promise<SpeechRecognitionAudioArtifact> {
  return session.stop();
}

export function recordingDurationMs(session: AudioCaptureSession): number {
  return Math.max(0, Date.now() - Date.parse(session.startedAt));
}

async function loadSpeechRecognitionModule(): Promise<SpeechRecognitionModule> {
  const module = await import("expo-speech-recognition");
  return module.ExpoSpeechRecognitionModule as unknown as SpeechRecognitionModule;
}

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

function isNoSpeechError(errorMessage: string): boolean {
  const normalized = errorMessage.toLowerCase();
  return normalized.includes("no-speech") || normalized.includes("no speech");
}
