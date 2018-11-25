import 'rxjs/add/operator/concatMap';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/toArray';

import { Injectable } from '@angular/core';
import { from } from 'rxjs';

import { HistoryHelper } from '../helpers/history.helper';
import { NetWorthHistory, NetWorthItem, NetWorthSnapshot } from '../interfaces/income.interface';
import { Item } from '../interfaces/item.interface';
import { Player } from '../interfaces/player.interface';
import { Stash } from '../interfaces/stash.interface';
import { AccountService } from './account.service';
import { ExternalService } from './external.service';
import { LogService } from './log.service';
import { PartyService } from './party.service';
import { PriceService } from './price.service';
import { SessionService } from './session.service';
import { SettingsService } from './settings.service';



@Injectable({
  providedIn: 'root'
})
export class NetworthService {

  // CONSTANTS
  private FIVE_MINUTES = (5 * 60 * 1000);
  private ONE_HOUR_AGO = (Date.now() - (1 * 60 * 60 * 1000));

  // VARIABLES
  private netWorthHistory: NetWorthHistory;
  private localPlayer: Player;
  private isSnapshotting = false;
  private selectedStashTabs: any[];
  public session = {
    sessionId: undefined,
    sessionIdValid: false
  };

  constructor(
    private settingsService: SettingsService,
    private externalService: ExternalService,
    private priceService: PriceService,
    private accountService: AccountService,
    private partyService: PartyService,
    private sessionService: SessionService,
    private logService: LogService
  ) {
    this.updateUsedParams();
    this.accountService.player.subscribe(res => {
      if (res !== undefined) {
        this.localPlayer = res;
        this.localPlayer.netWorthSnapshots = this.netWorthHistory.history;
      }
    });
  }

  updateUsedParams() {
    this.netWorthHistory = this.settingsService.get('networth');
    this.selectedStashTabs = this.settingsService.get('selectedStashTabs');
    this.session.sessionId = this.sessionService.getSession();
    this.session.sessionIdValid = this.settingsService.get('account.sessionIdValid');
  }

  removePlaceholderIfNeeded() {
    if (
      this.netWorthHistory.history.length === 1 &&
      this.netWorthHistory.history[0].value === 0
    ) {
      this.netWorthHistory.history.pop();
    }
  }


  isSnapshotValid(): boolean {
    if (
      this.netWorthHistory.lastSnapshot < (Date.now() - this.FIVE_MINUTES) &&
      this.localPlayer !== undefined &&
      (
        this.session.sessionId !== undefined &&
        this.session.sessionId !== '' &&
        this.session.sessionIdValid
      ) &&
      !this.isSnapshotting &&
      !this.accountService.loggingIn && !
      this.settingsService.isChangingStash &&
      (
        this.selectedStashTabs === undefined ||
        this.selectedStashTabs.length !== 0
      )
    ) {
      return true;
    }
    return false;
  }

  Snapshot() {

    this.updateUsedParams();
    this.removePlaceholderIfNeeded();

    if (!this.isSnapshotValid()) {
      return;
    }

    this.isSnapshotting = true;

    if (this.selectedStashTabs === undefined) {
      this.selectedStashTabs = [];

      for (let i = 0; i < 5; i++) {
        this.selectedStashTabs.push({ name: '', position: i });
      }
    }

    if (this.selectedStashTabs.length > 20) {
      this.selectedStashTabs = this.selectedStashTabs.slice(0, 19);
    }


    from(this.selectedStashTabs)
      .concatMap((tab: any) => {
        // tslint:disable-next-line:max-line-length
        return this.externalService.getStashTab(this.session.sessionId, this.localPlayer.account, this.localPlayer.character.league, tab.position).delay(750);
      })
      .toArray()
      .subscribe((stashes: Stash[]) => {

        const totalNetWorthItems: NetWorthItem[] = [];

        stashes.forEach((stash: Stash) => {
          stash.items.forEach((item: Item) => {

            const itemName = this.retriveItemName(item);
            const itemStacksize = item.stackSize ? item.stackSize : 1;
            let itemPrice = this.identifyAndPricecheckItem(item);

            if (typeof itemPrice !== 'undefined' || itemName === 'Chaos Orb') {

              if (itemName === 'Chaos Orb') {
                itemPrice = 1;
              }

              const totalPrice = itemPrice * itemStacksize;
              if (totalPrice >= 1) { // If the total price is one chaos or more.

                const existingItem = totalNetWorthItems.find(x => x.name === itemName);

                if (existingItem !== undefined) {
                  const indexOfItem = totalNetWorthItems.indexOf(existingItem);
                  // update existing item with new data
                  existingItem.stacksize = existingItem.stacksize + itemStacksize;
                  existingItem.value = existingItem.value + totalPrice;
                  totalNetWorthItems[indexOfItem] = existingItem;
                } else {
                  // Add new item
                  const netWorthItem: NetWorthItem = {
                    name: itemName,
                    value: totalPrice,
                    valuePerUnit: itemPrice,
                    icon: item.icon.indexOf('?') >= 0
                      ? item.icon.substring(0, item.icon.indexOf('?')) + '?scale=1&scaleIndex=3&w=1&h=1'
                      : item.icon + '?scale=1&scaleIndex=3&w=1&h=1',
                    stacksize: itemStacksize
                  };
                  totalNetWorthItems.push(netWorthItem);
                }
              }
            }
          });
        });

        // Save Snapshot
        const snapShot: NetWorthSnapshot = {
          timestamp: Date.now(),
          value: this.calculateTotalNetWorth(totalNetWorthItems),
          items: totalNetWorthItems,
        };

        this.netWorthHistory.history.unshift(snapShot);
        this.netWorthHistory.lastSnapshot = Date.now();

        const localPlayerClone = Object.assign({}, this.localPlayer);
        localPlayerClone.netWorthSnapshots = HistoryHelper.filterNetworth(this.netWorthHistory.history, this.ONE_HOUR_AGO);

        this.localPlayer.netWorthSnapshots = this.netWorthHistory.history;

        this.accountService.player.next(this.localPlayer);
        this.settingsService.set('networth', this.netWorthHistory);
        this.partyService.updatePlayer(localPlayerClone);

        this.isSnapshotting = false;
      });
  }

  identifyAndPricecheckItem(item: Item): number {

    let price: any = 0;
    let elderOrShaper = null;
    if (item.elder) { elderOrShaper = 'elder'; }
    if (item.shaper) { elderOrShaper = 'shaper'; }

    let links = 0;
    if (item.sockets) { links = this.getItemLinks(item.sockets.map(t => t.group)); }
    if (links < 5) { links = null; }

    switch (item.frameType) {
      case 0: // Normal
        price = this.priceService.pricecheckItem(item.typeLine, item.ilvl, elderOrShaper);
        return price ? price.mean : 0;
      case 1: // Magic
      case 2: // Rare
        break;
      case 3: // Unique
        price = this.priceService.pricecheckUniqueItem(item.name, null);
        return price ? price.mean : 0;
      case 4: // Gem
        const level = item.properties.find(t => t.name === 'Level').values[0][0];
        const quality =
          item.properties.find(t => t.name === 'Quality') ?
            item.properties.find(t => t.name === 'Quality').values[0][0] : '0';

        price = this.priceService.pricecheckGem(item.name, parseInt(level, 10), parseInt(quality, 10));
        return price ? price.mean : 0;
      case 5: // Currency
      case 6: // Divination Card
      case 8: // Prophecy
        price = this.priceService.pricecheckItemByName(item.typeLine);
        return price ? price.mean : 0;
      case 9: // Relic
        break;

      default:
        return this.priceService.pricecheckItemByName(item.name).mean;
    }

  }

  calculateTotalNetWorth(netWorthItemArray: NetWorthItem[]): number {
    return netWorthItemArray.reduce((a, b) => a + b.value, 0);
  }

  sortArrayPriceDescending(netWorthItemArray: NetWorthItem[]) {
    return netWorthItemArray.sort((a: any, b: any) => {
      if (a.value < b.value) {
        return 1;
      }
      if (a.value > b.value) {
        return -1;
      }
      return 0;
    });
  }

  retriveItemName(item: Item): string {
    let itemName = item.name;
    if (item.typeLine) {
      itemName += ' ' + item.typeLine;
    }
    itemName = itemName.replace('<<set:MS>><<set:M>><<set:S>>', '').trim();
    return itemName;
  }
  // Note to self: This is completely retarded
  clearHistory() {
    this.netWorthHistory = this.settingsService.get('networth');
  }

  getItemLinks(arr) { // Get mode frequency
    const numMapping = {};
    let greatestFreq = 0;
    arr.forEach(function findMode(number) {
      numMapping[number] = (numMapping[number] || 0) + 1;

      if (greatestFreq < numMapping[number]) {
        greatestFreq = numMapping[number];
      }
    });
    return greatestFreq;
  }

}




