'use client';

import { Upload, Layers, Radio } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { cn } from '@/lib/utils';

const tabs = [
    { id: 'upload' as const, icon: Upload, label: 'Upload' },
    { id: 'elements' as const, icon: Layers, label: 'Elements' },
    { id: 'live' as const, icon: Radio, label: 'Live' },
];

export default function LeftSidebar() {
    const { activeLeftTab, setActiveLeftTab, isDarkMode } = useEditorStore();

    return (
        <aside className={cn(
            "w-16 flex flex-col items-center py-4 border-r",
            isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        )}>
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeLeftTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveLeftTab(tab.id)}
                        className={cn(
                            "w-12 h-12 flex flex-col items-center justify-center rounded-lg mb-2 transition-all",
                            isActive
                                ? "bg-cyan-50 text-cyan-500"
                                : isDarkMode
                                    ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        )}
                    >
                        <Icon className="w-5 h-5 mb-0.5" />
                        <span className="text-[10px] font-medium">{tab.label}</span>
                    </button>
                );
            })}
        </aside>
    );
}
