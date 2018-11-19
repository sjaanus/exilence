import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';

import { CombinedItemPriceInfo } from '../interfaces/poewatch/combined-item-price-info.interface';
import { ItemInfo } from '../interfaces/poewatch/item-info.interface';
import { ItemPrice } from '../interfaces/poewatch/item-price.interface';
import { AnalyticsService } from './analytics.service';
import { LogService } from './log.service';


@Injectable({
  providedIn: 'root'
})
export class PriceService {

  private version: string;
  private poeWatchBaseUrl = 'https://api.poe.watch';
  private itemData: ItemInfo[] = [];
  private itemPrices: ItemPrice[] = [];
  private ItemsWithPrice: CombinedItemPriceInfo[] = [];
  private cooldown = false;

  constructor(
    private http: HttpClient,
    private logService: LogService,
    private analyticsService: AnalyticsService
  ) {
  }

  Update(league: string) {
    console.log('Update triggered from price.service.ts');
    forkJoin([this.fetchPrices(league), this.fetchItems()]).subscribe(res => {
      this.itemPrices = res[0];
      this.itemData = res[1];
      this.ItemsWithPrice = this.itemData.map(x => Object.assign(x, this.itemPrices.find(y => y.id === x.id)));
    });
  }

  pricecheckItemById(itemId: number) {
    return this.ItemsWithPrice.find(t => t.id === itemId);
  }

  pricecheckItemByName(name: string) {
    return this.ItemsWithPrice.find(t => t.name === name);
  }

  pricecheckItem(name: string, links: number = null, ilvl: number = null, variation: string = null): CombinedItemPriceInfo {
    return this.ItemsWithPrice.find(t => t.name === name && t.links === links && t.ilvl === ilvl && t.variation === variation);
  }

  pricecheckItems(itemIds: number[]) {
    return itemIds.forEach(t => this.pricecheckItemById(t));
  }

  fetchPrices(league: string): Observable<ItemPrice[]> {
    if (!this.cooldown || this.itemPrices.length === 0) {
      this.cooldown = true;
      setTimeout(x => {
        this.cooldown = false;
      }, 1000 * 60 * 15);
      // this.analyticsService.sendEvent('PriceService', `Items`);
      const url = `${this.poeWatchBaseUrl}/compact?league=${league}`;
      return this.http.get<ItemPrice[]>(url);
    } else {
      return Observable.of(this.itemPrices);
    }
  }

  fetchItems(): Observable<ItemInfo[]> {
    if (this.itemData.length !== 0) {
      return Observable.of(this.itemData);
    }
    // this.analyticsService.sendEvent('PriceService', `Prices`);
    const url = `${this.poeWatchBaseUrl}/itemdata`;
    return this.http.get<ItemInfo[]>(url);
  }

  combinaItemsAndPrices() {

  }

}
