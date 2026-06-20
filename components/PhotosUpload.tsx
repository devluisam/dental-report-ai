"use client";
import { useCallback, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PhotoItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2, Upload, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SortablePhotoProps {
  photo: PhotoItem;
  index: number;
  onRemove: (id: string) => void;
  onCaptionChange: (id: string, caption: string) => void;
}

function SortablePhoto({ photo, index, onRemove, onCaptionChange }: SortablePhotoProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg bg-white overflow-hidden">
      <div className="flex items-center gap-2 p-2 bg-gray-50 border-b">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          type="button"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-xs font-medium text-gray-500 flex-1">
          Foto {String(index + 1).padStart(2, "0")}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(photo.id)}
          className="h-6 w-6 text-red-400 hover:text-red-600"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <div className="p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.preview}
          alt={`Foto ${index + 1}`}
          className="w-full h-32 object-cover rounded"
        />
        <Input
          className="mt-2 text-xs h-7"
          placeholder={`Legenda (ex: Foto ${String(index + 1).padStart(2, "0")})`}
          value={photo.caption}
          onChange={(e) => onCaptionChange(photo.id, e.target.value)}
        />
      </div>
    </div>
  );
}

interface Props {
  photos: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
}

export function PhotosUpload({ photos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleFiles = useCallback(
    (files: FileList) => {
      const newPhotos: PhotoItem[] = Array.from(files)
        .filter((f) => f.type.startsWith("image/"))
        .map((file, i) => ({
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          caption: `Foto ${String(photos.length + i + 1).padStart(2, "0")}`,
        }));
      onChange([...photos, ...newPhotos]);
    },
    [photos, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = photos.findIndex((p) => p.id === active.id);
      const newIndex = photos.findIndex((p) => p.id === over.id);
      onChange(arrayMove(photos, oldIndex, newIndex));
    }
  };

  const removePhoto = (id: string) => {
    onChange(photos.filter((p) => p.id !== id));
  };

  const updateCaption = (id: string, caption: string) => {
    onChange(photos.map((p) => (p.id === id ? { ...p, caption } : p)));
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 font-medium">
          Clique ou arraste fotos aqui
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Fotos de procedimentos, fichas assinadas, documentos
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-4 text-gray-400">
          <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-30" />
          <p className="text-xs">Nenhuma foto adicionada</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500">
            {photos.length} foto(s) • Arraste para reordenar
          </p>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 gap-3">
                {photos.map((photo, index) => (
                  <SortablePhoto
                    key={photo.id}
                    photo={photo}
                    index={index}
                    onRemove={removePhoto}
                    onCaptionChange={updateCaption}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  );
}
