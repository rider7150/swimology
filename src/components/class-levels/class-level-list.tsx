'use client';

import { ClassLevelDialog } from "@/components/class-levels/class-level-dialog";
import { DeleteClassLevel } from "@/components/class-levels/delete-class-level";
import { ListChecks, GripVertical } from "lucide-react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';

interface ClassLevel {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  organizationId: string;
  color?: string;
  capacity?: number;
}

interface ClassLevelListProps {
  organizationId: string;
  classLevels: ClassLevel[];
}

interface SortableRowProps {
  level: ClassLevel;
  organizationId: string;
}

function SortableRow({ level, organizationId }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: level.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr ref={setNodeRef} style={style} {...attributes}>
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
        <div className="flex items-center">
          <button
            className="cursor-grab mr-2 text-gray-400 hover:text-gray-600"
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <div>
            <div className="font-medium text-gray-900 flex items-center">
              {level.name}
              {level.color && (
                <span
                  className="inline-block w-4 h-4 rounded-full ml-2 align-middle border border-gray-300"
                  style={{ backgroundColor: level.color }}
                  title={level.color}
                />
              )}
            </div>
            {level.description && (
              <div className="text-gray-500">
                {level.description}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        {level.sortOrder}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
        <div className="flex justify-end items-center gap-4">
          <ClassLevelDialog
            organizationId={organizationId}
            editingLevel={{
              ...level,
              capacity: level.capacity ?? 0,
              color: level.color ?? '#000000'
            }}
          />
          <Link
            href={`/organizations/${organizationId}/class-levels/${level.id}/skills`}
            className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
          >
            <ListChecks className="h-5 w-5" />
          </Link>
          <DeleteClassLevel
            organizationId={organizationId}
            levelId={level.id}
            levelName={level.name}
          />
        </div>
      </td>
    </tr>
  );
}

export function ClassLevelList({ organizationId, classLevels: initialClassLevels }: ClassLevelListProps) {
  const [classLevels, setClassLevels] = useState(initialClassLevels);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = classLevels.findIndex((level) => level.id === active.id);
      const newIndex = classLevels.findIndex((level) => level.id === over.id);
      
      const newLevels = arrayMove(classLevels, oldIndex, newIndex).map(
        (level, index) => ({ ...level, sortOrder: index })
      );
      
      setClassLevels(newLevels);
      
      // Update the backend
      try {
        const response = await fetch(`/api/organizations/${organizationId}/class-levels/reorder`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ levels: newLevels }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update order');
        }
      } catch (error) {
        console.error('Error updating order:', error);
        // Revert the state on error
        setClassLevels(initialClassLevels);
      }
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <div />
          <ClassLevelDialog organizationId={organizationId} />
        </div>

        <div className="mt-4">
          {classLevels.length === 0 ? (
            <p className="text-sm text-gray-500">No class levels defined yet.</p>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Level
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Display Order
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <SortableContext
                    items={classLevels.map(level => level.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {classLevels.map((level) => (
                        <SortableRow
                          key={level.id}
                          level={level}
                          organizationId={organizationId}
                        />
                      ))}
                    </tbody>
                  </SortableContext>
                </table>
              </DndContext>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 