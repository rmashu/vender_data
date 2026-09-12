# Auth Flow

## Request Flow

1. Login page collects email and password.
2. `POST /api/auth/login` validates payload shape.
3. Authentication checks user credentials.
4. A signed HTTP-only session cookie is created.
5. Protected pages read and verify the session cookie.
6. User status and role are resolved.
7. Required permission is checked.
8. Allowed users reach the dashboard or protected module.

## New User Flow

1. User submits full name, email, password and confirm password.
2. User is created with `PENDING` status.
3. Admin approves the user and assigns a role.
4. Approved user status becomes `ACTIVE`.
5. Only active users can login.

## Route Rules

- No session: redirect to `/login`.
- Valid session opening `/login`: redirect to `/dashboard`.
- Valid session without permission: redirect to `/dashboard` or return `403` for APIs.
- API routes must use `requireApiPermission`.
- Page routes must read `getCurrentSession` and check permissions server-side.
