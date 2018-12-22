import { NgModule } from '@angular/core';
import { MatCardModule, MatDividerModule, MatIconModule } from '@angular/material';

import { SharedModule } from '../../shared/shared.module';
import { InfoDialogComponent } from '../components/info-dialog/info-dialog.component';
import { InfoDialogModule } from '../components/info-dialog/info-dialog.module';
import { ItemContextMenuModule } from '../components/item-context-menu/item-context-menu.module';
import { DashboardComponent } from './dashboard.component';

@NgModule({
  imports: [
    SharedModule,
    MatDividerModule,
    MatCardModule,
    MatIconModule,
    InfoDialogModule,
    ItemContextMenuModule
  ],
  declarations: [DashboardComponent],
  entryComponents: [InfoDialogComponent]
})
export class DashboardModule { }
