import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule } from '@angular/material';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';

import { AnalyticsService } from '../shared/providers/analytics.service';
import { KeybindService } from '../shared/providers/keybind.service';
import { LadderService } from '../shared/providers/ladder.service';
import { LogMonitorService } from '../shared/providers/log-monitor.service';
import { MapService } from '../shared/providers/map.service';
import { MessageValueService } from '../shared/providers/message-value.service';
import { NetworthService } from '../shared/providers/networth.service';
import { PartyService } from '../shared/providers/party.service';
import { PriceService } from '../shared/providers/price.service';
import { SharedModule } from '../shared/shared.module';
import { AuthorizeComponent } from './authorize.component';
import { DashboardModule } from './dashboard/dashboard.module';
import { FaqModule } from './faq/faq.module';
import { InspectPlayersModule } from './inspect-players/inspect-players.module';
import { PartyModule } from './party/party.module';
import { SettingsModule } from './settings/settings.module';
import { TradingModule } from './trading/trading.module';

@NgModule({
  imports: [
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatListModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    DashboardModule,
    RouterModule,
    PartyModule,
    InspectPlayersModule,
    MatSidenavModule,
    SettingsModule,
    FaqModule,
    TradingModule
  ],
  declarations: [AuthorizeComponent],
  providers: [
    KeybindService,
    MessageValueService,
    LogMonitorService,
    PartyService,
    PriceService,
    NetworthService,
    MapService,
    AnalyticsService,
    LadderService
  ]
})
export class AuthorizeModule { }
