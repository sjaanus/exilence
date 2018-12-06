import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { MatMenuTrigger, MatMenu } from '@angular/material';
import { Item } from '../../../shared/interfaces/item.interface';
import { RobotService } from '../../../shared/providers/robot.service';

@Component({
    selector: 'app-item-context-menu',
    templateUrl: 'item-context-menu.component.html',
    styleUrls: ['item-context-menu.component.scss'],
})
export class ItemContextMenuComponent implements OnInit {

    @Input() item: Item;
    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

    constructor(private robotService: RobotService) {
    }

    ngOnInit() {
    }

    openContextMenu() {
        this.trigger.openMenu();
    }

    copy() {
        this.robotService.setTextToClipboard(this.item.typeLine);
    }
}
