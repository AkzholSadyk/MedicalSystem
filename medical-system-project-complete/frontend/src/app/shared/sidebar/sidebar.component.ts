import { Component, Input } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() role: string | null = null;

  patientMenu = [
    { name: 'Dashboard', icon: 'dashboard', route: '/patient/dashboard' },
    { name: 'Appointments', icon: 'event', route: '/patient/appointments' },
    { name: 'Medical Records', icon: 'folder_open', route: '/patient/records' },
    { name: 'Find Doctor', icon: 'person_search', route: '/patient/doctors' },
    { name: 'AI Chat', icon: 'smart_toy', route: '/patient/ai-chat' },
  ];

  doctorMenu = [
    { name: 'Dashboard', icon: 'dashboard', route: '/doctor/dashboard' },
    { name: 'My Patients', icon: 'group', route: '/doctor/patients' },
    { name: 'Appointments', icon: 'event', route: '/doctor/appointments' },
    { name: 'Medical Records', icon: 'folder_open', route: '/doctor/records' },
    { name: 'AI Assistant', icon: 'smart_toy', route: '/doctor/ai-chat' },
  ];

  adminMenu = [
    { name: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
    { name: 'Users', icon: 'people', route: '/admin/users' },
    { name: 'Clinics', icon: 'local_hospital', route: '/admin/clinics' },
  ];

  get menuItems() {
    switch (this.role) {
      case 'patient':
        return this.patientMenu;
      case 'doctor':
        return this.doctorMenu;
      case 'admin':
        return this.adminMenu;
      default:
        return [];
    }
  }
  constructor(public authService: AuthService) {}
}
