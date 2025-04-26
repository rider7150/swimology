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
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function SortableRow({ level, organizationId, onSuccess }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: level.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className={isDragging ? "bg-gray-50" : ""}>
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
        <div className="flex items-center gap-2">
          <button
            className="cursor-move touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </button>
          {level.name}
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        {level.description}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        <div className="flex items-center">
          <div
            className="w-6 h-6 rounded-md border"
            style={{ backgroundColor: level.color }}
            title={level.color}
          />
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {level.capacity}
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        {level.sortOrder}
      </td>
      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
        <div className="flex justify-end gap-2">
          <ClassLevelDialog
            organizationId={organizationId}
            editingLevel={level}
            onSuccess={onSuccess}
          />
          <Link
            href={`/organizations/${organizationId}/class-levels/${level.id}/skills`}
            className="text-indigo-600 hover:text-indigo-900"
          >
            <Button variant="ghost" size="sm">
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
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    }
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
    
    if (!over || active.id === over.id || !classLevels) {
      return;
    }

    const oldIndex = classLevels.findIndex((level) => level.id === active.id);
    const newIndex = classLevels.findIndex((level) => level.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const updatedLevels = arrayMove(classLevels, oldIndex, newIndex).map(
      (level, index) => ({
        ...level,
        sortOrder: index,
      })
    );

    // Optimistically update the UI
    mutate(updatedLevels, false);

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/class-levels/reorder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            levels: updatedLevels.map((level) => ({
              id: level.id,
              sortOrder: level.sortOrder,
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reorder class levels");
      }

      toast.success("Class levels reordered successfully");
      mutate(); // Refresh the data to ensure it's in sync
    } catch (error) {
      toast.error("Failed to reorder class levels");
      mutate(); // Revert to the server state
    }
  };

  if (!classLevels) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-xl font-semibold text-gray-900">Class Levels</h2>
          <p className="mt-2 text-sm text-gray-700">
            A list of all class levels in your organization. Drag to reorder.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <ClassLevelDialog 
            organizationId={organizationId} 
            onSuccess={handleSuccess}
          />
        </div>
      </div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Color
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Class Size
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Display Order
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={classLevels.map((level) => level.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {classLevels.map((level) => (
                      <SortableRow
                        key={level.id}
                        level={level}
                        organizationId={organizationId}
                        onSuccess={handleSuccess}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 