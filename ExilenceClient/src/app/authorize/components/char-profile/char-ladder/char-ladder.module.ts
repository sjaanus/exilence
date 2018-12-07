import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule, MatInputModule, MatTabsModule } from '@angular/material';

import { SharedModule } from '../../../../shared/shared.module';
import { LadderTableModule } from '../../ladder-table/ladder-table.module';
import { CharLadderComponent } from './char-ladder.component';

@NgModule({
  imports: [
    SharedModule,
    LadderTableModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatTabsModule,
    MatIconModule
  ],
  declarations: [CharLadderComponent],
  exports: [CharLadderComponent]
})
export class CharLadderModule { }
