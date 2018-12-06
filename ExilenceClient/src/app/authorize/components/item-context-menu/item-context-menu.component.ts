import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { MatMenuTrigger, MatMenu } from '@angular/material';
import { Item } from '../../../shared/interfaces/item.interface';

@Component({
    selector: 'app-item-context-menu',
    templateUrl: 'item-context-menu.component.html',
    styleUrls: ['item-context-menu.component.scss'],
})
export class ItemContextMenuComponent implements OnInit {

    @Input() item = 'asdasd';
    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

    constructor() {
    }

    ngOnInit() {
    }

    openContextMenu() {
        this.trigger.openMenu();
    }
}
