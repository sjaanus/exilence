import { Component, OnInit, Input, ElementRef, ViewChildren, ViewChild } from '@angular/core';
import { Item } from '../../../../shared/interfaces/item.interface';
import { ItemTooltipComponent } from './item-tooltip/item-tooltip.component';

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

  constructor(public el: ElementRef) { }

  ngOnInit() {
  }

  update() {
    if (!this.weaponSwap) {
      this.tooltip.reposition(this.el);
    }
  }

  getBackgroundUrl(item) {
    if (item.shaper) {
      return `https://www.pathofexile.com/image/inventory/ShaperBackground.png?w=${item.w}&h=${item.h}&x=180&y=249`;
    }
    if (item.elder) {
      return `https://www.pathofexile.com/image/inventory/ElderBackground.png?w=${item.w}&h=${item.h}`;
    }
  }
}
