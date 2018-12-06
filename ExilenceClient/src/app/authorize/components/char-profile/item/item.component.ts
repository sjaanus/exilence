import { Component, OnInit, Input, ElementRef, ViewChildren, ViewChild } from '@angular/core';
import { Item } from '../../../../shared/interfaces/item.interface';
import { ItemTooltipComponent } from './item-tooltip/item-tooltip.component';
import { ItemContextMenuComponent } from '../../item-context-menu/item-context-menu.component';

@Component({
  selector: 'app-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss']
})
export class ItemComponent implements OnInit {
  @Input() item: Item;
  @Input() wide = false;
  @Input() weaponSwap = false;
  @Input() extendHeightWith = 0;
  @ViewChild('tooltip') tooltip: ItemTooltipComponent;
  @ViewChild('contextmenu') contextMenu: ItemContextMenuComponent;

  constructor(public el: ElementRef) { }

  ngOnInit() {
  }

  update() {
    if (!this.weaponSwap) {
      this.tooltip.reposition(this.el);
    }
  }

  openContextMenu() {
    this.contextMenu.openContextMenu();
  }

}
