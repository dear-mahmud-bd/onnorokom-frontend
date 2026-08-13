"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import {
  createTeacherAssignment,
  deleteTeacherAssignment,
  listTeacherAssignments,
} from "@/lib/api/teacherAssignments";
import { listSubjects } from "@/lib/api/subjects";
import { listClasses } from "@/lib/api/classes";
import { listUsers } from "@/lib/api/users";
import { sessionTokenProvider } from "@/lib/api/token";
import { isApiError } from "@/lib/api/client";
import {
  teacherAssignmentSchema,
  type TeacherAssignmentInput,
} from "@/lib/validation";
import {
  UserRole,
  type ClassResponse,
  type SubjectResponse,
  type TeacherSubjectClassAssignmentResponse,
  type UserSummaryResponse,
} from "@/types";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { AdminField } from "@/components/admin/AdminField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ServerErrorBanner } from "@/components/auth/ServerErrorBanner";

const EMPTY: TeacherAssignmentInput = {
  teacherId: "",
  subjectId: "",
  classId: "",
};

// Shown in place of a dropdown when a cascading step has nothing selectable
// (e.g. the teacher is already assigned to every class), keeping the labelled
// layout consistent with AdminField.
function FieldNotice({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
        {children}
      </p>
    </div>
  );
}

export default function AdminTeacherAssignmentsPage() {
  const [rows, setRows] = useState<TeacherSubjectClassAssignmentResponse[]>([]);
  const [teachers, setTeachers] = useState<UserSummaryResponse[]>([]);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [serverError, setServerError] = useState<unknown>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<TeacherSubjectClassAssignmentResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const form = useForm<TeacherAssignmentInput>({
    resolver: zodResolver(teacherAssignmentSchema),
    defaultValues: EMPTY,
  });

  const refresh = useCallback(async () => {
    setRows(await listTeacherAssignments(undefined, sessionTokenProvider));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [assignments, teacherList, subjectList, classList] =
          await Promise.all([
            listTeacherAssignments(undefined, sessionTokenProvider),
            listUsers(sessionTokenProvider, UserRole.Teacher),
            listSubjects(sessionTokenProvider),
            listClasses(sessionTokenProvider),
          ]);
        if (active) {
          setRows(assignments);
          setTeachers(teacherList);
          setSubjects(subjectList);
          setClasses(classList);
        }
      } catch (error) {
        if (active) {
          setLoadError(error);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const teacherById = useMemo(
    () => new Map(teachers.map((t) => [t.id, t])),
    [teachers],
  );
  const subjectById = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects],
  );
  const classById = useMemo(
    () => new Map(classes.map((c) => [c.id, c])),
    [classes],
  );

  const teacherLabel = useCallback(
    (teacher: UserSummaryResponse) => `${teacher.fullName} — ${teacher.email}`,
    [],
  );
  const classLabel = useCallback(
    (klass: ClassResponse) => `${klass.name} — ${klass.gradeLevel}`,
    [],
  );
  const subjectLabel = useCallback(
    (subject: SubjectResponse) => `${subject.name} (${subject.code})`,
    [],
  );

  const teacherOptions = useMemo(
    () => teachers.map((t) => ({ label: teacherLabel(t), value: t.id })),
    [teachers, teacherLabel],
  );

  // Cascading Teacher -> Class -> Subject. "Applicable" is derived from the
  // (teacher, subject, class) uniqueness rule so the UI can only build a
  // non-duplicate assignment:
  //   * a class is applicable to a teacher while it still has at least one
  //     subject the teacher isn't assigned to there;
  //   * a subject is applicable for a teacher+class while that exact triple
  //     doesn't already exist.
  const selectedTeacherId = useWatch({ control: form.control, name: "teacherId" });
  const selectedClassId = useWatch({ control: form.control, name: "classId" });
  const selectedSubjectId = useWatch({ control: form.control, name: "subjectId" });

  // teacher -> class -> set of subjectIds already assigned there.
  const assignedSubjectsByClass = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (!selectedTeacherId) {
      return map;
    }
    for (const r of rows) {
      if (r.teacherId !== selectedTeacherId) {
        continue;
      }
      const set = map.get(r.classId) ?? new Set<string>();
      set.add(r.subjectId);
      map.set(r.classId, set);
    }
    return map;
  }, [rows, selectedTeacherId]);

  const applicableClasses = useMemo(() => {
    if (!selectedTeacherId || subjects.length === 0) {
      return [];
    }
    return classes.filter(
      (c) => (assignedSubjectsByClass.get(c.id)?.size ?? 0) < subjects.length,
    );
  }, [classes, subjects.length, assignedSubjectsByClass, selectedTeacherId]);

  const applicableSubjects = useMemo(() => {
    if (!selectedTeacherId || !selectedClassId) {
      return [];
    }
    const taken = assignedSubjectsByClass.get(selectedClassId) ?? new Set();
    return subjects.filter((s) => !taken.has(s.id));
  }, [subjects, assignedSubjectsByClass, selectedTeacherId, selectedClassId]);

  const classOptions = useMemo(
    () => applicableClasses.map((c) => ({ label: classLabel(c), value: c.id })),
    [applicableClasses, classLabel],
  );
  const subjectOptions = useMemo(
    () => applicableSubjects.map((s) => ({ label: subjectLabel(s), value: s.id })),
    [applicableSubjects, subjectLabel],
  );

  // Drop selections that fall out of scope so the form never submits a value
  // that isn't offered: reset class+subject when the teacher no longer makes
  // the class applicable, and reset the subject when it's no longer applicable
  // for the current class (covers both user changes and post-refresh churn).
  const applicableClassIds = useMemo(
    () => new Set(applicableClasses.map((c) => c.id)),
    [applicableClasses],
  );
  const applicableSubjectIds = useMemo(
    () => new Set(applicableSubjects.map((s) => s.id)),
    [applicableSubjects],
  );
  useEffect(() => {
    if (selectedClassId && !applicableClassIds.has(selectedClassId)) {
      form.setValue("classId", "", { shouldValidate: false });
      form.setValue("subjectId", "", { shouldValidate: false });
    }
  }, [selectedClassId, applicableClassIds, form]);
  useEffect(() => {
    if (selectedSubjectId && !applicableSubjectIds.has(selectedSubjectId)) {
      form.setValue("subjectId", "", { shouldValidate: false });
    }
  }, [selectedSubjectId, applicableSubjectIds, form]);

  const canSubmit = Boolean(
    selectedTeacherId && selectedClassId && selectedSubjectId,
  );

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    setActionError(null);
    try {
      await createTeacherAssignment(values, sessionTokenProvider);
      form.reset(EMPTY);
      await refresh();
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        switch (error.problem.errorCode) {
          case "TeacherNotFound":
            form.setError("teacherId", {
              message: "No teacher found for this id.",
            });
            return;
          case "SubjectNotFound":
            form.setError("subjectId", { message: "Subject not found." });
            return;
          case "ClassNotFound":
            form.setError("classId", { message: "Class not found." });
            return;
          default:
            break;
        }
      }
      if (
        isApiError(error) &&
        error.status === 409 &&
        error.problem.errorCode === "Duplicate"
      ) {
        setActionError(
          "This teacher is already assigned to that subject and class.",
        );
        return;
      }
      setServerError(error);
    }
  });

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setActionError(null);
    try {
      await deleteTeacherAssignment(deleteTarget.id, sessionTokenProvider);
      setDeleteTarget(null);
      await refresh();
    } catch (error) {
      setDeleteTarget(null);
      if (isApiError(error) && error.status === 404) {
        setActionError("This assignment no longer exists.");
        return;
      }
      setActionError("Could not delete the assignment. Please try again.");
    }
  };

  const columns: DataTableColumn<TeacherSubjectClassAssignmentResponse>[] = [
    {
      header: "Teacher",
      render: (row) => {
        const teacher = teacherById.get(row.teacherId);
        return teacher ? (
          teacherLabel(teacher)
        ) : (
          <span className="font-mono text-xs text-muted">{row.teacherId}</span>
        );
      },
    },
    {
      header: "Class",
      render: (row) => {
        const klass = classById.get(row.classId);
        return klass ? classLabel(klass) : row.classId;
      },
    },
    {
      header: "Subject",
      render: (row) => {
        const subject = subjectById.get(row.subjectId);
        return subject ? subjectLabel(subject) : row.subjectId;
      },
    },
    {
      header: "",
      className: "text-right",
      render: (row) => (
        <button
          type="button"
          onClick={() => setDeleteTarget(row)}
          className="rounded-full px-3 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Teacher assignments"
        description="Pick a teacher, then a class, then a subject. Only classes and subjects still available for that teacher are offered."
      />

      <ServerErrorBanner error={loadError} />

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <ServerErrorBanner error={serverError} />
        <FormProvider {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            {/* Step 1 — Teacher */}
            <AdminField
              name="teacherId"
              label="Teacher"
              variant="select"
              placeholder="Select a teacher"
              options={teacherOptions}
            />

            {/* Step 2 — Class (applicable to the chosen teacher) */}
            {!selectedTeacherId ? (
              <AdminField
                name="classId"
                label="Class"
                variant="select"
                placeholder="Select a teacher first"
                options={[]}
                disabled
              />
            ) : classOptions.length === 0 ? (
              <FieldNotice label="Class">
                {subjects.length === 0
                  ? "No subjects exist yet — create a subject before assigning classes."
                  : classes.length === 0
                    ? "No classes exist yet — create a class first."
                    : "This teacher is already assigned to every subject in every class."}
              </FieldNotice>
            ) : (
              <AdminField
                name="classId"
                label="Class"
                variant="select"
                placeholder="Select a class"
                options={classOptions}
              />
            )}

            {/* Step 3 — Subject (still free for the teacher + class) */}
            {!selectedClassId ? (
              <AdminField
                name="subjectId"
                label="Subject"
                variant="select"
                placeholder="Select a class first"
                options={[]}
                disabled
              />
            ) : subjectOptions.length === 0 ? (
              <FieldNotice label="Subject">
                This teacher already has every subject in this class.
              </FieldNotice>
            ) : (
              <AdminField
                name="subjectId"
                label="Subject"
                variant="select"
                placeholder="Select a subject"
                options={subjectOptions}
              />
            )}

            <div className="w-40">
              <SubmitButton
                isSubmitting={form.formState.isSubmitting}
                disabled={!canSubmit}
              >
                Add assignment
              </SubmitButton>
            </div>
          </form>
        </FormProvider>
      </div>

      {actionError ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {actionError}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          emptyState="No assignments yet."
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete assignment"
        message="Remove this teacher assignment? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
