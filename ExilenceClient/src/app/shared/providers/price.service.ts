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

  UpdateItemsAndPrices(league: string) {
    this.logService.log('Starting to fetch items and prices from poe.watch');
    forkJoin([this.fetchPrices(league), this.fetchItems()]).subscribe(res => {
      this.itemPrices = res[0];
      this.itemData = res[1];
      this.ItemsWithPrice = this.itemData.map(x => Object.assign(x, this.itemPrices.find(y => y.id === x.id)));
      this.logService.log('Finished fetching items and prices from poe.watch');
    });
  }

  //#region Pricecheck Methods

  pricecheckByName(name: string) {
    return this.ItemsWithPrice.find(t => t.name === name);
  }

  pricecheckBase(baseType: string, ilvl: number = null, variation: string = null): CombinedItemPriceInfo {
    return this.ItemsWithPrice.find(t =>
      t.type === baseType &&
      t.ilvl === ilvl &&
      t.variation === variation
    );
  }

  pricecheckUnique(name: string, links: number = null): CombinedItemPriceInfo {
    return this.ItemsWithPrice.find(t =>
      t.name === name &&
      t.links === links
    );
  }

  pricecheckGem(name: string, level: number, quality: number): CombinedItemPriceInfo {
    return this.ItemsWithPrice.find(t =>
      t.lvl === level &&
      t.quality === quality &&
      t.name === name
    );
  }

  //#endregion

  //#region External Calls

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
  //#endregion
}
