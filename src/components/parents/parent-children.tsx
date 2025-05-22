import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format, startOfMonth } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusIcon, UserMinusIcon } from "@heroicons/react/24/outline";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Child {
  id: string;
  name: string;
  birthDate: string;
  parents?: Array<{
    id: string;
    name: string;
  }>;
}

interface Lesson {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  instructor: { user: { name: string } };
  classLevel: { name: string };
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface ParentChildrenProps {
  parentId: string;
  organizationId: string;
}

interface Instructor {
  id: string;
  name: string;
}

export function ParentChildren({ parentId, organizationId }: ParentChildrenProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [availableChildren, setAvailableChildren] = useState<Child[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [childToRemove, setChildToRemove] = useState<Child | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedDay, setSelectedDay] = useState("");
  const [filteredByDayLessons, setFilteredByDayLessons] = useState<Lesson[]>([]);
  const [startDate, setStartDate] = useState(new Date());
  const [newChild, setNewChild] = useState({
    name: "",
    birthDate: "",
    lessonId: "",
  });
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  const fetchChildren = async () => {
    try {
      const response = await fetch(`/api/parents/${parentId}/children`);
      if (!response.ok) throw new Error("Failed to fetch children");
      const data = await response.json();
      setChildren(data);
    } catch (error) {
      console.error("Error fetching children:", error);
      toast.error("Failed to fetch children");
    }
  };

  const fetchAvailableChildren = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/children`);
      if (!response.ok) throw new Error("Failed to fetch available children");
      const data = await response.json();
      // Filter out children that are already associated with this parent
      const filteredChildren = data.filter(
        (child: Child) => !child.parents?.some((p) => p.id === parentId)
      );
      setAvailableChildren(filteredChildren);
    } catch (error) {
      console.error("Error fetching available children:", error);
      toast.error("Failed to fetch available children");
    }
  };

  const fetchLessons = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/lessons`);
      if (!response.ok) throw new Error("Failed to fetch lessons");
      const data = await response.json();
      
      const thisMonth = startOfMonth(new Date());
      const upcoming = data.filter((l: Lesson) => new Date(l.startDate) >= thisMonth);
      setLessons(upcoming);

      // Get unique instructors from lessons
      const instructorNames = new Set<string>();
      upcoming.forEach((l: Lesson) => {
        if (l.instructor?.user?.name) {
          instructorNames.add(l.instructor.user.name);
        }
      });
      
      const uniqueInstructors: Instructor[] = Array.from(instructorNames).map(name => ({
        id: name,
        name: name
      }));
      
      setInstructors(uniqueInstructors);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      toast.error("Failed to fetch lessons");
    }
  };

  useEffect(() => {
    fetchChildren();
    fetchAvailableChildren();
    fetchLessons();
  }, [parentId, organizationId]);

  // Filter lessons by instructor
  useEffect(() => {
    if (selectedInstructor) {
      const instructorLessons = lessons.filter(
        l => l.instructor.user.name === selectedInstructor
      );
      setFilteredLessons(instructorLessons);
      /*
      // Get unique days for this instructor
      const availableDays = [...new Set(
        instructorLessons.map(l => getDayName(l.dayOfWeek))
      )];
      setSelectedDay(availableDays[0] || ""); // Select first available day by default
*/
      } else {
      setFilteredLessons([]);
      setSelectedDay("");
    }
    setNewChild(prev => ({ ...prev, lessonId: "" }));
    setFilteredByDayLessons([]);
  }, [selectedInstructor, lessons]);

  // Filter by day of week
  useEffect(() => {
    if (selectedDay) {
      const dayLessons = filteredLessons.filter(
        l => getDayName(l.dayOfWeek) === selectedDay
      );
      setFilteredByDayLessons(dayLessons);
      
      // Select first lesson by default if available
      if (dayLessons.length > 0) {
        setNewChild(prev => ({ ...prev, lessonId: dayLessons[0].id }));
      }
    } else {
      setFilteredByDayLessons([]);
    }
  }, [selectedDay, filteredLessons]);

  const getDayName = (d: number) =>
    ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d];

  const formatTime = (t: string) => {
    if (/^(\d|1\d|2[0-3]):[0-5]\d$/.test(t)) {
      const [h, m] = t.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m);
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }
    const d = new Date(t);
    return isNaN(d.getTime())
      ? t
      : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChild.lessonId) {
      toast.error("Please select a lesson");
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch(`/api/parents/${parentId}/children`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newChild),
      });

      if (!response.ok) throw new Error("Failed to add child");

      toast.success("Child added successfully");
      setNewChild({ name: "", birthDate: "", lessonId: "" });
      setSelectedInstructor("");
      setSelectedDay("");
      setIsDialogOpen(false);
      fetchChildren();
      fetchAvailableChildren();
    } catch (error) {
      console.error("Error adding child:", error);
      toast.error("Failed to add child");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssociateChild = async () => {
    if (!selectedChildId) {
      toast.error("Please select a child");
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch(`/api/parents/${parentId}/children`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId: selectedChildId }),
      });

      if (!response.ok) throw new Error("Failed to associate child");

      toast.success("Child associated successfully");
      setSelectedChildId("");
      setIsDialogOpen(false);
      fetchChildren();
      fetchAvailableChildren();
    } catch (error) {
      console.error("Error associating child:", error);
      toast.error("Failed to associate child");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveChild = async () => {
    if (!childToRemove) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/parents/${parentId}/children`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId: childToRemove.id }),
      });

      if (!response.ok) throw new Error("Failed to remove child");

      toast.success("Child removed from parent successfully");
      setChildToRemove(null);
      setIsRemoveDialogOpen(false);
      fetchChildren();
      fetchAvailableChildren();
    } catch (error) {
      console.error("Error removing child:", error);
      toast.error("Failed to remove child from parent");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Children</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Child
            </Button>
          </DialogTrigger>
          <DialogContent 
            className="sm:max-w-[425px]"
            aria-describedby="add-child-description"
          >
            <DialogHeader>
              <DialogTitle>Add Child</DialogTitle>
              <DialogDescription id="add-child-description">
                Add a new child or associate an existing child with this parent.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger 
                  value="new"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 hover:text-blue-600 hover:border-b-2 hover:border-blue-200"
                >
                  New Child
                </TabsTrigger>
                <TabsTrigger 
                  value="existing"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 hover:text-blue-600 hover:border-b-2 hover:border-blue-200"
                >
                  Existing Child
                </TabsTrigger>
              </TabsList>
              <TabsContent value="new" className="mt-4">
                <form onSubmit={handleAddChild} className="space-y-6 pt-4">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      id="name"
                      value={newChild.name}
                      onChange={(e) =>
                        setNewChild((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="mt-1 block w-full border rounded p-2"
                      required
                    />
                  </div>

                  {/* Birth Date */}
                  <div>
                    <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
                      Birth Date
                    </label>
                    <DatePicker
                      selected={startDate}
                      onChange={(date) => {
                        if (date) {
                          setStartDate(date);
                          setNewChild(prev => ({ ...prev, birthDate: format(date, "MM/dd/yyyy") }));
                        }
                      }}
                      dateFormat="MM/dd/yyyy"
                      className="block w-full border rounded p-2"
                    />
                  </div>

                  {/* Instructor */}
                  <div>
                    <label htmlFor="instructor" className="block text-sm font-medium text-gray-700">
                      Instructor
                    </label>
                    <select
                      id="instructor"
                      value={selectedInstructor}
                      onChange={e => setSelectedInstructor(e.target.value)}
                      className="mt-1 block w-full border rounded p-2"
                    >
                      <option value="">Select an instructor</option>
                      {instructors && instructors.length > 0 ? (
                        instructors.map(i => (
                          <option key={i.id} value={i.name}>{i.name}</option>
                        ))
                      ) : (
                        <option value="" disabled>No instructors available</option>
                      )}
                    </select>
                  </div>

                  {/* Day of Week */}
                  {selectedInstructor && filteredLessons.length > 0 && (
                    <div>
                      <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700">
                        Day of the Week
                      </label>
                      <select
                        id="dayOfWeek"
                        value={selectedDay}
                        onChange={e => setSelectedDay(e.target.value)}
                        className="mt-1 block w-full border rounded p-2"
                      >
                        <option value="">Select a day</option>
                        {[...new Set(filteredLessons.map(l => getDayName(l.dayOfWeek)))].map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Lesson */}
                  {selectedDay && filteredByDayLessons.length > 0 && (
                    <div>
                      <label htmlFor="lessonId" className="block text-sm font-medium text-gray-700">
                        Lesson
                      </label>
                      <select
                        id="lessonId"
                        value={newChild.lessonId}
                        onChange={(e) => setNewChild(prev => ({ ...prev, lessonId: e.target.value }))}
                        className="mt-1 block w-full border rounded p-2"
                      >
                        <option value="">Select a lesson</option>
                        {filteredByDayLessons.map(l => (
                          <option key={l.id} value={l.id}>
                            {l.classLevel.name}, {format(new Date(l.startDate),'MMMM')}, {formatTime(l.startTime)} – {formatTime(l.endTime)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      onClick={() => setIsDialogOpen(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading || !newChild.lessonId}
                      className="px-4 py-2 bg-blue-600 text-white disabled:opacity-50"
                    >
                      {isLoading ? "Adding..." : "Add Child"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
              <TabsContent value="existing" className="mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Child</Label>
                    <Select
                      value={selectedChildId}
                      onValueChange={setSelectedChildId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a child" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableChildren.map((child) => (
                          <SelectItem key={child.id} value={child.id}>
                            {child.name} ({format(new Date(child.birthDate), "PPP")})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      onClick={() => setIsDialogOpen(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAssociateChild}
                      disabled={isLoading || !selectedChildId}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {isLoading ? "Associating..." : "Associate Child"}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {children.map((child) => (
          <div
            key={child.id}
            className="flex items-center justify-between p-4 border rounded-lg bg-white"
          >
            <div>
              <p className="font-medium">{child.name}</p>
              <p className="text-sm text-gray-500 hidden md:block">
                Birth Date: {format(new Date(child.birthDate), "PPP")}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setChildToRemove(child);
                setIsRemoveDialogOpen(true);
              }}
              className="text-indigo-300 hover:text-red-600"
            >
              <UserMinusIcon className="h-5 w-5" />
              <span className="sr-only">Remove from parent</span>
            </Button>
          </div>
        ))}
        {children.length === 0 && (
          <p className="text-gray-500 text-center py-4">No children added yet</p>
        )}
      </div>

      {/* Remove Child Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent 
          className="sm:max-w-[425px]"
          aria-describedby="remove-child-description"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-red-600">
              Remove Child from Parent
            </DialogTitle>
            <DialogDescription id="remove-child-description">
              This will remove {childToRemove?.name} from this parent's account. The child will still exist in the system and can be associated with other parents.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              onClick={() => {
                setChildToRemove(null);
                setIsRemoveDialogOpen(false);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRemoveChild}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              {isLoading ? 'Removing...' : 'Remove from Parent'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 