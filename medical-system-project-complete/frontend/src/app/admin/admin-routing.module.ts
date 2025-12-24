import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AdminEditComponent } from './admin-edit/admin-edit.component';
import { adminGuard } from '../core/guards/admin.guard';

const routes: Routes = [
  { path: 'login', component: AdminLoginComponent },
  { path: 'dashboard', component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: 'edit/:id', component: AdminEditComponent, canActivate: [adminGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
