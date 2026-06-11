export type AudioArtifact = {
  uri: string;
  mimeType?: string;
  durationMs?: number;
};

export type TranscriptionSegment = {
  text: string;
  startMs: number;
  endMs: number;
  confidence?: number;
};

export type TranscriptionResult = {
  text: string;
  segments?: TranscriptionSegment[];
  confidence?: number;
  engineId: string;
  engineVersion: string;
  language?: string;
};

export interface ITranscriptionEngine {
  id: string;
  displayName: string;
  supportsOffline: boolean;
  supportsTimestamps: boolean;
  transcribe(input: AudioArtifact): Promise<TranscriptionResult>;
}

export class ManualTextTranscriptionEngine implements ITranscriptionEngine {
  id = "manual-text";
  displayName = "Manual text entry";
  supportsOffline = true;
  supportsTimestamps = false;

  async transcribe(_input: AudioArtifact): Promise<TranscriptionResult> {
    return {
      text: "",
      engineId: this.id,
      engineVersion: "0.1.0"
    };
  }
}

