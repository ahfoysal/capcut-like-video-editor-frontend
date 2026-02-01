import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  Sparkles,
  CheckCircle2,
  Film,
  Settings2,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";

const getAssetUrl = (url?: string) => {
  if (!url) return "";
  if (
    url.startsWith("http") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  )
    return url;
  return `http://localhost:3001${url.startsWith("/") ? "" : "/"}${url}`;
};

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [status, setStatus] = useState<"idle" | "exporting" | "completed">(
    "idle",
  );
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  const { pages, projectName, setTimelinePosition, isPlaying, togglePlay } =
    useEditorStore();

  useEffect(() => {
    let recorderVar: MediaRecorder | null = null;
    let audioContext: AudioContext | null = null;
    let audioDestination: MediaStreamAudioDestinationNode | null = null;
    const chunks: Blob[] = [];

    if (status === "exporting") {
      // Enable canvas drawing for export (EditorCanvas checks this)
      document.body.classList.add("export-in-progress");

      const canvas = document.getElementById(
        "editor-canvas",
      ) as HTMLCanvasElement;
      if (!canvas) {
        console.error("Canvas not found");
        document.body.classList.remove("export-in-progress");
        return;
      }

      // Get the visual stream from canvas
      const videoStream = canvas.captureStream(30);

      // Create audio context to mix all audio
      audioContext = new AudioContext({ sampleRate: 44100 });
      audioDestination = audioContext.createMediaStreamDestination();

      const state = useEditorStore.getState();
      const allPages = state.pages;

      // Calculate page ranges and total duration
      let totalDuration = 0;
      const pageRanges = allPages.map((p) => {
        const start = totalDuration;
        const end = totalDuration + p.duration;
        totalDuration = end;
        return { id: p.id, start, end };
      });

      // Combine video and audio streams
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...(audioDestination.stream.getAudioTracks().length > 0
          ? audioDestination.stream.getAudioTracks()
          : []),
      ]);

      const options: MediaRecorderOptions = {
        mimeType: "video/webm;codecs=vp9,opus",
        videoBitsPerSecond: 8000000, // High quality
        audioBitsPerSecond: 128000,
      };
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        options.mimeType = "video/webm";
      }
      recorderVar = new MediaRecorder(combinedStream, options);

      recorderVar.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorderVar.onstop = () => {
        document.body.classList.remove("export-in-progress");
        const blob = new Blob(chunks, { type: "video/webm" });
        setRecordedBlob(blob);
        setStatus("completed");
        setTimelinePosition(0);
        if (isPlaying) togglePlay();
        if (audioContext && audioContext.state !== "closed") {
          audioContext.close();
        }
      };

      // Function to connect current page audio elements
      const connectPageAudio = (pageId: string) => {
        if (!audioContext || !audioDestination) return;
        const page = allPages.find((p) => p.id === pageId);
        if (!page) return;

        const audioElements = page.elements.filter((el) => el.type === "audio");
        const videoElements = page.elements.filter((el) => el.type === "video");

        // Connect Audio
        audioElements.forEach((el) => {
          try {
            const audioEl = Array.from(document.querySelectorAll("audio")).find(
              (audio) => {
                const src = audio.getAttribute("src") || "";
                return src.includes(el.src) || src === getAssetUrl(el.src);
              },
            ) as HTMLAudioElement;

            if (audioEl && !(audioEl as any).audioSourceNode) {
              const source = audioContext!.createMediaElementSource(audioEl);
              (audioEl as any).audioSourceNode = source;
              const gainNode = audioContext!.createGain();
              gainNode.gain.value = (el.volume ?? 100) / 100;
              source.connect(gainNode);
              gainNode.connect(audioDestination!);
            }
          } catch (e) {
            console.warn("Audio connection error:", e);
          }
        });

        // Connect Video
        videoElements.forEach((el) => {
          try {
            const videoEl = Array.from(document.querySelectorAll("video")).find(
              (video) => {
                const src = video.getAttribute("src") || "";
                return src.includes(el.src) || src === getAssetUrl(el.src);
              },
            ) as HTMLVideoElement;

            if (videoEl && !(videoEl as any).audioSourceNode) {
              videoEl.muted = false; // Must be unmuted for AudioContext to hear it
              const source = audioContext!.createMediaElementSource(videoEl);
              (videoEl as any).audioSourceNode = source;
              const gainNode = audioContext!.createGain();
              gainNode.gain.value = (el.volume ?? 100) / 100;
              source.connect(gainNode);
              gainNode.connect(audioDestination!);
            }
          } catch (e) {
            console.warn("Video audio connection error:", e);
          }
        });
      };

      // Function to wait for images and videos on the page to be ready
      const waitForMedia = async () => {
        const mediaElements = Array.from(
          document.querySelectorAll("#editor-canvas img, #editor-canvas video"),
        ) as (HTMLImageElement | HTMLVideoElement)[];
        await Promise.all(
          mediaElements.map((el) => {
            if (el.tagName === "IMG") {
              if ((el as HTMLImageElement).complete) return Promise.resolve();
              return new Promise((resolve) => {
                el.onload = resolve;
                el.onerror = resolve;
              });
            } else {
              // For video, we wait for the seek to complete
              if (
                (el as HTMLVideoElement).readyState >= 2 &&
                !(el as HTMLVideoElement).seeking
              )
                return Promise.resolve();
              return new Promise((resolve) => {
                el.onseeked = resolve;
                el.oncanplay = resolve;
                el.onerror = resolve;
              });
            }
          }),
        );
        // Small extra delay for React/DOM updates
        await new Promise((resolve) => setTimeout(resolve, 50));
      };

      // Start Recording
      setTimelinePosition(0);
      const startRecording = async () => {
        if (audioContext?.state === "suspended") {
          await audioContext.resume();
        }
        setTimeout(() => {
          recorderVar?.start(100);
          renderFrame();
        }, 800);
      };

      // Render Loop
      let animationFrame: number;
      let currentTime = 0;
      const fps = 30;
      const step = 1 / fps;

      const renderFrame = async () => {
        if (currentTime >= totalDuration) {
          recorderVar?.stop();
          return;
        }

        const range = pageRanges.find(
          (r) => currentTime >= r.start && currentTime < r.end,
        );

        if (range && range.id !== useEditorStore.getState().currentPageId) {
          useEditorStore.getState().setCurrentPage(range.id);
          // Wait for mount and audio connection
          await new Promise((resolve) => setTimeout(resolve, 300));
          connectPageAudio(range.id);
        }

        const relativeTime = range ? currentTime - range.start : 0;
        setTimelinePosition(relativeTime);
        setProgress((currentTime / totalDuration) * 100);

        // Wait for elements to seek/load
        await waitForMedia();

        currentTime += step;
        animationFrame = requestAnimationFrame(renderFrame);
      };

      // Initial setup
      setTimeout(() => {
        connectPageAudio(state.currentPageId);
        startRecording();
      }, 500);

      return () => {
        document.body.classList.remove("export-in-progress");
        cancelAnimationFrame(animationFrame);
        if (recorderVar && recorderVar.state !== "inactive") recorderVar.stop();
        if (audioContext && audioContext.state !== "closed")
          audioContext.close();
      };
    }
  }, [status, pages, setTimelinePosition, isPlaying, togglePlay]);

  if (!isOpen) return null;

  const handleStartExport = () => {
    setStatus("exporting");
    setProgress(0);
    setConvertError(null);
  };

  const handleDownload = async () => {
    if (!recordedBlob) return;

    setIsConverting(true);
    setConvertError(null);

    try {
      const formData = new FormData();
      formData.append("video", recordedBlob, "export.webm");

      const res = await fetch("http://localhost:3001/export/convert", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(res.statusText || "Conversion failed");
      }

      const mp4Blob = await res.blob();
      const url = URL.createObjectURL(mp4Blob);
      const element = document.createElement("a");
      element.setAttribute("href", url);
      element.setAttribute("download", `${projectName || "project"}.mp4`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      setConvertError(
        err instanceof Error
          ? err.message
          : "Conversion failed. Downloading as WebM instead.",
      );
      // Fallback: download WebM
      const url = URL.createObjectURL(recordedBlob);
      const element = document.createElement("a");
      element.setAttribute("href", url);
      element.setAttribute("download", `${projectName || "project"}.webm`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(url);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={status === "exporting" ? undefined : onClose}
      />

      {/* Modal content */}
      <div className="relative w-full max-w-lg bg-bg-panel border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-border flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/20">
              <Film className="text-accent w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-main">
                Export Project
              </h3>
              <p className="text-[11px] text-text-muted font-medium uppercase tracking-wider mt-0.5">
                MP4 Video • H.264
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-text-main"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {status === "idle" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-accent/30 transition-all group cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                      Resolution
                    </span>
                    <Settings2 className="w-3 h-3 text-text-muted group-hover:text-accent" />
                  </div>
                  <div className="text-xl font-bold text-text-main">1080p</div>
                  <div className="text-[11px] text-text-muted mt-1 italic">
                    High Definition (Full HD)
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-accent/30 transition-all group cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                      Frame Rate
                    </span>
                    <Sparkles className="w-3 h-3 text-text-muted group-hover:text-accent" />
                  </div>
                  <div className="text-xl font-bold text-text-main">30 fps</div>
                  <div className="text-[11px] text-text-muted mt-1 italic">
                    Smooth playback
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-accent/5 border border-accent/10 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="text-accent w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-main">
                    Ready to render
                  </h4>
                  <p className="text-[12px] text-text-muted mt-1 leading-relaxed">
                    Your project &quot;{projectName}&quot; is optimized and
                    ready for export. The process will take approximately 1-2
                    minutes.
                  </p>
                </div>
              </div>

              <button
                onClick={handleStartExport}
                className="w-full bg-accent text-black hover:bg-cyan-300 h-14 rounded-xl font-bold text-base transition-all shadow-[0_4px_20px_rgba(34,211,238,0.2)] active:scale-95 flex items-center justify-center gap-2 group"
              >
                Start Export
                <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
              </button>
            </div>
          )}

          {status === "exporting" && (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="relative w-24 h-24 mb-8">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-white/5"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={283}
                    strokeDashoffset={283 - (283 * progress) / 100}
                    className="text-accent transition-all duration-300 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-black text-text-main">
                    {Math.floor(progress)}%
                  </span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-text-main mb-2">
                Generating Video...
              </h3>
              <p className="text-sm text-text-muted px-12">
                Encoding frames and stitching layers. Please don&apos;t close
                this window.
              </p>

              <div className="mt-8 w-full max-w-sm h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {status === "completed" && (
            <div className="py-10 flex flex-col items-center text-center animate-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <CheckCircle2 className="text-emerald-400 w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-text-main mb-2">
                Export Complete!
              </h3>
              <p className="text-sm text-text-muted mb-6 px-10 leading-relaxed">
                Your masterpiece is ready. Click the button below to convert and
                save as MP4.
              </p>
              {convertError && (
                <p className="text-xs text-amber-400 mb-4 px-6">
                  {convertError}
                </p>
              )}
              <button
                onClick={handleDownload}
                disabled={isConverting}
                className="w-full bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed h-14 rounded-xl font-bold text-base transition-all shadow-[0_4px_20px_rgba(16,185,129,0.2)] active:scale-95 flex items-center justify-center gap-3 group"
              >
                {isConverting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Converting to MP4...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                    Download MP4
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
