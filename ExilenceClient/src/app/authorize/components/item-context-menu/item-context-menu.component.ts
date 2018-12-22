import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material';

import { RobotService } from '../../../shared/providers/robot.service';

@Component({
    selector: 'app-item-context-menu',
    templateUrl: 'item-context-menu.component.html',
    styleUrls: ['item-context-menu.component.scss'],
})
export class ItemContextMenuComponent implements OnInit {

    @Input() text: string;
    @Input() item: any;
    @Output() clicked = new EventEmitter();
    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

    constructor(private robotService: RobotService) {
    }

    ngOnInit() {
        console.log(this.item);
    }

    openContextMenu() {
        this.trigger.openMenu();
    }

    itemClick() {
        this.clicked.next(this.item);
    }
}
