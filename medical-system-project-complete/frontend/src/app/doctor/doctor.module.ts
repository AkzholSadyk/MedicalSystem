import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DoctorRoutingModule } from './doctor-routing.module';
import { DoctorComponent } from './doctor.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PatientsComponent } from './patients/patients.component';
import { AppointmentsComponent } from './appointments/appointments.component';
import { RecordsComponent } from './records/records.component';
import { AiChatComponent } from './ai-chat/ai-chat.component';
import { SharedModule } from '../shared.module';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';


@NgModule({
  
  declarations: [
    DoctorComponent,
    PatientsComponent,
    AppointmentsComponent,
  ],
  
  imports: [
    CommonModule,
    DoctorRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatGridListModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    DashboardComponent,
    DashboardComponent,
    MatNativeDateModule,
    RecordsComponent,
    AiChatComponent
  ]
})
export class DoctorModule { }


// @NgModule({
//   declarations: [
//     DoctorComponent,
//     PatientsComponent,
//     AppointmentsComponent,
//   ],
//   imports: [
//     CommonModule,
//     DoctorRoutingModule,
//     SharedModule,
//     FormsModule,
//     ReactiveFormsModule,
//     MatCardModule,
//     MatGridListModule,
//     MatIconModule,
//     MatButtonModule,
//     MatTableModule,
//     MatPaginatorModule,
//     MatSortModule,
//     MatFormFieldModule,
//     MatInputModule,
//     MatSelectModule,
//     MatDatepickerModule,
//     DashboardComponent,
//     RecordsComponent,
//     AiChatComponent,
//     MatNativeDateModule
//   ]