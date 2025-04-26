"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";
import { Check, Clock } from "lucide-react";

const formSchema = z.object({
  classLevelId: z.string().min(1, { message: "Class level is required" }),
  instructorId: z.string().min(1, { message: "Instructor is required" }),
  month: z.number().min(1).max(12),
  year: z.number().min(2024).max(2100),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Start time must be in HH:mm format"
  }),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "End time must be in HH:mm format"
  })
});

type FormValues = z.infer<typeof formSchema>;

interface LessonFormProps {
  organizationId: string;
  classLevels: Array<{ id: string; name: string }>;
  instructors: Array<{ id: string; user: { name: string } }>;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: FormValues & {
    id?: string;
    startDate?: string;
    endDate?: string;
  };
}

type FieldType<K extends keyof FormValues> = ControllerRenderProps<FormValues, K>;

export function LessonForm({
  organizationId,
  classLevels,
  instructors,
  onSuccess,
  onCancel,
  initialData
}: LessonFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const formatTimeDisplay = (timeString: string) => {
    if (!timeString) return 'Select time';
    
    try {
      // Handle HH:mm format
      if (timeString.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return format(date, 'h:mm a');
      }
      return 'Select time';
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Select time';
    }
  };

  const parseTimeInput = (input: string): string | null => {
    // Handle HH:mm format
    if (input.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      return input;
    }
    
    // Handle H:mm format
    if (input.match(/^([0-9]):[0-5][0-9]$/)) {
      return `0${input}`;
    }
    
    // Handle military time without colon
    if (input.match(/^([0-1][0-9]|2[0-3])([0-5][0-9])$/)) {
      return `${input.slice(0, 2)}:${input.slice(2)}`;
    }
    
    // Handle single digit hour with optional minutes
    if (input.match(/^[0-9]$/)) {
      return `0${input}:00`;
    }
    
    // Handle double digit hour with optional minutes
    if (input.match(/^([0-1][0-9]|2[0-3])$/)) {
      return `${input}:00`;
    }
    
    return null;
  };

  const formatTimeForForm = (timeString: string) => {
    if (!timeString) return '';
    
    try {
      // If already in HH:mm format, return as is
      if (timeString.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
        return timeString;
      }
      
      // Convert ISO string to HH:mm
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return format(date, 'HH:mm');
      }
      
      return '';
    } catch (error) {
      console.error('Error formatting time for form:', error);
      return '';
    }
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const time = new Date();
        time.setHours(hour, minute, 0, 0);
        const timeString = format(time, 'HH:mm');
        const displayTime = format(time, 'h:mm a');
        options.push({ value: timeString, label: displayTime });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classLevelId: initialData?.classLevelId || "",
      instructorId: initialData?.instructorId || "",
      month: initialData?.month || new Date().getMonth() + 1,
      year: initialData?.year || new Date().getFullYear(),
      dayOfWeek: initialData?.dayOfWeek || 0,
      startTime: initialData?.startTime ? formatTimeForForm(initialData.startTime) : "",
      endTime: initialData?.endTime ? formatTimeForForm(initialData.endTime) : ""
        },
  });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const days = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday"
  ];

  async function onSubmit(values: FormValues) {
    try {
      setLoading(true);
      
      // Ensure times are in correct format
      const startTime = parseTimeInput(values.startTime);
      const endTime = parseTimeInput(values.endTime);
      
      if (!startTime || !endTime) {
        throw new Error("Invalid time format. Please use HH:mm format.");
      }

      const formattedValues = {
        ...values,
        startTime,
        endTime
      };

      const response = await fetch(initialData?.id 
        ? `/api/organizations/${organizationId}/lessons/${initialData.id}` 
        : `/api/organizations/${organizationId}/lessons`, {
        method: initialData?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedValues),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save lesson");
      }

      toast({
        title: "Success",
        description: `Lesson ${initialData?.id ? "updated" : "created"} successfully`,
      });

      router.refresh();
      onSuccess();
    } catch (error) {
      console.error("Error saving lesson:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save lesson",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="classLevelId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class Level</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
              {classLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                  {level.name}
                    </SelectItem>
              ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
            )}
        />

        <FormField
          control={form.control}
          name="instructorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructor</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an instructor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
              {instructors.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                  {instructor.user.name}
                    </SelectItem>
              ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
            )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="month"
            render={({ field }: { field: FieldType<"month"> }) => (
              <FormItem>
                <FormLabel>Month</FormLabel>
                <Select
                  onValueChange={(value: string) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString() ?? ""}
                  disabled={loading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
              ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="year"
            render={({ field }: { field: FieldType<"year"> }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <FormControl>
                  <Input type="number" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
              )}
          />
        </div>

        <FormField
          control={form.control}
          name="dayOfWeek"
          render={({ field }: { field: FieldType<"dayOfWeek"> }) => (
            <FormItem>
              <FormLabel>Day of Week</FormLabel>
              <Select
                onValueChange={(value: string) => field.onChange(parseInt(value))}
                defaultValue={field.value?.toString() ?? ""}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {days.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter time (e.g., 3:30 PM)"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter time (e.g., 3:30 PM)"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button
              type="button"
            variant="outline"
              onClick={onCancel}
            disabled={loading}
            >
              Cancel
          </Button>
          <Button 
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Saving..." : (initialData?.id ? "Save Changes" : "Create Lesson")}
          </Button>
        </div>
      </form>
    </Form>
  );
} 