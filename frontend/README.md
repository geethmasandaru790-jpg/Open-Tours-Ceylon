# Open Tours Ceylon — Frontend

Plain HTML + Tailwind (CDN) + vanilla JS, calling the Express API in
`../backend`. No build step required — open `index.html` directly, or serve
it with any static file server.

Set `API_BASE` at the top of the `<script>` block in `index.html` to point
at your running backend (defaults to `http://localhost:4000/api`).

## What's wired up
- Registration modal with role selection (Tourist / Driver / Guide)
- Login, JWT stored in `localStorage`, sent as `Authorization: Bearer <token>`
- OTP verification screen — "Post Ad" / "Add Vehicle" are blocked and the
  user is redirected here if the API returns `code: 'ACCOUNT_NOT_VERIFIED'`
- Interactive 2D seat layout grid editor for driver profiles
- Master Admin dashboard (only rendered when `/api/auth/me` reports
  `isMasterAdmin: true`) with tables to approve/reject ads and
  suspend/reactivate users

This is a real client for the backend API — it has no local fallback data
and no client-side "fake" admin logic. If the backend isn't running, the
relevant screens will show request errors, which is correct: there is
nothing for the frontend to fake here.
