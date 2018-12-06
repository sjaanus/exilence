import { NgModule } from '@angular/core';
import { MatMenuModule, MatButtonModule } from '@angular/material';

import { SharedModule } from '../../../shared/shared.module';
import { ItemContextMenuComponent } from './item-context-menu.component';

@NgModule({
  imports: [
    SharedModule,
    MatMenuModule,
    MatButtonModule
  ],
  declarations: [ItemContextMenuComponent],
  exports: [ItemContextMenuComponent]
})
export class ItemContextMenuModule { }
