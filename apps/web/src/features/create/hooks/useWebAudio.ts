/**
 * useWebAudio — MediaRecorder-based voice recording hook.
 *
 * Exposes start/stop/pause/resume controls and returns the recorded Blob,
 * an object URL for local playback, elapsed time in ms, and an AnalyserNode
 * for waveform visualisation.
 */

import { useState, useRef, useCallback, useEffect } from 'react'

export type RecordingState = 'idle' | 'recording' | 'paused' | 'done'

interface UseWebAudioReturn {
  recordingState: RecordingState
  durationMs: number
  audioBlob: Blob | null
  audioUrl: string | null
  analyser: AnalyserNode | null
  startRecording: () => Promise<void>
  stopRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void
  reset: () => void
  error: string | null
}

export function useWebAudio(): UseWebAudioReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [durationMs, setDurationMs] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const accumulatedRef = useRef<number>(0)

  // Revoke object URL on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      timerRef.current && clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioCtxRef.current?.close()
    }
  }, [audioUrl])

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setDurationMs(accumulatedRef.current + (Date.now() - startTimeRef.current))
    }, 100)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    accumulatedRef.current += Date.now() - startTimeRef.current
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up Web Audio API analyser for waveform visualisation
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const node = ctx.createAnalyser()
      node.fftSize = 256
      source.connect(node)
      setAnalyser(node)

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        setRecordingState('done')
      }

      recorder.start(100) // collect chunks every 100ms
      accumulatedRef.current = 0
      setDurationMs(0)
      startTimer()
      setRecordingState('recording')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Microphone access denied.'
      setError(msg.includes('Permission') || msg.includes('NotAllowed')
        ? 'Microphone permission denied. Allow microphone access and try again.'
        : 'Could not start recording. Check your microphone.')
    }
  }, [startTimer])

  const stopRecording = useCallback(() => {
    stopTimer()
    mediaRecorderRef.current?.stop()
    audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null
    setAnalyser(null)
  }, [stopTimer])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause()
      stopTimer()
      setRecordingState('paused')
    }
  }, [stopTimer])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume()
      startTimer()
      setRecordingState('recording')
    }
  }, [startTimer])

  const reset = useCallback(() => {
    stopTimer()
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    audioCtxRef.current?.close().catch(() => {})
    streamRef.current = null
    audioCtxRef.current = null
    mediaRecorderRef.current = null
    chunksRef.current = []
    accumulatedRef.current = 0
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioUrl(null)
    setAnalyser(null)
    setDurationMs(0)
    setRecordingState('idle')
    setError(null)
  }, [stopTimer, audioUrl])

  return {
    recordingState,
    durationMs,
    audioBlob,
    audioUrl,
    analyser,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    reset,
    error,
  }
}
