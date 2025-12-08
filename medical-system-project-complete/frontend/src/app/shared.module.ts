import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from './shared/layout/layout.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { HeaderComponent } from './shared/header/header.component';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

const SHARED_COMPONENTS = [
  LayoutComponent,
  SidebarComponent,
  HeaderComponent
];

const SHARED_MODULES = [
  CommonModule,
  RouterModule,
  MatSidenavModule,
  MatListModule,
  MatToolbarModule,
  MatIconModule,
  MatButtonModule
];

@NgModule({
  declarations: [
    ...SHARED_COMPONENTS
  ],
  imports: [
    ...SHARED_MODULES
  ],
  exports: [
    ...SHARED_COMPONENTS,
    ...SHARED_MODULES
  ]
})
export class SharedModule { }
