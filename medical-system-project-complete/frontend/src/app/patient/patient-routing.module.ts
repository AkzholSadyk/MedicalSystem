import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from '../shared/layout/layout.component';
import { PatientComponent } from './patient.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PatientCalendarComponent } from './patient-calendar.component';
import { AppointmentsComponent } from './appointments/appointments.component';
import { RecordsComponent } from './records/records.component';
import { DoctorsComponent } from './doctors/doctors.component';
import { PatientProfileComponent } from './patient-profile.component';
import { AiChatComponent } from './ai-chat/ai-chat.component';
import { MedicationsComponent } from './medications/medications.component';

// Generate components for these routes
// import { DashboardComponent } from './dashboard/dashboard.component';
// import { AppointmentsComponent } from './appointments/appointments.component';
// import { RecordsComponent } from './records/records.component';
// import { DoctorsComponent } from './doctors/doctors.component';
// import { AiChatComponent } from './ai-chat/ai-chat.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent, // Use the shared layout component
    children: [
  { path: 'dashboard', component: PatientCalendarComponent },
      { path: 'appointments', component: AppointmentsComponent },
      { path: 'records', component: RecordsComponent },
      { path: 'doctors', component: DoctorsComponent },
  { path: 'profile/:id', component: PatientProfileComponent },
      { path: 'medications', component: MedicationsComponent },
      { path: 'ai-chat', component: AiChatComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PatientRoutingModule { }
