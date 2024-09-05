import { Logger } from 'winston';
import Container, { Inject, Service } from 'typedi';
import ERC20ABI from './abi/erc20.json';
import PushCoreAbi from './abi/pushCore.json';
import yieldFarmingLPAbi from './abi/yieldFarming.json';
import { BigNumber } from '@ethersproject/bignumber';
import { EPNSChannel } from '../../helpers/epnschannel';
import config from '../../config';
import { ethers } from 'ethers';
import { CovalentClient } from "@covalenthq/client-sdk";
import { user, CONSTANTS, PushAPI } from '@pushprotocol/restapi';
import { keys } from './wallettrackerKeys';
import { settings } from './wallettrackerSettings';
import { ethTrackerModel, userDataModel } from './wallettrackerModel';
import axios from 'axios';
import moment from 'moment';
import fs from "fs";
import { fetchPortfolio } from './fetchPortfolio';
import { fetchBalance } from './fetchBalance';
import { calculateWalletPerformance } from './calculateWA';
import { sendEventInfo } from './eventInfo';
import { fetchEvents } from './fetchEvents';
import { checkNewHacks } from './checkNewHacks';
import { checkNewYieldOpportunities } from './checkNewYieldOpportunities';
import { checkApprovals } from './checkApprovals';
const channelAddress = settings.channelAddress;

const { ETH_TRACKER_CACHE_KEY, PAGINATION_PARAMS, DEFAULT_BALANCE_OBJECT } = settings;

@Service()
export default class WallettrackerChannel extends EPNSChannel {
  model: any;
  constructor(@Inject('logger') public logger: Logger, @Inject('cached') public cached) {
    super(logger, {
      networkToMonitor: settings.providerUrl,
      dirname: __dirname,
      name: 'Wallet Tracker',
      url: 'https://push.org/',
      useOffChain: true,
      address: channelAddress,
    });
    this.model = require('./wallettrackerModel').default
  }

  async fetchPortolio() {
    fetchPortfolio();
  }

  async fetchBalance() {
    fetchBalance();
  }

  async calculateWalletPerformance(currentBalance: number, userAddress: string, cta: string, pushStatus: boolean, pushAmount, currentBlockNumber: any) {
    calculateWalletPerformance(currentBalance, userAddress, cta, pushStatus, pushAmount, currentBlockNumber);
  }

  // send events function
  async sendEventInfo() {
    sendEventInfo();
  }

  // ethtracker function
  async fetchEvents(simulate: any) {
    fetchEvents(simulate);
  }

  async checkNewHacks() {
    checkNewHacks();
  }

  async checkNewYieldOpportunities() {
    checkNewYieldOpportunities();
  }

  async checkApprovals() {
    checkApprovals();
  }

  async _initPaginationParams(forceInit = false) {
    // check if initialised
    const isInitialised = await this.cached.getCache(ETH_TRACKER_CACHE_KEY);
    // if initialised do nothing
    if (isInitialised && !forceInit) return;
    // get total subscribers to calculate totalPages
    const allSubscribers = await this.getChannelSubscribers();
    const totalPages = Math.ceil(allSubscribers.length / PAGINATION_PARAMS.limit);
    // otherwise store pagination params in localstorage
    await this.cached.setCache(
      ETH_TRACKER_CACHE_KEY,
      JSON.stringify({
        ...PAGINATION_PARAMS,
        totalPages,
      }),
    );
  }

  async _getPaginationParams() {
    // simply get the pagination details from the cache
    const unparsedParams = await this.cached.getCache(ETH_TRACKER_CACHE_KEY);
    const params = JSON.parse(unparsedParams);
    const offset = (params.currentPage - 1) * params.limit;
    return { ...params, offset };
  }

  async _increasePaginationParams() {
    // simply get the pagination details from the cache
    const params = JSON.parse((await this.cached.getCache(ETH_TRACKER_CACHE_KEY)) || JSON.stringify({ empty: true }));

    let { currentPage, totalPages, empty } = params;
    // increment the current page, and if we have gone though all pages
    // restart the counter

    if (empty || currentPage + 1 > totalPages) return this._initPaginationParams(true);
    await this.cached.setCache(
      ETH_TRACKER_CACHE_KEY,
      JSON.stringify({
        ...params,
        currentPage: currentPage + 1,
      }),
    );
  }

  // Fetch balance of every subscriber of the channel
  async _fetchETHBalances(overrideSubscribers = false) {
    if (overrideSubscribers && typeof overrideSubscribers !== 'boolean') return { allBalances: overrideSubscribers };
    let allSubscribers = await this.getChannelSubscribers();
    this.log({
      allSubscribers,
    });
    const { limit, offset, currentPage, totalPages } = await this._getPaginationParams();
    const start = offset;
    const end = offset + limit;
    this.log({
      start,
      end,
      limit,
      currentPage,
      totalPages,
    });
    const duplicateSelectedSubscribers = allSubscribers.slice(start, end).map((addr: string) => addr.toLowerCase());
    const selectedSubscribers = [...new Set(duplicateSelectedSubscribers)];
    const allSubscribersSavedBalance = await ethTrackerModel.find({ _id: { $in: selectedSubscribers } });

    // @dev need to get provider, and tis function returns it
    // @dev so i have to call this with dummy parameters just so ican get a provider returned
    const { provider } = await this.getContract('0x', ERC20ABI);

    //@dev this call takes about 2 minutes to complete for a batch of 500 users
    const allBalances = await Promise.all(
      selectedSubscribers.map(async (addr: string) => {
        // get the balance from db and compare with live balance
        const rawBalance = await provider.getBalance(addr);
        const balance = +ethers.utils.formatEther('' + rawBalance);
        const foundUser =
          allSubscribersSavedBalance.find((userAndBalalnce: any) => userAndBalalnce._id === addr) ||
          DEFAULT_BALANCE_OBJECT;
        const delta = balance - foundUser.balance;
        // calculate the difference
        return ({ address: addr, balance, delta});
      }),
    );

    return { allBalances };
  }

  async _addtoDB(address: string, balance: number, lastDelta: number) {
    await ethTrackerModel.findOneAndUpdate(
      {
        _id: address,
      },
      { _id: address, balance, lastDelta },
      {
        upsert: true,
      },
    );
  }

  async _notifyUser(address: string, balance: number, delta: number, simulate = null) {
    // deal with tx override
    const txOverride =
      typeof simulate == 'object'
        ? simulate?.hasOwnProperty('txOverride')
          ? simulate?.hasOwnProperty('txOverride')
          : false
        : false;
    address = txOverride && simulate.txOverride.mode ? simulate.txOverride.recipientAddr : address;
    // deal with tx override
    const notificationType = 3;
    const action = delta < 0 ? `initiated an ETH Transfer` : `recieved an ETH Deposit`;

    const title = `You have ${action}`;
    // const message = `your new Balance is ${balance} ETH`;
    const message = `You have ${action} of ${Math.abs(delta).toFixed(4).replace(/0+$/, '')} ETH`;
    // @dev maybe we might want ti include balance.
    const cta = `https://etherscan.io/address/${address}`;

    return this.sendNotification({
      title,
      payloadTitle: title,
      message: message,
      payloadMsg: message,
      notificationType,
      simulate,
      image: null,
      cta,
      recipient: address,
    });

  }

  // send notifications to users with delta > 0
  async _sendNotificationsToUsers(userObject: { address: string; balance: number; delta: number }[],status:Boolean ,simulate: any) {
    const recipients = userObject.filter((oneUser) => Boolean(oneUser.delta));
    const sentNotification = await Promise.all(
      recipients.map((recipient) => {
        const { address, balance, delta } = recipient;
        // save user to db
        this._addtoDB(address, balance, delta);
        // send notif
        if(!status){
          console.log("I wil notify")
        const res = this._notifyUser(address, balance, delta, simulate);
        return res;
        }else{
          console.log("I will not notify")
          return null;
        }
      }),
    );

    return { sentNotification, recipients };
  }

  capitalizeEveryWordLetter(str: string[]) {
    const updateStr = str.map((word) => {
      if (/^[a-zA-Z]$/.test(word.charAt(0))) {
        if (!(word === 'on' || word === 'out' || word === 'in' || word === 'for' || word === 'of')) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        } else return word;
      }
    });
    return updateStr.join(' ');
  }

  public async sendNotificationHelper(
    title: string,
    message: string,
    payloadMsg: string,
    cta: string,
    ownerAddress: any,
  ) {

    const provider = new ethers.providers.JsonRpcProvider(
      settings.providerUrl
    );
    const signer = new ethers.Wallet(
      keys.PRIVATE_KEY_NEW_STANDARD.PK,
      provider
    );
    const userAlice = await PushAPI.initialize(signer, {
      env: CONSTANTS.ENV.STAGING,
    });

    try {
      this.logInfo(`Sending Notification for ${ownerAddress} at [${Date.now()}] Text : ${message}`);
      message = message + `[timestamp: ${Math.floor(Date.now() / 1000)}]`;
      const overrideAddress = "Override Any address";
      try {
        const sendNotifRes = await userAlice.channel.send([`${ownerAddress}`], {
          notification: {
            title: title,
            body: message,
          },
          payload: { title: title, body: payloadMsg, cta: cta },
          channel: settings.channelAddress,
        });
      } catch (e) {
        this.logInfo(`Error sending notification ${message} for ${ownerAddress}: ${e.message}`);
      }
    } catch (e) {
      this.logInfo(`Error sending notification ${message} for ${ownerAddress}: ${e.message}`);
    }
  }
}
