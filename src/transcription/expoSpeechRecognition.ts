import type {
  AudioArtifact,
  ITranscriptionEngine,
  TranscriptionResult,
  TranscriptionSegment
} from "./contracts";

type SpeechRecognitionResult = {
  transcript: string;
  confidence: number;
  segments?: Array<{
    startTimeMillis: number;
    endTimeMillis: number;
    segment: string;
    confidence: number;
  }>;
};

type SpeechRecognitionResultEvent = {
  isFinal: boolean;
  results: SpeechRecognitionResult[];
};

type SpeechRecognitionErrorEvent = {
  error: string;
  message: string;
};

type SpeechRecognitionSubscription = {
  remove: () => void;
};

type SpeechRecognitionModule = {
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  isRecognitionAvailable: () => boolean;
  supportsOnDeviceRecognition: () => boolean;
  start: (options: {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    requiresOnDeviceRecognition: boolean;
    addsPunctuation: boolean;
    audioSource: { uri: string };
  }) => void;
  abort: () => void;
  addListener: (
    eventName: "result" | "error" | "end",
    listener: (event: SpeechRecognitionResultEvent | SpeechRecognitionErrorEvent | null) => void
  ) => SpeechRecognitionSubscription;
};

type SpeechRecognitionModuleLoader = () => Promise<SpeechRecognitionModule>;

export class ExpoSpeechRecognitionTranscriptionEngine implements ITranscriptionEngine {
  id = "expo-speech-recognition";
  displayName = "Native speech recognition";
  supportsOffline = true;
  supportsTimestamps = true;

  constructor(private readonly loadModule: SpeechRecognitionModuleLoader = loadExpoSpeechRecognitionModule) {}

  async transcribe(input: AudioArtifact): Promise<TranscriptionResult> {
    const module = await this.loadModule();
    if (!module.isRecognitionAvailable()) {
      throw new Error("Native speech recognition is not available on this device.");
    }

    const permissions = await module.requestPermissionsAsync();
    if (!permissions.granted) {
      throw new Error("Speech recognition permission was not granted.");
    }

    return new Promise<TranscriptionResult>((resolve, reject) => {
      const subscriptions: SpeechRecognitionSubscription[] = [];
      let finalResult: SpeechRecognitionResult | undefined;

      const cleanup = () => subscriptions.splice(0).forEach((subscription) => subscription.remove());

      subscriptions.push(
        module.addListener("result", (event) => {
          const resultEvent = event as SpeechRecognitionResultEvent | null;
          const result = resultEvent?.results[0];
          if (resultEvent?.isFinal && result) {
            finalResult = result;
          }
        })
      );
      subscriptions.push(
        module.addListener("error", (event) => {
          cleanup();
          const errorEvent = event as SpeechRecognitionErrorEvent | null;
          reject(new Error(errorEvent?.message ?? "Native speech recognition failed."));
        })
      );
      subscriptions.push(
        module.addListener("end", () => {
          cleanup();
          if (!finalResult?.transcript.trim()) {
            reject(new Error("Native speech recognition completed without a transcript."));
            return;
          }

          const segments = mapSegments(finalResult);
          resolve({
            text: finalResult.transcript,
            ...(segments ? { segments } : {}),
            ...(finalResult.confidence >= 0 ? { confidence: finalResult.confidence } : {}),
            engineId: this.id,
            engineVersion: "expo-speech-recognition",
            language: "en-US"
          });
        })
      );

      try {
        module.start({
          lang: "en-US",
          interimResults: false,
          continuous: false,
          requiresOnDeviceRecognition: module.supportsOnDeviceRecognition(),
          addsPunctuation: true,
          audioSource: { uri: input.uri }
        });
      } catch (error) {
        cleanup();
        reject(error);
      }
    });
  }
}

async function loadExpoSpeechRecognitionModule(): Promise<SpeechRecognitionModule> {
  const module = await import("expo-speech-recognition");
  return module.ExpoSpeechRecognitionModule as unknown as SpeechRecognitionModule;
}

function mapSegments(result: SpeechRecognitionResult): TranscriptionSegment[] | undefined {
  const segments = result.segments ?? [];
  if (segments.length === 0) return undefined;
  return segments.map((segment) => ({
    text: segment.segment,
    startMs: segment.startTimeMillis,
    endMs: segment.endTimeMillis,
    ...(segment.confidence >= 0 ? { confidence: segment.confidence } : {})
  }));
}
