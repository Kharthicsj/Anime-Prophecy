import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableVideoItem = ({ id, vid, index, removeVideo, setPrimaryVideo }) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		zIndex: isDragging ? 10 : 1,
	};
	return (
		<div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`rounded-xl overflow-hidden border-2 cursor-grab active:cursor-grabbing ${isDragging ? "opacity-75 ring-2 ring-blue-500 shadow-xl scale-[1.02]" : "opacity-100"} ${vid.isPrimary ? "border-blue-500" : "border-zinc-700"}`}>
			<video src={vid.previewUrl || vid.url} controls preload="metadata" className="w-full max-h-48 object-contain bg-black" onPointerDown={(e) => e.stopPropagation()} />
			<div className="flex items-center justify-between px-3 py-2 bg-zinc-900 pointer-events-auto relative z-10">
				<div className="flex items-center gap-2">
					{vid.isPrimary ? (
						<span className="text-xs text-blue-400 font-semibold">&#9679; Primary Video</span>
					) : (
						<button type="button" onPointerDown={(e) => { e.stopPropagation(); setPrimaryVideo(index); }} className="text-xs text-zinc-400 hover:text-blue-400 transition-colors cursor-pointer relative z-10">Set as Primary</button>
					)}
					{!vid.url && <span className="text-xs text-yellow-500">⏳ Pending</span>}
					{vid.url && <span className="text-xs text-green-500">✓ Saved</span>}
				</div>
				<button type="button" onPointerDown={(e) => { e.stopPropagation(); removeVideo(index); }} className="p-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-bold transition-colors cursor-pointer relative z-10">&times;</button>
			</div>
		</div>
	);
};
export default SortableVideoItem;
