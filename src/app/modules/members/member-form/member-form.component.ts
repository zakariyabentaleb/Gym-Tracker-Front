import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MemberCreateRequest, MemberResponse } from '../../../models/member.model';
import { pastDateValidator } from '../../../utils/validators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-member-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './member-form.component.html',
  styleUrls: ['./member-form.component.css']
})
export class MemberFormComponent implements OnInit {
  @Input() initial?: Partial<MemberResponse>;
  @Input() editMode = false;
  @Output() submitForm = new EventEmitter<MemberCreateRequest>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({
      firstName: [this.initial?.firstName || '', [Validators.required, Validators.maxLength(80)]],
      lastName: [this.initial?.lastName || '', [Validators.required, Validators.maxLength(80)]],
      phone: [this.initial?.phone || '', [Validators.maxLength(30)]],
      birthDate: [this.initial?.birthDate || null, [pastDateValidator()]],
      active: [this.initial?.active ?? true]
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const val = { ...this.form.getRawValue() };
    // birthDate is already a YYYY-MM-DD string from type="date" input
    this.submitForm.emit(val as MemberCreateRequest);
  }
}
