import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RoleGuard } from '../../guards/role.guard';

import { ListMembersComponent } from './list-members/list-members.component';
import { CreateMemberComponent } from './create-member/create-member.component';
import { EditMemberComponent } from './edit-member/edit-member.component';
import { MemberDetailsComponent } from './member-details/member-details.component';
import { MyProfileComponent } from './my-profile/my-profile.component';

const routes: Routes = [
  {
    path: '',
    component: ListMembersComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_RECEPTIONIST'] }
  },
  {
    path: 'create',
    component: CreateMemberComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_RECEPTIONIST'] }
  },
  {
    path: 'me',
    component: MyProfileComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_MEMBER'] }
  },
  {
    path: ':id',
    component: MemberDetailsComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_RECEPTIONIST'] }
  },
  {
    path: ':id/edit',
    component: EditMemberComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_RECEPTIONIST'] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MembersModule {}
