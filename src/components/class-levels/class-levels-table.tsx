'use client';

import { useState, useEffect } from "react";
import { ClassLevelDialog } from "./class-level-dialog";
import { DeleteClassLevel } from "./delete-class-level";
import { Users, GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

interface ClassLevel {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  capacity: number;
  color: string;
  organizationId: string;
}

interface ClassLevelsTableProps {
  organizationId: string;
}

interface SortableRowProps {
  level: ClassLevel;
  organizationId: string;
  onSuccess: () => void;
  index: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function SortableRow({
  level,
  organizationId,
  onSuccess,
  index,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: level.id });

  const background = isDragging
    ? "bg-white"
    : index % 2 === 0
    ? "bg-white"
    : "bg-gray-50";
  const dragAccent = isDragging ? "border-l-4 border-indigo-600" : "";
  const rowClasses = `${background} ${dragAccent} hover:bg-indigo-50 transition-colors`;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr ref={setNodeRef} style={style} className={rowClasses}>
      {/* Name */}
        <td className="whitespace-nowrap overflow-hidden py-3 pl-2 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
        <div className="flex items-center gap-0 overflow-hidden">
          <button className="flex-shrink-0 cursor-move touch-none" {...attributes} {...listeners}>
            <GripVertical className="h-4 w-4 text-gray-400" />
          </button>
          <span
            className="truncate"
            title={level.name}
          >
            {level.name}
          </span>
        </div>
      </td>

      {/* Description */}
      <td className="hidden sm:table-cell whitespace-nowrap px-3 py-3 text-sm text-gray-500">
        {level.description}
      </td>

      {/* Color */}
      <td className="hidden md:table-cell whitespace-nowrap px-3 py-3 text-sm text-gray-500">
        <div className="flex items-center">
          <div
            className="w-6 h-6 rounded-md border"
            style={{ backgroundColor: level.color }}
            title={level.color}
          />
        </div>
      </td>

      {/* Capacity */}
      <td className="hidden lg:table-cell whitespace-nowrap px-3 py-3 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {level.capacity}
        </div>
      </td>

      {/* Sort order */}
      <td className="hidden lg:table-cell whitespace-nowrap px-3 py-3 text-sm text-gray-500">
        {level.sortOrder}
      </td>

      {/* Actions */}
      <td className="relative whitespace-nowrap py-3 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
        <div className="flex justify-end gap-2">
          <ClassLevelDialog
            organizationId={organizationId}
            editingLevel={level}
            onSuccess={onSuccess}
          />
          <Link href={`/organizations/${organizationId}/class-levels/${level.id}/skills`}>
            <Button variant="ghost" size="icon" className="text-indigo-300 hover:text-indigo-600">
              <ClipboardDocumentListIcon className="h-5 w-5" />
              <span className="sr-only">Manage Skills</span>
            </Button>
          </Link>
          <DeleteClassLevel
            organizationId={organizationId}
            levelId={level.id}
            levelName={level.name}
            onSuccess={onSuccess}
          />
        </div>
      </td>
    </tr>
  );
}

export function ClassLevelsTable({ organizationId }: ClassLevelsTableProps) {
  const router = useRouter();
  const { data: classLevels, mutate } = useSWR<ClassLevel[]>(
    `/api/organizations/${organizationId}/class-levels`,
    fetcher,
    { refreshInterval: 0, revalidateOnFocus: false }
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSuccess = () => {
    mutate();
    router.refresh();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !classLevels) return;

    const oldIndex = classLevels.findIndex((l) => l.id === active.id);
    const newIndex = classLevels.findIndex((l) => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const updated = arrayMove(classLevels, oldIndex, newIndex).map((lvl, i) => ({
      ...lvl,
      sortOrder: i,
    }));
    mutate(updated, false);

    try {
      const res = await fetch(
        `/api/organizations/${organizationId}/class-levels/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            levels: updated.map((lvl) => ({ id: lvl.id, sortOrder: lvl.sortOrder })),
          }),
        }
      );
      if (!res.ok) throw new Error();
      toast.success("Class levels reordered successfully");
      mutate();
    } catch {
      toast.error("Failed to reorder class levels");
      mutate();
    }
  };

  if (!classLevels) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
          <div className="flex justify-end space-x-4">
      <ClassLevelDialog
        organizationId={organizationId}
        onSuccess={handleSuccess}
      />
    </div>
          {/* DRAG & DROP CONTEXTS */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={classLevels.map((lvl) => lvl.id)}
          strategy={verticalListSortingStrategy}
        >
      <div className="mt-8">
        {/* Card wrapper */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:pr-0"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Color
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Class Size
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Display Order
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:pr-0"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classLevels.map((level, idx) => (
                  <SortableRow
                    key={level.id}
                    level={level}
                    organizationId={organizationId}
                    onSuccess={handleSuccess}
                    index={idx}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </SortableContext>
      </DndContext>
    </div>
  );
}