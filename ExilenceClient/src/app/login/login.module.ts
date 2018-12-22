import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatCheckboxModule,
  MatDividerModule,
  MatGridListModule,
  MatIconModule,
  MatInputModule,
  MatOptionModule,
  MatProgressBarModule,
  MatRadioModule,
  MatSelectModule,
  MatStepperModule,
} from '@angular/material';
import { MatFormFieldModule } from '@angular/material/form-field';

import { InfoDialogComponent } from '../authorize/components/info-dialog/info-dialog.component';
import { InfoDialogModule } from '../authorize/components/info-dialog/info-dialog.module';
import { ItemContextMenuModule } from '../authorize/components/item-context-menu/item-context-menu.module';
import { ClearHistoryDialogComponent } from '../shared/components/clear-history-dialog/clear-history-dialog.component';
import { ClearHistoryDialogModule } from '../shared/components/clear-history-dialog/clear-history-dialog.module';
import { SharedModule } from '../shared/shared.module';
import { LoginComponent } from './login.component';

@NgModule({
  imports: [
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    MatStepperModule,
    MatButtonModule,
    MatRadioModule,
    MatOptionModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressBarModule,
    InfoDialogModule,
    ClearHistoryDialogModule,
    MatDividerModule,
    MatGridListModule,
    ItemContextMenuModule
  ],
  declarations: [LoginComponent],
  entryComponents: [ClearHistoryDialogComponent, InfoDialogComponent]
})
export class LoginModule { }
