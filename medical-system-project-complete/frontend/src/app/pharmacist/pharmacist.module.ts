import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PharmacistDashboardComponent } from './pharmacist-dashboard.component';
import { DrugFormComponent } from './drug-form.component';
import { authGuard, roleGuard } from '../core/guards/auth.guard';

const routes: Routes = [
  // Support both /pharmacist and /pharmacist/dashboard after login redirects
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: PharmacistDashboardComponent, canActivate: [authGuard, roleGuard], data: { role: 'pharmacist' } },
  { path: 'new', component: DrugFormComponent, canActivate: [authGuard, roleGuard], data: { role: 'pharmacist' } },
  { path: 'edit/:id', component: DrugFormComponent, canActivate: [authGuard, roleGuard], data: { role: 'pharmacist' } }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PharmacistRoutingModule {}
