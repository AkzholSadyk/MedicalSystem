Dashboard calendar + history

- Show upcoming appointments on a calendar view on the patient dashboard
- Also show list of past appointments (history) below or in a side panel
- Use a lightweight calendar component (e.g., FullCalendar or simple grid) or Material-calendar popover
- Steps:
  1. Add calendar section to `dashboard.component.html`
  2. Add logic in `dashboard.component.ts` to fetch upcoming and past appointments (GET /appointments/upcoming and GET /appointments with history filter)
  3. Map appointments to calendar events (title = doctor name, date = appointment_date)
  4. Add small list for past appointments (limit 5) with quick links
  5. Optional: add click on calendar day to open appointment creation modal

Note: FullCalendar requires extra library installation; a simpler Material-based calendar grid can be implemented quickly.
