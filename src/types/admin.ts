// Admin DTO mirror for Phase 15 screens (FE-114..FE-118).
//
// Role is a NUMERIC enum on the wire, not a string. The backend `UserRole`
// enum (Admin=0, Teacher=1, Student=2) is serialized with System.Text.Json
// defaults — there is no JsonStringEnumConverter registered — so `POST /api/users`
// expects `role` as an integer and returns it as an integer. Modeling it as a
// string union here would produce 400s. (Approved plan: Option A.)

export const UserRole = {
  Admin: 0,
  Teacher: 1,
  Student: 2,
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// Only Teacher/Student are provisionable — backend `InvalidRole` guard.
export const AdminUserRole = {
  Teacher: UserRole.Teacher,
  Student: UserRole.Student,
} as const;
export type AdminUserRole = (typeof AdminUserRole)[keyof typeof AdminUserRole];

export interface CreateUserCommand {
  fullName: string;
  email: string;
  role: AdminUserRole;
}

export interface CreateUserResponse {
  userId: string;
  email: string;
  role: UserRole;
  tempPassword: string; // must delete
  otpCode: string; // must delete
  mustChangePassword: boolean;
  isEmailVerified: boolean;
  isActive: boolean;
}

// Application.Users.Queries.ListUsers.UserSummaryResponse (GET /api/users)
export interface UserSummaryResponse {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.Admin]: "Admin",
  [UserRole.Teacher]: "Teacher",
  [UserRole.Student]: "Student",
};

export interface ClassResponse {
  id: string;
  name: string;
  gradeLevel: string;
  createdAt: string;
}

export interface CreateClassCommand {
  name: string;
  gradeLevel: string;
}

export interface UpdateClassCommand {
  id: string;
  name: string;
  gradeLevel: string;
}

export interface SubjectResponse {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

export interface CreateSubjectCommand {
  name: string;
  code: string;
}

export interface UpdateSubjectCommand {
  id: string;
  name: string;
  code: string;
}

export interface TeacherSubjectClassAssignmentResponse {
  id: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  createdAt: string;
}

export interface CreateTeacherSubjectClassAssignmentCommand {
  teacherId: string;
  subjectId: string;
  classId: string;
}

export interface StudentClassEnrollmentResponse {
  id: string;
  studentId: string;
  classId: string;
  enrolledAt: string;
}

export interface CreateStudentClassEnrollmentCommand {
  studentId: string;
  classId: string;
}
