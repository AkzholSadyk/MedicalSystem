import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() role: string | null = null;
  private langChangeSubscription?: Subscription;

  patientMenu = [
    { nameKey: 'SIDEBAR.PATIENT.DASHBOARD', icon: 'dashboard', route: '/patient/dashboard' },
    { nameKey: 'SIDEBAR.PATIENT.APPOINTMENTS', icon: 'event', route: '/patient/appointments' },
    { nameKey: 'SIDEBAR.PATIENT.MEDICAL_RECORDS', icon: 'folder_open', route: '/patient/records' },
    { nameKey: 'SIDEBAR.PATIENT.FIND_DOCTOR', icon: 'person_search', route: '/patient/doctors' },
    { nameKey: 'SIDEBAR.PATIENT.MEDICATIONS', icon: 'medication', route: '/patient/medications' },
    { nameKey: 'SIDEBAR.PATIENT.AI_CHAT', icon: 'smart_toy', route: '/patient/ai-chat' },
  ];

  doctorMenu = [
    { nameKey: 'SIDEBAR.DOCTOR.DASHBOARD', icon: 'dashboard', route: '/doctor/dashboard' },
    { nameKey: 'SIDEBAR.DOCTOR.MY_PATIENTS', icon: 'group', route: '/doctor/patients' },
    { nameKey: 'SIDEBAR.DOCTOR.APPOINTMENTS', icon: 'event', route: '/doctor/appointments' },
    { nameKey: 'SIDEBAR.DOCTOR.MEDICAL_RECORDS', icon: 'folder_open', route: '/doctor/records' },
    { nameKey: 'SIDEBAR.DOCTOR.AI_ASSISTANT', icon: 'smart_toy', route: '/doctor/ai-chat' },
  ];

  adminMenu = [
    { nameKey: 'SIDEBAR.ADMIN.DASHBOARD', icon: 'dashboard', route: '/admin/dashboard' },
    { nameKey: 'SIDEBAR.ADMIN.USERS', icon: 'people', route: '/admin/users' },
    { nameKey: 'SIDEBAR.ADMIN.CLINICS', icon: 'local_hospital', route: '/admin/clinics' },
  ];

  pharmacistMenu = [
    { nameKey: 'SIDEBAR.PHARMACIST.DASHBOARD', icon: 'inventory_2', route: '/pharmacist' }
  ];

  get menuItems() {
    switch (this.role) {
      case 'patient':
        return this.patientMenu;
      case 'doctor':
        return this.doctorMenu;
      case 'admin':
        return this.adminMenu;
      case 'pharmacist':
        return this.pharmacistMenu;
      default:
        return [];
    }
  }

  constructor(public authService: AuthService, private translate: TranslateService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Подписываемся на изменения языка для обновления меню
    this.langChangeSubscription = this.translate.onLangChange.subscribe(() => {
      // Force Angular to check this component so translated labels update immediately
      try { this.cdr.detectChanges(); } catch (e) { /* noop */ }
    });
  }

  ngOnDestroy(): void {
    if (this.langChangeSubscription) {
      this.langChangeSubscription.unsubscribe();
    }
  }
}
