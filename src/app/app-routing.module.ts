import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AdminComponent } from './pages/admin/admin.component';
import { ForbiddenComponent } from './pages/forbidden/forbidden.component';
import { HomeComponent } from './pages/home/home.component';
import { ProgrammesComponent } from './pages/programmes/programmes.component';
import { CourseDetailComponent } from './pages/course-detail/course-detail.component';
import { MesInscriptionsComponent } from './pages/mes-inscriptions/mes-inscriptions.component';
import { PlansComponent } from './pages/plans/plans.component';
import { MonAbonnementComponent } from './pages/mon-abonnement/mon-abonnement.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'programmes', component: ProgrammesComponent },
  { path: 'programmes/:id', component: CourseDetailComponent },
  { path: 'plans', component: PlansComponent },
  { path: 'mes-inscriptions', component: MesInscriptionsComponent, canActivate: [AuthGuard] },
  { path: 'mon-abonnement', component: MonAbonnementComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_ADMIN'] }
  },
  {
    path: 'members',
    loadChildren: () =>
      import('./modules/members/members.module').then(m => m.MembersModule)
  },
  { path: 'forbidden', component: ForbiddenComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
