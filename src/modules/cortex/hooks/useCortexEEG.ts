import { useCallback, useEffect, useRef, useState } from "react";

import { eegStreamService, type EEGStreamHandle } from "../../../core/eeg";

import { CortexSignalProcessor, type CortexProcessorSnapshot } from "../eeg/CortexSignalProcessor";

import type { CortexEEGState } from "../models/cortex";

const EMPTY_PROCESSOR_SNAPSHOT: CortexProcessorSnapshot = {
  started: false,
  phase: "idle",
  warmupProgress: 0,
  fastCalibrationProgress: 0,
  bandCalibrationProgress: 0,
  bandWindowProgress: 0,
  fastReady: false,
  bandReady: false,
  fastActivityByLabel: {},
  bandActivityByLabel: {
    delta: {},
    theta: {},
    alpha: {},
    beta: {},
    gamma: {},
  },
  signalQualityByLabel: {},
  flatChannels: [],
  receivedSamples: 0,
  droppedSamples: 0,
};

export interface CortexEEGSnapshot extends CortexProcessorSnapshot {
  state: CortexEEGState;
  error: string | null;
  sampleRateHz: number | null;
  channelCount: number;
  lastSequence: number | null;
  retry: () => void;
  startExperience: () => void;
  recalibrate: () => void;
  stopExperience: () => void;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Hardware-independent Cortex EEG hook.
 *
 * Device ownership remains outside Cortex. This hook acquires the global raw
 * EEG stream and runs only visualization-specific processing/calibration.
 */
export function useCortexEEG(): CortexEEGSnapshot {
  const [retryGeneration, setRetryGeneration] = useState(0);
  const [state, setState] = useState<CortexEEGState>("starting");
  const [error, setError] = useState<string | null>(null);
  const [sampleRateHz, setSampleRateHz] = useState<number | null>(null);
  const [channelCount, setChannelCount] = useState(0);
  const [lastSequence, setLastSequence] = useState<number | null>(null);
  const [processorSnapshot, setProcessorSnapshot] =
    useState<CortexProcessorSnapshot>(EMPTY_PROCESSOR_SNAPSHOT);

  const processorRef = useRef<CortexSignalProcessor | null>(null);
  const lastPublishAtRef = useRef(0);

  const retry = useCallback(() => {
    processorRef.current = null;
    lastPublishAtRef.current = 0;

    setState("starting");
    setError(null);
    setSampleRateHz(null);
    setChannelCount(0);
    setLastSequence(null);
    setProcessorSnapshot(EMPTY_PROCESSOR_SNAPSHOT);

    setRetryGeneration((generation) => generation + 1);
  }, []);

  const startExperience = useCallback(() => {
    const processor = processorRef.current;

    if (!processor) {
      return;
    }

    processor.startCalibration();
    setProcessorSnapshot(processor.snapshot());
  }, []);

  const recalibrate = useCallback(() => {
    const processor = processorRef.current;

    if (!processor) {
      return;
    }

    processor.startCalibration();
    setProcessorSnapshot(processor.snapshot());
  }, []);

  const stopExperience = useCallback(() => {
    const processor = processorRef.current;

    if (!processor) {
      return;
    }

    processor.stopExperience();
    setProcessorSnapshot(processor.snapshot());
  }, []);

  useEffect(() => {
    let cancelled = false;
    let handle: EEGStreamHandle | null = null;

    processorRef.current = null;
    lastPublishAtRef.current = 0;

    async function start(): Promise<void> {
      try {
        const acquiredHandle = await eegStreamService.acquire({
          channels: "all",
          onBatch: (batch) => {
            if (cancelled) {
              return;
            }

            const processor = processorRef.current;

            if (!processor) {
              return;
            }

            try {
              processor.processBatch(batch);
              setLastSequence(batch.sequenceStart + batch.sampleCount - 1);

              const now = performance.now();

              // React state is intentionally published at about 10 Hz.
              // Three.js performs its own frame-by-frame visual interpolation.
              if (now - lastPublishAtRef.current >= 90) {
                lastPublishAtRef.current = now;
                setProcessorSnapshot(processor.snapshot());
              }
            } catch (processingError) {
              setState("error");
              setError(getErrorMessage(processingError));
            }
          },
        });

        if (cancelled) {
          await acquiredHandle.release();
          return;
        }

        handle = acquiredHandle;

        processorRef.current = new CortexSignalProcessor(
          acquiredHandle.streamInfo.sampleRateHz,
          acquiredHandle.channels.map((channel) => channel.label),
        );

        setSampleRateHz(acquiredHandle.streamInfo.sampleRateHz);
        setChannelCount(acquiredHandle.channels.length);
        setProcessorSnapshot(processorRef.current.snapshot());
        setState("streaming");
      } catch (startError) {
        if (cancelled) {
          return;
        }

        setState("error");
        setError(getErrorMessage(startError));
      }
    }

    void start();

    return () => {
      cancelled = true;
      processorRef.current = null;

      const currentHandle = handle;
      handle = null;

      if (currentHandle) {
        void currentHandle.release();
      }
    };
  }, [retryGeneration]);

  return {
    state,
    error,
    sampleRateHz,
    channelCount,
    lastSequence,
    retry,
    startExperience,
    recalibrate,
    stopExperience,
    ...processorSnapshot,
  };
}
