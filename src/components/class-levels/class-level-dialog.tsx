'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ClassLevel {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  capacity: number;
  color: string;
  organizationId: string;
}

interface ClassLevelDialogProps {
  organizationId: string;
  editingLevel?: ClassLevel;
  onSuccess?: () => void;
}

export function ClassLevelDialog({
  organizationId,
  editingLevel,
  onSuccess,
}: ClassLevelDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(editingLevel?.name ?? "");
  const [description, setDescription] = useState(editingLevel?.description ?? "");
  const [sortOrder, setSortOrder] = useState(
    editingLevel?.sortOrder?.toString() ?? ""
  );
  const [capacity, setCapacity] = useState(
    editingLevel?.capacity?.toString() ?? "8"
  );
  const [color, setColor] = useState(editingLevel?.color ?? "#3B82F6");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(
        editingLevel
          ? `/api/organizations/${organizationId}/class-levels/${editingLevel.id}`
          : `/api/organizations/${organizationId}/class-levels`,
        {
          method: editingLevel ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description,
            sortOrder: parseInt(sortOrder),
            capacity: parseInt(capacity),
            color,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save class level");
      }

      router.refresh();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving class level:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editingLevel ? (
          <Button variant="ghost" size="icon" className="text-indigo-300 hover:text-indigo-900 inline-flex items-center">
            <PencilIcon className="h-5 w-5" />
          </Button>
        ) : (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-5 w-5 mr-2" />
            Add Level
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingLevel ? "Edit Class Level" : "Add Class Level"}
          </DialogTitle>
          <DialogDescription>
            {editingLevel
              ? "Update the details of this class level"
              : "Add a new class level to your organization"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="capacity">Class Size</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sortOrder">Display Order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer">
                    <div
                      className="w-10 h-10 rounded-md border"
                      style={{ backgroundColor: color }}
                    />
                    <Input
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-28"
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <HexColorPicker color={color} onChange={setColor} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting
                ? "Saving..."
                : editingLevel
                ? "Save Changes"
                : "Add Level"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 