import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from '../shared/layout/layout.component';
import { DoctorComponent } from './doctor.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DoctorCalendarComponent } from './doctor-calendar.component';
import { PatientsComponent } from './patients/patients.component';
import { AppointmentsComponent } from './appointments/appointments.component';
import { RecordsComponent } from './records/records.component';
import { AiChatComponent } from './ai-chat/ai-chat.component';



const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
  { path: 'dashboard', component: DoctorCalendarComponent },
      { path: 'patients', component: PatientsComponent },
      { path: 'appointments', component: AppointmentsComponent },
      { path: 'records', component: RecordsComponent },
      { path: 'ai-chat', component: AiChatComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DoctorRoutingModule { }
