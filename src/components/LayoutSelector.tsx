import { X } from "lucide-react";
import { PRESET_LAYOUTS, GridLayout } from "@/lib/gridLayouts";

interface LayoutSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLayout: (layout: GridLayout) => void;
  currentLayout?: GridLayout | null;
}

export function LayoutSelector({
  isOpen,
  onClose,
  onSelectLayout,
  currentLayout,
}: LayoutSelectorProps) {
  const handleSelectLayout = (layout: GridLayout) => {
    onSelectLayout(layout);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Select Layout</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-5 gap-4 p-6">
          {PRESET_LAYOUTS.map((layout) => {
            const isSelected = currentLayout?.id === layout.id;

            return (
              <button
                key={layout.id}
                onClick={() => handleSelectLayout(layout)}
                className={`
                  relative aspect-video rounded-lg border-2 p-3 transition-all
                  hover:border-[#5956E8] hover:bg-gray-50
                  ${isSelected ? "border-[#5956E8] bg-[#5956E8]/5" : "border-gray-200"}
                `}
                title={layout.name}
              >
                <div className="h-full w-full">
                  <GridPreview layout={layout} />
                </div>
                <p className="mt-2 text-xs text-center text-gray-600">
                  {layout.name}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Component to render visual preview of grid layout
function GridPreview({ layout }: { layout: GridLayout }) {
  return (
    <div
      className="w-full h-full grid gap-1"
      style={{
        gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
        gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
      }}
    >
      {layout.cells.map((cell) => (
        <div
          key={cell.id}
          className="bg-gray-300 rounded-sm"
          style={{
            gridColumn: `${cell.col + 1} / span ${cell.colSpan}`,
            gridRow: `${cell.row + 1} / span ${cell.rowSpan}`,
          }}
        />
      ))}
    </div>
  );
}
