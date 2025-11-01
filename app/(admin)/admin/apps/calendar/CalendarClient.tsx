"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { SafeUser } from "@/app/types";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon
} from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  "en-US": require("date-fns/locale/en-US")
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
});

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  is_all_day: boolean;
  location?: string;
  color?: string;
}

interface CalendarClientProps {
  currentUser: SafeUser | null;
}

export default function CalendarClient({ currentUser }: CalendarClientProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [isCreating, setIsCreating] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    is_all_day: false,
    location: "",
    color: "#5D87FF"
  });

  useEffect(() => {
    fetchEvents();
  }, [date, view]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get("/api/calendar/events");
      const formattedEvents = response.data.map((event: any) => ({
        ...event,
        start: new Date(event.start_time),
        end: new Date(event.end_time)
      }));
      setEvents(formattedEvents);
    } catch (error: any) {
      toast.error("Failed to load events");
    }
  };

  const createEvent = async () => {
    if (!formData.title || !formData.start_time || !formData.end_time) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await axios.post("/api/calendar/events", formData);
      toast.success("Event created successfully");
      setIsCreating(false);
      setFormData({
        title: "",
        description: "",
        start_time: "",
        end_time: "",
        is_all_day: false,
        location: "",
        color: "#5D87FF"
      });
      fetchEvents();
    } catch (error: any) {
      toast.error("Failed to create event");
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      await axios.delete(`/api/calendar/events/${eventId}`);
      toast.success("Event deleted successfully");
      setSelectedEvent(null);
      fetchEvents();
    } catch (error: any) {
      toast.error("Failed to delete event");
    }
  };

  const handleSelectSlot = useCallback((slotInfo: any) => {
    setFormData({
      ...formData,
      start_time: slotInfo.start.toISOString(),
      end_time: slotInfo.end.toISOString()
    });
    setIsCreating(true);
  }, [formData]);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  const eventStyleGetter = (event: CalendarEvent) => {
    const style = {
      backgroundColor: event.color || "#5D87FF",
      borderRadius: "5px",
      opacity: 0.8,
      color: "white",
      border: "0px",
      display: "block"
    };
    return { style };
  };

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Calendar View */}
      <div className="flex-1 p-6">
        <div className="bg-white rounded-lg border h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button onClick={() => setDate(new Date())}>Today</Button>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newDate = new Date(date);
                    if (view === "month") {
                      newDate.setMonth(newDate.getMonth() - 1);
                    } else if (view === "week") {
                      newDate.setDate(newDate.getDate() - 7);
                    } else {
                      newDate.setDate(newDate.getDate() - 1);
                    }
                    setDate(newDate);
                  }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newDate = new Date(date);
                    if (view === "month") {
                      newDate.setMonth(newDate.getMonth() + 1);
                    } else if (view === "week") {
                      newDate.setDate(newDate.getDate() + 7);
                    } else {
                      newDate.setDate(newDate.getDate() + 1);
                    }
                    setDate(newDate);
                  }}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
              <h2 className="text-xl font-semibold">
                {format(date, "MMMM yyyy")}
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={view === "month" ? "default" : "outline"}
                onClick={() => setView("month")}
              >
                Month
              </Button>
              <Button
                variant={view === "week" ? "default" : "outline"}
                onClick={() => setView("week")}
              >
                Week
              </Button>
              <Button
                variant={view === "day" ? "default" : "outline"}
                onClick={() => setView("day")}
              >
                Day
              </Button>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-5 w-5 mr-2" />
                New Event
              </Button>
            </div>
          </div>

          {/* Calendar */}
          <div className="flex-1 p-4">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              eventPropGetter={eventStyleGetter}
            />
          </div>
        </div>
      </div>

      {/* Event Creation/Detail Sidebar */}
      {(isCreating || selectedEvent) && (
        <div className="w-96 border-l bg-white p-6 overflow-y-auto">
          {isCreating ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">New Event</h3>
                <Button variant="ghost" onClick={() => setIsCreating(false)}>
                  ✕
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Event title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    className="w-full p-2 border rounded-lg"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Event description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Start Time *</label>
                  <Input
                    type="datetime-local"
                    value={formData.start_time ? format(new Date(formData.start_time), "yyyy-MM-dd'T'HH:mm") : ""}
                    onChange={(e) => setFormData({ ...formData, start_time: new Date(e.target.value).toISOString() })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time *</label>
                  <Input
                    type="datetime-local"
                    value={formData.end_time ? format(new Date(formData.end_time), "yyyy-MM-dd'T'HH:mm") : ""}
                    onChange={(e) => setFormData({ ...formData, end_time: new Date(e.target.value).toISOString() })}
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_all_day}
                      onChange={(e) => setFormData({ ...formData, is_all_day: e.target.checked })}
                    />
                    <span className="text-sm font-medium">All day event</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Event location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button className="flex-1" onClick={createEvent}>
                    Create Event
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          ) : selectedEvent && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Event Details</h3>
                <Button variant="ghost" onClick={() => setSelectedEvent(null)}>
                  ✕
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg">{selectedEvent.title}</h4>
                </div>
                {selectedEvent.description && (
                  <div>
                    <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">Start</p>
                  <p className="text-sm text-gray-600">
                    {format(selectedEvent.start, "PPpp")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">End</p>
                  <p className="text-sm text-gray-600">
                    {format(selectedEvent.end, "PPpp")}
                  </p>
                </div>
                {selectedEvent.location && (
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-gray-600">{selectedEvent.location}</p>
                  </div>
                )}
                <div className="flex space-x-2">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => deleteEvent(selectedEvent.id)}
                  >
                    Delete Event
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

