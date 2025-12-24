import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { AboutComponent } from './about/about.component';
import { DoctorProfileComponent } from './patient/doctor-profile/doctor-profile.component';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'patient',
    canActivate: [authGuard, roleGuard],
    data: { role: 'patient' },
    loadChildren: () => import('./patient/patient.module').then(m => m.PatientModule)
  },
  {
    path: 'doctor',
    canActivate: [authGuard, roleGuard],
    data: { role: 'doctor' },
    loadChildren: () => import('./doctor/doctor.module').then(m => m.DoctorModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  },
  {
    path: 'pharmacist',
    canActivate: [authGuard, roleGuard],
    data: { role: 'pharmacist' },
    loadChildren: () => import('./pharmacist/pharmacist.module').then(m => m.PharmacistRoutingModule)
  },
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  { path: 'about', component: AboutComponent },
  { path: 'doctors/:id', component: DoctorProfileComponent },
  { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  { path: 'patient', loadChildren: () => import('./patient/patient.module').then(m => m.PatientModule) },
  { path: 'doctor', loadChildren: () => import('./doctor/doctor.module').then(m => m.DoctorModule) },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
