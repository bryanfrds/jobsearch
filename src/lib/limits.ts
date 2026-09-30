// Shared by server-side validation and the matching input maxLength.
export const NOTES_MAX = 5000;
export const PROFILE_MAX = {
  fullName: 200,
  headline: 300,
  location: 100,
  desiredRoles: 500,
  skills: 2000,
} as const;
