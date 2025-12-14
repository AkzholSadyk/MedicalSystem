import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import { MatDialog } from '@angular/material/dialog';
import { AppointmentDialogComponent } from './appointment-dialog.component';
import { Appointment } from '../../core/models/appointment.model';

@Component({
  selector: 'app-calendar',
  template: `<full-calendar [options]="calendarOptions"></full-calendar>`,
  standalone: true,
  imports: [CommonModule, FullCalendarModule]
})
export class CalendarComponent implements OnChanges {
  @Input() events: Appointment[] = [];

  calendarOptions: CalendarOptions = {
    plugins: [interactionPlugin, timeGridPlugin, dayGridPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridWeek,dayGridMonth'
    },
    allDaySlot: false,
    nowIndicator: true,
    editable: false,
    selectable: true,
  scrollTime: '08:00',
    slotMinTime: '06:00',
    slotMaxTime: '20:00',
    height: 'auto',
    
    eventClassNames: (arg) => {
      const classes: string[] = [];
      const props: any = arg.event.extendedProps || {};
      const now = new Date();
      const start = arg.event.start;
  const end = arg.event.end || arg.event.start;
  // add status-based class
  if (props.status === 'pending') classes.push('evt-pending');
  if (props.status === 'scheduled') classes.push('evt-scheduled');
  if (props.status === 'completed') classes.push('evt-completed');
  if (props.status === 'cancelled') classes.push('evt-cancelled');
  if (end && end < now) classes.push('fc-event-past');
      return classes;
    },
    eventClick: this.onEventClick.bind(this),
    events: []
  };

  constructor(private dialog: MatDialog) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['events']) {
      this.calendarOptions = {
        ...this.calendarOptions,
        events: this.eventsToCalendarEvents(this.events)
      };
    }
  }

  eventsToCalendarEvents(events: Appointment[]) {
    return events.map(e => {
      const start = e.appointment_date && e.appointment_time ? `${e.appointment_date}T${e.appointment_time}` : (e.appointment_date || '');
      const end = e.appointment_date && e.appointment_time ? addMinutesLocal(e.appointment_date, e.appointment_time, e.duration || 30) : undefined;
      return {
        id: String(e.id),
        title: e.notes || e.reason || e.patient_name || e.doctor_name || 'Appointment',
        start,
        end,
        extendedProps: { original: e, status: e.status }
      };
    });
  }

  onEventClick(arg: EventClickArg) {
    const original: Appointment = (arg.event.extendedProps as any).original;
    this.dialog.open(AppointmentDialogComponent, { width: '480px', data: { appointment: original }});
  }
}


function addMinutesLocal(dateStr: string, timeStr: string, minutes: number) {
  try {
    const [year, month, day] = dateStr.split('-').map(n => parseInt(n, 10));
    const [hour, minute] = timeStr.split(':').map(n => parseInt(n, 10));
    const dt = new Date(year, (month || 1) - 1, day, hour || 0, minute || 0);
    dt.setMinutes(dt.getMinutes() + minutes);
    const y = dt.getFullYear();
    const m = pad(dt.getMonth() + 1);
    const d = pad(dt.getDate());
    const hh = pad(dt.getHours());
    const mm = pad(dt.getMinutes());
    return `${y}-${m}-${d}T${hh}:${mm}`;
  } catch (e) {
    return undefined;
  }
}

function pad(n: number) { return n < 10 ? '0' + n : String(n); }
