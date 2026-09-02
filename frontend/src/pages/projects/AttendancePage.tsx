import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Save,
  TrendingUp,
} from "lucide-react";
import { workforceService, BulkAttendancePayload } from "../../services/workforceService.js";
import { AttendanceStatus } from "../../types/workforce.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import Card from "../../components/ui/Card.js";
import Button from "../../components/ui/Button.js";
import LoadingState from "../../components/ui/LoadingState.js";
import EmptyState from "../../components/ui/EmptyState.js";
import ErrorState from "../../components/ui/ErrorState.js";

interface AttendanceRow {
  workerId: string;
  workerName: string;
  trade: string;
  status: AttendanceStatus;
  checkIn: string;
  checkOut: string;
  workingHours: number;
  overtimeHours: number;
  notes: string;
}

export const AttendancePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRecord =
    user?.primaryRole === "ADMIN" ||
    user?.primaryRole === "PROJECT_MANAGER" ||
    user?.primaryRole === "SITE_ENGINEER";

  const fetchAttendanceSheet = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);

      const [workforceRes, attendanceRes] = await Promise.all([
        workforceService.getProjectWorkforce(projectId, { status: "ACTIVE" }),
        workforceService.getProjectAttendance(projectId, { date: selectedDate }),
      ]);

      if (workforceRes.success && workforceRes.data) {
        const assignments = workforceRes.data;
        const records = attendanceRes.success && attendanceRes.data ? attendanceRes.data : [];

        // Map assigned workers into editable attendance rows
        const mappedRows: AttendanceRow[] = assignments.map((a) => {
          const w = typeof a.workerId === "object" ? a.workerId : null;
          const wId = w?._id || (a.workerId as string);
          const wName = w?.name || "Worker";
          const wTrade = w?.trade ? w.trade.replace(/_/g, " ") : "Labor";

          const rec = records.find((r) => {
            const recWorkerId = typeof r.workerId === "object" ? r.workerId._id : r.workerId;
            return recWorkerId === wId;
          });

          if (rec) {
            return {
              workerId: wId,
              workerName: wName,
              trade: wTrade,
              status: rec.status,
              checkIn: rec.checkIn ? new Date(rec.checkIn).toISOString().substring(11, 16) : "08:00",
              checkOut: rec.checkOut ? new Date(rec.checkOut).toISOString().substring(11, 16) : "17:00",
              workingHours: rec.workingHours,
              overtimeHours: rec.overtimeHours,
              notes: rec.notes || "",
            };
          }

          // Default preset for unrecorded workers
          return {
            workerId: wId,
            workerName: wName,
            trade: wTrade,
            status: "PRESENT",
            checkIn: "08:00",
            checkOut: "17:00",
            workingHours: 8,
            overtimeHours: 0,
            notes: "",
          };
        });

        setRows(mappedRows);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load daily attendance sheet");
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedDate]);

  useEffect(() => {
    fetchAttendanceSheet();
  }, [fetchAttendanceSheet]);

  const handleStatusChange = (index: number, status: AttendanceStatus) => {
    const updated = [...rows];
    let workingHours = 8;
    let overtimeHours = 0;

    if (status === "HALF_DAY") {
      workingHours = 4;
      overtimeHours = 0;
    } else if (status === "OVERTIME") {
      workingHours = 8;
      overtimeHours = 2;
    } else if (status === "ABSENT" || status === "ON_LEAVE") {
      workingHours = 0;
      overtimeHours = 0;
    }

    updated[index] = {
      ...updated[index],
      status,
      workingHours,
      overtimeHours,
    };
    setRows(updated);
  };

  const handleTimeChange = (index: number, field: "checkIn" | "checkOut", value: string) => {
    const updated = [...rows];
    const row = { ...updated[index], [field]: value };

    if (row.checkIn && row.checkOut && (row.status === "PRESENT" || row.status === "OVERTIME")) {
      const [inH, inM] = row.checkIn.split(":").map(Number);
      const [outH, outM] = row.checkOut.split(":").map(Number);
      const inMinutes = inH * 60 + inM;
      const outMinutes = outH * 60 + outM;

      if (outMinutes > inMinutes) {
        const totalDuration = (outMinutes - inMinutes) / 60;
        row.workingHours = Math.round(Math.min(totalDuration, 8) * 100) / 100;
        row.overtimeHours = Math.round(Math.max(0, totalDuration - 8) * 100) / 100;
        if (row.overtimeHours > 0) {
          row.status = "OVERTIME";
        }
      }
    }

    updated[index] = row;
    setRows(updated);
  };

  const handleNotesChange = (index: number, value: string) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], notes: value };
    setRows(updated);
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || rows.length === 0) return;

    try {
      setSaving(true);
      const payload: BulkAttendancePayload = {
        date: selectedDate,
        records: rows.map((r) => {
          let checkInDate: string | undefined;
          let checkOutDate: string | undefined;

          if (r.status !== "ABSENT" && r.status !== "ON_LEAVE" && r.checkIn && r.checkOut) {
            checkInDate = `${selectedDate}T${r.checkIn}:00.000Z`;
            checkOutDate = `${selectedDate}T${r.checkOut}:00.000Z`;
          }

          return {
            workerId: r.workerId,
            status: r.status,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            workingHours: r.workingHours,
            overtimeHours: r.overtimeHours,
            notes: r.notes.trim() || undefined,
          };
        }),
      };

      const res = await workforceService.bulkRecordAttendance(projectId, payload);
      if (res.success) {
        showSuccess(
          "Attendance Recorded",
          `Successfully saved daily attendance for ${selectedDate} (${res.data.inserted + res.data.updated} records).`
        );
        fetchAttendanceSheet();
      }
    } catch (err: unknown) {
      showError("Submission Failed", err instanceof Error ? err.message : "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const totalWorkers = rows.length;
  const presentCount = rows.filter((r) => r.status === "PRESENT" || r.status === "OVERTIME").length;
  const totalWorkingHours = rows.reduce((sum, r) => sum + (r.workingHours || 0), 0);
  const totalOvertimeHours = rows.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1 font-sans">
            <Link
              to={`/projects/${projectId}/workforce`}
              className="hover:underline text-brand-600 dark:text-brand-400 font-medium inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Project Workforce
            </Link>
            <span>/</span>
            <span>Daily Attendance</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">
            Daily Site Attendance & Time Tracking
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Record daily labor check-in/out, automated working-hour computation, and overtime logs.
          </p>
        </div>

        {canRecord && rows.length > 0 && (
          <Button
            id="save-attendance-btn"
            variant="primary"
            leftIcon={<Save className="w-4 h-4" />}
            isLoading={saving}
            onClick={handleSaveAttendance}
          >
            Save Daily Attendance
          </Button>
        )}
      </div>

      {/* Date Picker and Rollup Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-display">
            Select Attendance Date
          </span>
          <div className="mt-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <input
              id="attendance-date-input"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </Card>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-card">
          <div className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-wider font-display font-bold">
            <span>On-Site Present</span>
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-2 font-display tabular-nums font-mono">
            {presentCount} / {totalWorkers}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-card">
          <div className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-wider font-display font-bold">
            <span>Regular Hours</span>
            <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="text-2xl font-extrabold text-brand-600 dark:text-brand-400 mt-2 font-display tabular-nums font-mono">
            {totalWorkingHours.toFixed(1)} hrs
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-card">
          <div className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-wider font-display font-bold">
            <span>Overtime Logged</span>
            <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2 font-display tabular-nums font-mono">
            {totalOvertimeHours.toFixed(1)} hrs
          </div>
        </div>
      </div>

      {/* Attendance Grid */}
      {loading ? (
        <LoadingState message="Loading daily attendance grid..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchAttendanceSheet} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No Active Workers Assigned to this Project"
          description="Assign trade workers from the project workforce roster before logging daily attendance."
          action={
            <Link to={`/projects/${projectId}/workforce`}>
              <Button variant="primary">Assign Workers Now</Button>
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden border border-zinc-200/90 dark:border-zinc-800 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
              <thead className="bg-zinc-50/80 dark:bg-zinc-850/80 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80 dark:border-zinc-800 font-display">
                <tr>
                  <th className="py-3.5 px-4">Worker & Trade</th>
                  <th className="py-3.5 px-4">Attendance Status</th>
                  <th className="py-3.5 px-4">Check-In</th>
                  <th className="py-3.5 px-4">Check-Out</th>
                  <th className="py-3.5 px-4 text-right">Work Hours</th>
                  <th className="py-3.5 px-4 text-right">Overtime</th>
                  <th className="py-3.5 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900 font-mono text-xs">
                {rows.map((row, idx) => (
                  <tr key={row.workerId} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">
                        {row.workerName}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        {row.trade}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex items-center gap-1">
                        {(["PRESENT", "HALF_DAY", "OVERTIME", "ABSENT", "ON_LEAVE"] as AttendanceStatus[]).map(
                          (st) => {
                            const isSelected = row.status === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleStatusChange(idx, st)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                  isSelected
                                    ? st === "PRESENT"
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : st === "OVERTIME"
                                      ? "bg-amber-600 text-white shadow-xs"
                                      : st === "HALF_DAY"
                                      ? "bg-sky-600 text-white shadow-xs"
                                      : "bg-red-600 text-white shadow-xs"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                }`}
                              >
                                {st === "HALF_DAY" ? "Half" : st === "ON_LEAVE" ? "Leave" : st.toLowerCase()}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <input
                        type="time"
                        value={row.checkIn}
                        disabled={row.status === "ABSENT" || row.status === "ON_LEAVE"}
                        onChange={(e) => handleTimeChange(idx, "checkIn", e.target.value)}
                        className="px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-mono text-zinc-800 dark:text-zinc-200 disabled:opacity-40"
                      />
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <input
                        type="time"
                        value={row.checkOut}
                        disabled={row.status === "ABSENT" || row.status === "ON_LEAVE"}
                        onChange={(e) => handleTimeChange(idx, "checkOut", e.target.value)}
                        className="px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-mono text-zinc-800 dark:text-zinc-200 disabled:opacity-40"
                      />
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100">
                      {row.workingHours} hrs
                    </td>

                    <td
                      className={`py-3.5 px-4 text-right font-bold ${
                        row.overtimeHours > 0 ? "text-amber-600 dark:text-amber-400" : "text-zinc-400"
                      }`}
                    >
                      {row.overtimeHours > 0 ? `+${row.overtimeHours} hrs` : "0 hrs"}
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      <input
                        type="text"
                        placeholder="Task note..."
                        value={row.notes}
                        onChange={(e) => handleNotesChange(idx, e.target.value)}
                        className="w-32 sm:w-48 px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AttendancePage;
