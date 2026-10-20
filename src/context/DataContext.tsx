'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Department,
  Member,
  Meeting,
  MOM,
  AttendanceRecord,
  AttendanceCorrectionRequest,
  Task,
  SocietyEvent,
  Announcement,
  InAppNotification,
  SocietySettings,
  HRLeaderboardEntry,
} from '@/types';
import { computeHRLeaderboard } from '@/lib/calculations';
import { useAuth } from './AuthContext';

interface DataContextType {
  departments: Department[];
  members: Member[];
  meetings: Meeting[];
  moms: MOM[];
  attendance: AttendanceRecord[];
  correctionRequests: AttendanceCorrectionRequest[];
  tasks: Task[];
  events: SocietyEvent[];
  announcements: Announcement[];
  notifications: InAppNotification[];
  settings: SocietySettings | null;
  hrLeaderboard: HRLeaderboardEntry[];
  isLoading: boolean;
  refreshAll: () => Promise<void>;

  // Mutators
  addMeeting: (meetingData: any) => Promise<{ success: boolean; data?: Meeting; error?: string }>;
  updateMeeting: (meetingData: any) => Promise<{ success: boolean; data?: Meeting; error?: string }>;
  addMOM: (momData: any) => Promise<{ success: boolean; data?: MOM; error?: string }>;
  updateMOM: (momData: any) => Promise<{ success: boolean; data?: MOM; error?: string }>;
  recordAttendance: (payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  submitAttendanceCorrection: (payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  reviewAttendanceCorrection: (id: string, action: 'Approved' | 'Rejected', reviewerId: string) => Promise<boolean>;
  addTask: (taskData: any) => Promise<{ success: boolean; data?: Task; error?: string }>;
  updateTask: (taskData: any) => Promise<{ success: boolean; data?: Task; error?: string }>;
  addEvent: (eventData: any) => Promise<{ success: boolean; data?: SocietyEvent; error?: string }>;
  updateEvent: (eventData: any) => Promise<{ success: boolean; data?: SocietyEvent; error?: string }>;
  addAnnouncement: (announcementData: any) => Promise<{ success: boolean; data?: Announcement; error?: string }>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: (memberId: string) => Promise<void>;
  updateSettings: (newSettings: Partial<SocietySettings>) => Promise<boolean>;
  addDepartment: (deptData: any) => Promise<{ success: boolean; data?: Department; error?: string }>;
  updateDepartment: (deptData: any) => Promise<{ success: boolean; data?: Department; error?: string }>;
  addMember: (memberData: any) => Promise<{ success: boolean; data?: Member; error?: string }>;
  updateMember: (memberData: any) => Promise<{ success: boolean; data?: Member; error?: string }>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { refreshData: refreshAuthData } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [moms, setMoms] = useState<MOM[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [correctionRequests, setCorrectionRequests] = useState<AttendanceCorrectionRequest[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<SocietyEvent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [settings, setSettings] = useState<SocietySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments || []);
        setMembers(data.members || []);
        setMeetings(data.meetings || []);
        setMoms(data.moms || []);
        setAttendance(data.attendance || []);
        setCorrectionRequests(data.correctionRequests || []);
        setTasks(data.tasks || []);
        setEvents(data.events || []);
        setAnnouncements(data.announcements || []);
        setNotifications(data.notifications || []);
        setSettings(data.settings || null);
      }
    } catch (err) {
      console.error('Failed to load portal data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute live HR Leaderboard whenever tasks, moms, attendance or weights update
  const hrLeaderboard = React.useMemo(() => {
    if (!settings) return [];
    return computeHRLeaderboard(
      members,
      departments,
      tasks,
      moms,
      attendance,
      meetings,
      settings
    );
  }, [members, departments, tasks, moms, attendance, meetings, settings]);

  const addMeeting = async (meetingData: any) => {
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || data.error };
      await fetchData();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateMeeting = async (meetingData: any) => {
    try {
      const res = await fetch('/api/meetings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || data.error };
      await fetchData();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const addMOM = async (momData: any) => {
    try {
      const res = await fetch('/api/moms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(momData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || data.error };
      await fetchData();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateMOM = async (momData: any) => {
    try {
      const res = await fetch('/api/moms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(momData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || data.error };
      await fetchData();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const recordAttendance = async (payload: any) => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || data.error };
      await fetchData();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const submitAttendanceCorrection = async (payload: any) => {
    try {
      const res = await fetch('/api/attendance/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || data.error };
      await fetchData();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const reviewAttendanceCorrection = async (
    id: string,
    action: 'Approved' | 'Rejected',
    reviewerId: string
  ) => {
    try {
      const res = await fetch('/api/attendance/corrections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, reviewedById: reviewerId }),
      });
      if (res.ok) {
        await fetchData();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const addTask = async (taskData: any) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || data.error };
      await fetchData();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateTask = async (taskData: any) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || data.error };
      await fetchData();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const addEvent = async (eventData: any) => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || data.error };
      await fetchData();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateEvent = async (eventData: any) => {
    try {
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || data.error };
      await fetchData();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const addAnnouncement = async (announcementData: any) => {
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || data.error };
      await fetchData();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async (memberId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true, memberId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.recipientMemberId === memberId ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const updateSettings = async (newSettings: Partial<SocietySettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const addDepartment = async (deptData: any) => {
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deptData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || data.error };
      await fetchData();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateDepartment = async (deptData: any) => {
    try {
      const res = await fetch('/api/departments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deptData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || data.error };
      await fetchData();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const addMember = async (memberData: any) => {
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || data.error };
      await fetchData();
      await refreshAuthData();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateMember = async (memberData: any) => {
    try {
      const res = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || data.error };
      await fetchData();
      await refreshAuthData();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return (
    <DataContext.Provider
      value={{
        departments,
        members,
        meetings,
        moms,
        attendance,
        correctionRequests,
        tasks,
        events,
        announcements,
        notifications,
        settings,
        hrLeaderboard,
        isLoading,
        refreshAll: fetchData,
        addMeeting,
        updateMeeting,
        addMOM,
        updateMOM,
        recordAttendance,
        submitAttendanceCorrection,
        reviewAttendanceCorrection,
        addTask,
        updateTask,
        addEvent,
        updateEvent,
        addAnnouncement,
        markNotificationRead,
        markAllNotificationsRead,
        updateSettings,
        addDepartment,
        updateDepartment,
        addMember,
        updateMember,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
