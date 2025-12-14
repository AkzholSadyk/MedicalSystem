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
    return events.map(e => ({
      id: String(e.id),
      title: e.notes || e.reason || e.patient_name || e.doctor_name || 'Appointment',
      start: e.appointment_date && e.appointment_time ? `${e.appointment_date}T${e.appointment_time}` : (e.appointment_date || ''),
      end: e.appointment_date && e.appointment_time ? addMinutesIso(e.appointment_date, e.appointment_time, e.duration || 30) : undefined,
      extendedProps: { original: e, status: e.status }
    }));
  }

  onEventClick(arg: EventClickArg) {
    const original: Appointment = (arg.event.extendedProps as any).original;
    this.dialog.open(AppointmentDialogComponent, { width: '480px', data: { appointment: original }});
  }
}

// helper: compute end ISO datetime as string
function addMinutesIso(dateStr: string, timeStr: string, minutes: number) {
  try {
    const dt = new Date(`${dateStr}T${timeStr}`);
    dt.setMinutes(dt.getMinutes() + minutes);
    return dt.toISOString();
  } catch (e) {
    return undefined;
  }
}
