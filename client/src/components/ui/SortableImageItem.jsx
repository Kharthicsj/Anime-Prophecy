import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableImageItem = ({ id, img, index, removeImage, setMain }) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		zIndex: isDragging ? 10 : 1,
	};
	return (
		<div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`relative group aspect-square rounded-xl overflow-hidden bg-zinc-800 border-2 cursor-grab active:cursor-grabbing ${isDragging ? "opacity-75 ring-2 ring-purple-500 shadow-xl scale-105" : "opacity-100"} ${img.isMain ? "border-purple-500" : "border-transparent hover:border-zinc-600"}`}>
			<img src={img.previewUrl || img.url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105 pointer-events-none" />
			<div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
				<div className="flex justify-end">
					<button type="button" onPointerDown={(e) => { e.stopPropagation(); removeImage(index); }} className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer relative z-10">×</button>
				</div>
				<button type="button" onPointerDown={(e) => { e.stopPropagation(); setMain(index); }} className={`py-1.5 text-xs font-semibold rounded-lg w-full cursor-pointer relative z-10 ${img.isMain ? "bg-purple-600 text-white" : "bg-white/20 text-white hover:bg-white/30"}`}>{img.isMain ? "Main Image" : "Set as Main"}</button>
			</div>
		</div>
	);
};
export default SortableImageItem;
