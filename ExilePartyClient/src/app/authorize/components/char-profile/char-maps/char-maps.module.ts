import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatIconModule, MatInputModule, MatMenuModule } from '@angular/material';

import { SharedModule } from '../../../../shared/shared.module';
import { InfoDialogComponent } from '../../info-dialog/info-dialog.component';
import { InfoDialogModule } from '../../info-dialog/info-dialog.module';
import { MapTableModule } from '../../map-table/map-table.module';
import { CharMapsComponent } from './char-maps.component';

@NgModule({
    imports: [
        MatMenuModule,
        MatIconModule,
        SharedModule,
        MapTableModule,
        FormsModule,
        ReactiveFormsModule,
        MatInputModule,
        MatButtonModule,
        InfoDialogModule
    ],
    declarations: [CharMapsComponent],
    exports: [CharMapsComponent],
    entryComponents: [InfoDialogComponent]
})
export class CharMapsModule { }
