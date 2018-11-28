import { NgModule } from '@angular/core';
import { MatDividerModule } from '@angular/material';

import { SharedModule } from '../../shared/shared.module';
import { TradingComponent } from './trading.component';

@NgModule({
  imports: [
    SharedModule,
    MatDividerModule
  ],
  declarations: [TradingComponent]
})
export class TradingModule { }
