import { Logger } from "winston";
import Container, { Inject, Service } from "typedi";
import ERC20ABI from "./abi/erc20.json";
import PushCoreAbi from "./abi/pushCore.json";
import yieldFarmingLPAbi from "./abi/yieldFarming.json";
import { BigNumber } from "@ethersproject/bignumber";
import { EPNSChannel } from "../../helpers/epnschannel";
import config from "../../config";
import { ethers } from "ethers";
import { CovalentClient } from "@covalenthq/client-sdk";
import { user, CONSTANTS, PushAPI } from "@pushprotocol/restapi";
import { keys } from "./wallettrackerKeys";
import { settings } from "./wallettrackerSettings";
import axios from "axios";
import moment from "moment";
import fs from "fs";
import { fetchPortfolio } from "./fetchPortfolio";
import { fetchBalance } from "./fetchBalance";
import { calculateWalletPerformance } from "./calculateWA";
import { sendEventInfo } from "./eventInfo";
import { checkNewHacks } from "./checkNewHacks";
import { checkNewYieldOpportunities } from "./checkNewYieldOpportunities";
import { checkApprovals } from "./checkApprovals";
import { checkDaoProposals } from "./checkDaoProposals";
import { getFormattedTimestamp } from './getFormattedTimestamp';
const channelAddress = settings.channelAddress;

@Service()
export default class WallettrackerChannel extends EPNSChannel {
  model: any;
  constructor(
    @Inject("logger") public logger: Logger,
    @Inject("cached") public cached
  ) {
    super(logger, {
      networkToMonitor: settings.providerUrl,
      dirname: __dirname,
      name: "Wallet Tracker",
      url: "https://push.org/",
      useOffChain: true,
      address: channelAddress,
    });
    this.model = require("./wallettrackerModel").default;
  }

  async fetchPortolio() {
    fetchPortfolio();
  }

  async fetchBalance() {
    fetchBalance();
  }

  async calculateWalletPerformance(
    currentBalance: number,
    userAddress: string,
    cta: string,
    pushStatus: boolean,
    pushAmount,
    currentBlockNumber: any
  ) {
    calculateWalletPerformance(
      currentBalance,
      userAddress,
      cta,
      pushStatus,
      pushAmount,
      currentBlockNumber
    );
  }

  // send events function
  async sendEventInfo() {
    sendEventInfo();
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
  async checkDaoProposals() {
    checkDaoProposals();
  }

  capitalizeEveryWordLetter(str: string[]) {
    const updateStr = str.map((word) => {
      if (/^[a-zA-Z]$/.test(word.charAt(0))) {
        if (
          !(
            word === "on" ||
            word === "out" ||
            word === "in" ||
            word === "for" ||
            word === "of"
          )
        ) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        } else return word;
      }
    });
    return updateStr.join(" ");
  }

  public async sendNotificationHelper(
    title: string,
    message: string,
    payloadMsg: string,
    cta: string,
    ownerAddress: any
  ) {
    const provider = new ethers.providers.JsonRpcProvider(settings.providerUrl);
    const signer = new ethers.Wallet(
      keys.PRIVATE_KEY_NEW_STANDARD.PK,
      provider
    );
    const userAlice = await PushAPI.initialize(signer, {
      env: CONSTANTS.ENV[process.env.SHOWRUNNERS_ENV],
    });

    try {
      this.logInfo(
        `Sending Notification for ${ownerAddress} at [${Date.now()}] Text : ${message}`
      );
      message = message;
      const overrideAddress = "0x0f0aE1ceEBc4b5aB14A47202eD6A52D3ef698b5B";
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
        this.logInfo(
          `Error sending notification ${message} for ${ownerAddress}: ${e.message}`
        );
      }
    } catch (e) {
      this.logInfo(
        `Error sending notification ${message} for ${ownerAddress}: ${e.message}`
      );
    }
  }

  logToFile(logMessage) {
    const formattedLogMessage =
      `[timestamp: ${getFormattedTimestamp()}] ---- ` + logMessage;
    fs.appendFile(
      "walletTrackerLogs.txt",
      formattedLogMessage + "\n",
      (err) => {
        if (err) {
          console.log(`Error writing to wallet tracker log file: ${err}`);
        }
      }
    );
  }
}
