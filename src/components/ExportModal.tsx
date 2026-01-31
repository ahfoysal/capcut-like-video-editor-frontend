  Film,
  Settings2,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [status, setStatus] = useState<"idle" | "exporting" | "completed">(
    "idle",
  );
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const { pages, projectName, setTimelinePosition, isPlaying, togglePlay } =
    useEditorStore();

  useEffect(() => {
    let recorderVar: MediaRecorder | null = null;
    let chunks: Blob[] = [];

    if (status === "exporting") {
      const canvas = document.getElementById(
        "editor-canvas",
      ) as HTMLCanvasElement;
      if (!canvas) {
        console.error("Canvas not found");
        return;
      }

      const stream = canvas.captureStream(30); // 30 FPS
      recorderVar = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9", // Chrome/Webkit support for high quality
      });

      recorderVar.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorderVar.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        setRecordedBlob(blob);
        setStatus("completed");
        setTimelinePosition(0);
        if (isPlaying) togglePlay();
      };

      // Calculate total duration
      const state = useEditorStore.getState();
      const currentPage = pages.find((p) => p.id === state.currentPageId);
      const elements = currentPage?.elements || [];
      const totalDuration = elements.reduce(
        (max, el) => Math.max(max, el.startTime + el.duration),
        0,
      );

      // Start recording
      setTimelinePosition(0);
      recorderVar.start();
      setIsRecording(true);

      // Animation loop for progress
      const startTime = Date.now();
      const playbackDuration = totalDuration * 1000;

      let animationFrame: number;
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const currentProgress = Math.min(
          (elapsed / playbackDuration) * 100,
          100,
        );

        setProgress(currentProgress);
        setTimelinePosition(elapsed / 1000);

        if (elapsed < playbackDuration) {
          animationFrame = requestAnimationFrame(updateProgress);
        } else {
          recorderVar?.stop();
          setIsRecording(false);
        }
      };

      animationFrame = requestAnimationFrame(updateProgress);

      return () => {
        cancelAnimationFrame(animationFrame);
        if (recorderVar && recorderVar.state !== "inactive") {
          recorderVar.stop();
        }
      };
    }
  }, [status, pages, setTimelinePosition, isPlaying, togglePlay]);

  if (!isOpen) return null;

  const handleStartExport = () => {
    setStatus("exporting");
    setProgress(0);
  };

  const handleDownload = () => {
    if (!recordedBlob) return;

    const url = URL.createObjectURL(recordedBlob);
    const element = document.createElement("a");
    element.setAttribute("href", url);
    element.setAttribute("download", `${projectName}.webm`); // WebM is more reliable for MediaRecorder output
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(url);
    onClose();
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
                    Your project &quot;{projectName}&quot; is optimized and ready for
                    export. The process will take approximately 1-2 minutes.
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
                Encoding frames and stitching layers. Please don&apos;t close this
                window.
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
              <p className="text-sm text-text-muted mb-10 px-10 leading-relaxed">
                Your masterpiece is ready. Click the button below to save it to
                your device.
              </p>
              <button
                onClick={handleDownload}
                className="w-full bg-emerald-500 text-white hover:bg-emerald-400 h-14 rounded-xl font-bold text-base transition-all shadow-[0_4px_20px_rgba(16,185,129,0.2)] active:scale-95 flex items-center justify-center gap-3 group"
              >
                <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                Download MP4
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
