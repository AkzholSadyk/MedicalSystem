import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-edit',
  templateUrl: './admin-edit.component.html',
  styleUrls: ['./admin-edit.component.css']
})
export class AdminEditComponent implements OnInit {
  user: any = null;
  loading = false;
  error: string | null = null;

  constructor(private route: ActivatedRoute, private admin: AdminService, private router: Router) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/admin/dashboard']); return; }
    this.loading = true;
    this.admin.getUser(id).subscribe({ next: (u) => { this.user = u; this.loading = false; }, error: (e) => { this.error = 'Failed to load'; this.loading = false; } });
  }

  save() {
    this.loading = true;
    const payload = {
      first_name: this.user.full_name?.split(' ')[0] || '',
      last_name: this.user.full_name?.split(' ').slice(1).join(' ') || '',
      email: this.user.email,
      phone: this.user.phone,
      role: this.user.role,
      is_active: this.user.status === 'active'
    };
    this.admin.updateUser(this.user.id, payload).subscribe({ next: () => { this.router.navigate(['/admin/dashboard']); }, error: (e) => { this.error = 'Failed to update'; this.loading = false; } });
  }

  cancel(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}

