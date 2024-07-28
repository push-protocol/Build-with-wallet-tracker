import { Logger } from "winston";
import Container, { Inject, Service } from "typedi";
import PushCoreAbi from "./abi/pushCore.json";
import yieldFarmingLPAbi from "./abi/yieldFarming.json";
import { BigNumber } from "@ethersproject/bignumber";
import { EPNSChannel } from "../../helpers/epnschannel";
import config from "../../config";
import { ethers } from "ethers";
import { CovalentClient } from "@covalenthq/client-sdk";
import { user, CONSTANTS, PushAPI } from "@pushprotocol/restapi";
import keys from "./walletTrackerKeys";
import settings from "./walletTrackerSettings.json";
import { userDataModel, blockNumberModel } from "./walletTrackerModel";
import axios from "axios";
import moment from "moment";
import { Alchemy, Network } from "alchemy-sdk";

const ALL_ERC20_TOKENS = [
  "0xf418588522d5dd018b425e472991e52ebbeeeeee",
  "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0",
]; //push, matic
const WALLET_TRACKER_KEY = "WALLET_TRACKER_KEY";

@Service()
export default class WallettrackerChannel extends EPNSChannel {
  model: any;
  constructor(
    @Inject("logger") public logger: Logger,
    @Inject("cached") public cached
  ) {
    super(logger, {
      networkToMonitor: config.web3MainnetNetwork,
      dirname: __dirname,
      name: "WalletTracker",
      url: "https://push.org/",
      useOffChain: true,
    });
    this.model = require("./walletTrackerModel").default;
  }

// ***************************************************************
// ///////////////// EXISTING FEATURES HERE //////////////////////
// ***************************************************************

  async fetchPortolio() {
    const client = new CovalentClient(settings.covalentApiKey);
    const provider = new ethers.providers.JsonRpcProvider(
      config.web3TestnetSepoliaProvider || settings.providerUrl
    );

    const signer = new ethers.Wallet(
      keys.PRIVATE_KEY_NEW_STANDARD.PK,
      provider
    );
    const userAlice = await PushAPI.initialize(signer, {
      env: CONSTANTS.ENV.STAGING,
    });
    let currentBlockNumber = await axios.get(
      `https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${settings.etherscanApiKey}`
    );
    let i = 1;

    while (true) {
      const userData: any = await userAlice.channel.subscribers({
        page: i,
        limit: 15,
        channel: "0x0f0aE1ceEBc4b5aB14A47202eD6A52D3ef698b5B",
      });
      if (userData.itemcount != 0) {
        userData.subscribers.map(async (user) => {
          const resp =
            await client.BalanceService.getTokenBalancesForWalletAddress(
              "eth-mainnet",
              user
            );
          let amount = 0;
          let pushStatus = false;
          let pushAmount = 0;
          if (!resp.error) {
            let items = resp.data.items;
            //calculate total potfolio balance
            items.map((item: any) => {
              let tokenBalance = Number(
                ethers.utils.formatUnits(item.balance, item.contract_decimals)
              ).toFixed(4);
              if (item.quote_rate * Number(tokenBalance) > 0.5) {
                tokenBalance = tokenBalance.replace(/\.?0+$/, "");
                amount = Number(
                  amount + item.quote_rate * Number(tokenBalance)
                );
                if (item.contract_ticker_symbol == "PUSH") {
                  pushStatus = true;
                  pushAmount = Number(tokenBalance);
                }
              }
            });
            if (pushStatus == true) {
              let cta = `https://app.push.org/yieldv2`;
              this.calculateWalletPerformance(
                amount,
                user,
                cta,
                pushStatus,
                pushAmount,
                currentBlockNumber
              );
              pushStatus = false;
              pushAmount = 0;
            } else {
              let cta = `https://app.push.org/`;
              this.calculateWalletPerformance(
                amount,
                user,
                cta,
                false,
                0,
                currentBlockNumber
              );
            }
          }
        });
        i++;
      } else {
        i = 1;
        break;
      }
    }
  }

  async fetchBalance() {
    try {
      const client = new CovalentClient(settings.covalentApiKey);
      const title = `Portfolio`;
      const message = `Here comes your portfolio insight!`;
      let cta;
      this.logInfo("1---Fetch Balance called----1");
      // Initializing userAlice
      const provider = new ethers.providers.JsonRpcProvider(
        config.web3TestnetSepoliaProvider || settings.providerUrl
      );

      const signer = new ethers.Wallet(
        keys.PRIVATE_KEY_NEW_STANDARD.PK,
        provider
      );
      const userAlice = await PushAPI.initialize(signer, {
        env: CONSTANTS.ENV.STAGING,
      });
      let i = 1;

      while (true) {
        const userData: any = await userAlice.channel.subscribers({
          page: i,
          limit: 15,
          channel: "0x0f0aE1ceEBc4b5aB14A47202eD6A52D3ef698b5B",
        });
        if (userData.itemcount != 0) {
          userData.subscribers.map(async (user) => {
            const resp =
              await client.BalanceService.getTokenBalancesForWalletAddress(
                "eth-mainnet",
                user
              );
            let amount = 0;
            let payloadMsg = "";
            let amtStatus = false;
            let items;
            if (!resp.error) {
              items = resp.data.items;

              items.map(async (item: any) => {
                let tokenBalance = Number(
                  ethers.utils.formatUnits(item.balance, item.contract_decimals)
                ).toFixed(4);
                amount = Number(
                  amount + item.quote_rate * Number(tokenBalance)
                );
                if (
                  item.quote_rate * Number(tokenBalance) > 0.5 &&
                  payloadMsg.length <= 335
                ) {
                  tokenBalance = tokenBalance.replace(/\.?0+$/, "");
                  payloadMsg += `${
                    item.contract_ticker_symbol
                  } : ${tokenBalance} ~ $${(
                    item.quote_rate * Number(tokenBalance)
                  ).toFixed(2)}\n`;

                  if (payloadMsg.length >= 335) {
                    if (amtStatus == false) {
                      cta = `https://etherscan.io/address/${user}`;
                      let msg =
                        `<span color='#457b9d'>Portfolio balance</span>: <span color='#e76f51'>$${amount.toFixed(
                          2
                        )}</span>\n\n` +
                        payloadMsg +
                        `[timestamp: ${Math.floor(Date.now() / 1000)}]`;
                      amtStatus = true;

                      payloadMsg = "";
                      const sendNotifRes = await userAlice.channel.send(
                        [`${user}`],
                        {
                          notification: { title: title, body: message },
                          payload: { title: title, body: msg, cta: cta },
                          channel: "0x0f0aE1ceEBc4b5aB14A47202eD6A52D3ef698b5B",
                        }
                      );
                    } else {
                      cta = `https://etherscan.io/address/${user}`;
                      let msg =
                        payloadMsg +
                        `[timestamp: ${Math.floor(Date.now() / 1000)}]`;
                      amtStatus = true;
                      payloadMsg = "";

                      const sendNotifRes = await userAlice.channel.send(
                        [`${user}`],
                        {
                          notification: { title: title, body: message },
                          payload: { title: title, body: msg, cta: cta },
                          channel: "0x0f0aE1ceEBc4b5aB14A47202eD6A52D3ef698b5B",
                        }
                      );
                    }
                  }
                }
              });
              cta = `https://etherscan.io/address/${user}`;
              if (payloadMsg != "" && amount > 0) {
                if (amtStatus == false) {
                  let msg =
                    `<span color='#457b9d'>Portfolio balance</span>: <span color='#e76f51'>$${amount.toFixed(
                      2
                    )}</span>\n\n` +
                    payloadMsg +
                    `[timestamp: ${Math.floor(Date.now() / 1000)}]`;

                  payloadMsg = "";

                  const sendNotifRes = await userAlice.channel.send(
                    [`${user}`],
                    {
                      notification: { title: title, body: message },
                      payload: { title: title, body: msg, cta: cta },
                      channel: "0x0f0aE1ceEBc4b5aB14A47202eD6A52D3ef698b5B",
                    }
                  );
                } else {
                  let msg =
                    payloadMsg +
                    `[timestamp: ${Math.floor(Date.now() / 1000)}]`;

                  payloadMsg = "";

                  const sendNotifRes = await userAlice.channel.send(
                    [`${user}`],
                    {
                      notification: { title: title, body: message },
                      payload: { title: title, body: msg, cta: cta },
                      channel: "0x0f0aE1ceEBc4b5aB14A47202eD6A52D3ef698b5B",
                    }
                  );
                }
              }
            } else {
              this.logError(resp.error_message);
            }
          });
          i++;
        } else {
          i = 1;
          break;
        }
      }
    } catch (error) {
      this.logError("Error in LogInfo" + error);
    }
  }

  async calculateWalletPerformance(
    currentBalance: number,
    userAddress: string,
    cta: string,
    pushStatus: boolean,
    pushAmount,
    currentBlockNumber: any
  ) {
    const title = `Portfolio`;
    const message = `Here comes your portfolio insight!`;
    let payloadMsg = "";

    this.logInfo("2----Calculating Wallet Performance----2");
    try {
      const prevBalance =
        (await userDataModel.findOne({ _id: userAddress })) ||
        (await userDataModel.create({
          address: userAddress,
          balance: currentBalance,
          _id: userAddress,
        }));
      const prevBal: any = prevBalance?.balance;
      const diff = Number(currentBalance) - prevBal;
      const percentageChange = Math.round((diff / prevBal) * 100);
      //  this.logInfo("User Address", userAddress,"Previous Balance",prevBal,"Current Balance",currentBalance,"percentage Change",percentageChange);

      payloadMsg = `<span color='#457b9d'>Portfolio balance</span>: <span color='#e76f51'>$${currentBalance.toFixed(
        2
      )}</span>\n\n`;
      if (percentageChange > 0) {
        payloadMsg += `Anon, your portfolio's on the rise! Up <span color="#40916c">${
          percentageChange > 200 ? 10 : percentageChange
        }%</span> — sweet gains!\n`;
      } else if (percentageChange == 0) {
        payloadMsg += `Steady as its goes, Anon! Your portfolio hasn't budged an inch this week.\n`;
      } else if (percentageChange < 0) {
        payloadMsg += `Anon, it's a dip, not a dive! Your portfolio's down by <span color="#e63946">${percentageChange}%</span> — time to rally!\n`;
      }
      await userDataModel.findOneAndUpdate(
        { _id: userAddress },
        { balance: currentBalance }
      );

      //Set Contracts
      const uniAbi = [
        "function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)",
      ];
      const pushBalanceOfAbi = [
        "function balanceOf(address token) view returns (uint256)",
      ];
      const sharedABI = [
        "function balanceOf(address user, address token) view returns (uint256)",
        "function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)",
        "function userFeesInfo(address user) view returns(uint256,uint256,uint256,uint256)",
      ];
      const epnsLpABI = ["function totalSupply() view returns (uint256)"];
      let pushCore = await this.getContract(
        `${settings.pushCoreContract}`,
        JSON.stringify(PushCoreAbi)
      );
      let yieldFarmingLpContract = await this.getContract(
        `${settings.yieldFarmingContract}`,
        JSON.stringify(yieldFarmingLPAbi)
      );
      let uniContract = await this.getContract(
        `${settings.uniswapRouterV2}`,
        uniAbi
      );
      let epnsLpContract = await this.getContract(
        `${settings.pushLPTokenAddr}`,
        epnsLpABI
      );
      let pushtokenContract = await this.getContract(
        `${settings.pushTokenAddr}`,
        pushBalanceOfAbi
      );
      let wethtokenContract = await this.getContract(
        `${settings.WETHAddress}`,
        pushBalanceOfAbi
      );
      //Fixed Variables
      const Annualreward = settings.annualRewards;
      const totalStaked = await pushCore?.contract.totalStakedAmount();
      //Push Token Staking APR
      let PushApr: any = ((Annualreward / totalStaked) * 100 * 1e18).toFixed(2);
      //Uni LP Staking APR
      const Gen = settings.genisisEpocAmount;
      const Dep = settings.DeprecationPerEpoch;
      const genisisEpoc = settings.genisisEpoc;
      let epocId = await pushCore?.contract.lastEpochRelative(
        genisisEpoc,
        currentBlockNumber.data.result
      );
      let CurrentEpochReward = Gen - Dep * Number(epocId);

      const NUM_MONTHS = 12;
      let annualRewards = CurrentEpochReward;
      for (let i = epocId.toNumber(); i < epocId.toNumber() + NUM_MONTHS; i++) {
        annualRewards += CurrentEpochReward - Dep * i;
      }

      let poolBalance = await yieldFarmingLpContract?.contract.getEpochPoolSize(
        settings.pushLPTokenAddr,
        epocId + 1
      );
      poolBalance =
        poolBalance.div(BigNumber.from(10).pow(BigNumber.from(10))).toNumber() /
        100000000;
      // 6 months push staked
      let pushPrice = await uniContract?.contract.getAmountsOut(
        "1000000000000000000",
        [settings.pushTokenAddr, settings.WETHAddress, settings.USDTAddress]
      );
      let wethPrice = await uniContract?.contract.getAmountsOut(
        "1000000000000000000",
        [settings.WETHAddress, settings.USDTAddress]
      );

      pushPrice = pushPrice[2].toNumber() / 1e6;
      wethPrice = wethPrice[1].toNumber() / 1e6;

      let lpTotalSupply = await epnsLpContract?.contract.totalSupply();
      lpTotalSupply =
        lpTotalSupply
          .div(BigNumber.from(10).pow(BigNumber.from(10)))
          .toNumber() / 100000000;

      let pushAmountReserve = await pushtokenContract?.contract.balanceOf(
        settings.pushLPTokenAddr
      );
      let wethAmountReserve = await wethtokenContract?.contract.balanceOf(
        settings.pushLPTokenAddr
      );

      pushAmountReserve =
        pushAmountReserve
          .div(BigNumber.from(10).pow(BigNumber.from(10)))
          .toNumber() / 100000000;
      wethAmountReserve =
        wethAmountReserve
          .div(BigNumber.from(10).pow(BigNumber.from(10)))
          .toNumber() / 100000000;

      const uniLpPrice =
        (pushAmountReserve * pushPrice + wethAmountReserve * wethPrice) /
        lpTotalSupply;

      const lpToPushRatio = uniLpPrice / pushPrice;

      const uniLpApr = (poolBalance / lpToPushRatio).toFixed(2);
      //Trigger Notification
      await userDataModel.findOneAndUpdate(
        { _id: userAddress, userAddress: userAddress },
        { balance: currentBalance }
      );
      const provider = new ethers.providers.JsonRpcProvider(
        config.web3TestnetSepoliaProvider || settings.providerUrl
      );

      const signer = new ethers.Wallet(
        keys.PRIVATE_KEY_NEW_STANDARD.PK,
        provider
      );
      const userAlice = await PushAPI.initialize(signer, {
        env: CONSTANTS.ENV.STAGING,
      });

      payloadMsg += `$PUSH Staking APR: <span color="#40916c">${PushApr}%</span>\n`;
      payloadMsg += `PUSH-WETH UNISWAP LP Token Staking APR: <span color="#40916c">${uniLpApr}%</span>\n`;

      if (pushStatus == true) {
        let pushTokens = (pushAmount * (PushApr / 100)) / 2;
        let yeild = pushAmount + pushTokens;
        payloadMsg +=
          `You have : ${pushAmount.toFixed(
            2
          )} $PUSH, If you stake it for 6 months it will be <span color="#40916c"> ${yeild.toFixed(
            2
          )}</span> at ${PushApr}% APR` + "\n";
      }
      payloadMsg = payloadMsg + `[timestamp: ${Math.floor(Date.now() / 1000)}]`;

      const sendNotifRes = await userAlice.channel.send([`${userAddress}`], {
        notification: { title: title, body: message },
        payload: { title: title, body: payloadMsg, cta: cta },
        channel: "0x0f0aE1ceEBc4b5aB14A47202eD6A52D3ef698b5B",
      });
    } catch (err) {
      this.logError(`Error in calculating wallet performance ${err}`);
    }
  }

  // send events function
  async sendEventInfo() {
    const client = new CovalentClient(settings.covalentApiKey);

    // Initlaize user Alice
    const provider = new ethers.providers.JsonRpcProvider(settings.providerUrl);
    const signer = new ethers.Wallet(
      keys.PRIVATE_KEY_NEW_STANDARD.PK,
      provider
    );
    const userAlice = await PushAPI.initialize(signer, {
      env: CONSTANTS.ENV.STAGING,
    });
    let i = 1;

    while (true) {
      const userData: any = await userAlice.channel.subscribers({
        page: i,
        limit: 15,
        channel: "0x0f0aE1ceEBc4b5aB14A47202eD6A52D3ef698b5B",
      });
      if (userData.itemcount != 0) {
        userData.subscribers.map(async (user) => {
          // get all tokens held by a user
          const resp =
            await client.BalanceService.getTokenBalancesForWalletAddress(
              "eth-mainnet",
              user
            );
          let tokensHolding = [];
          if (!resp.error) {
            let items = resp.data.items;

            items.map((item: any) => {
              const balance = item.balance;
              const symbol = item.contract_ticker_symbol;
              if (balance !== "0" && symbol !== null) {
                tokensHolding.push(symbol);
              }
            });

            // get all token IDs from Coindar
            let response: any = await axios.get(
              `https://coindar.org/api/v2/coins?access_token=${settings.coindarApiKey}`
            );
            const coins = response.data;

            // add coinIds for a user for all tokens he holds
            const symbolSet = new Set();
            const coinIds = coins
              .filter((coin) => {
                if (
                  tokensHolding.includes(coin.symbol) &&
                  !symbolSet.has(coin.symbol)
                ) {
                  symbolSet.add(coin.symbol);
                  return true;
                }
                return false;
              })
              .map((coin) => coin.id);

            // initiliaze today and tomorrow date for fetching events with 24h interval
            const todayDate = moment().format("YYYY-MM-DD");
            const tomorrowDate = moment().add(1, "days").format("YYYY-MM-DD");

            // @dev: use this for testing
            // response = await axios.get(
            //   `https://coindar.org/api/v2/events?access_token=${settings.coindarApiKey}&filter_date_start=2024-02-01&filter_date_end=2024-05-14&filter_coins=${coinIds}&sort_by=views&order_by=1`,
            // );

            response = await axios.get(
              `https://coindar.org/api/v2/events?access_token=${settings.coindarApiKey}&filter_date_start=${todayDate}&filter_date_end=${tomorrowDate}&filter_coins=${coinIds}&sort_by=views&order_by=1`
            );

            const events = response.data;

            // map events found for one user and send a notificiation one by one
            events.map(async (event) => {
              //format title and body
              const words = event.source.split("-");
              let urlParts = words[0].split("/");
              let lastPart = urlParts[urlParts.length - 1];
              words[0] = lastPart;
              const titleArr = words.slice(0, words.length - 1);
              const formattedTitle = this.capitalizeEveryWordLetter(titleArr);

              // find relative time
              const eta = moment(
                event.date_start,
                "YYYY-MM-DD HH:mm"
              ).fromNow();
              let etaMessage = "";
              if (eta.indexOf("ago")) {
                etaMessage = "Ended " + eta;
              } else {
                etaMessage = "Starts in " + eta;
              }

              // send notif
              const sendNotif = await userAlice.channel.send([user], {
                notification: {
                  title: `${event.caption}`,
                  body: `${formattedTitle}`,
                },
                payload: {
                  title: event.caption,
                  body: `<span color='#457b9d'><strong>Event: </strong></span>${formattedTitle}\n\n${etaMessage}`,
                  cta: event.source,
                },
                channel: "0x0f0aE1ceEBc4b5aB14A47202eD6A52D3ef698b5B",
              });
            });
          }
        });
        i++;
      } else {
        i = 1;
        break;
      }
    }
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

  async sendWalletTransactions() {
    const localconfig = {
      apiKey: settings.alchemyApiKey,
      network: Network.ETH_MAINNET,
    };
    const alchemy = new Alchemy(localconfig);
    const provider = new ethers.providers.JsonRpcProvider(settings.providerUrl);

    const signer = new ethers.Wallet(
      keys.PRIVATE_KEY_NEW_STANDARD.PK,
      provider
    );
    const userAlice = await PushAPI.initialize(signer, {
      env: CONSTANTS.ENV.STAGING,
    });
    // Address we want get NFT mints from
    let i = 1;
    const blockNumberLocal = await provider.getBlockNumber();
    const lastBlockNumber =
      (await blockNumberModel.findOne({ _id: "BLOCK_NUMBER" })) ||
      (await blockNumberModel.create({
        blockNumber: blockNumberLocal,
        _id: "BLOCK_NUMBER",
      }));
    let hexBlockNumber = ethers.utils
      .hexlify(Number(lastBlockNumber.blockNumber))
      .toString();

    while (true) {
      const userData: any = await userAlice.channel.subscribers({
        page: i,
        limit: 15,
        channel: "0x0f0aE1ceEBc4b5aB14A47202eD6A52D3ef698b5B",
      });

      try {
        if (userData.itemcount != 0) {
          let subs = userData.subscribers;
          let msg = "";
          for (let j = 0; j < subs.length; j++) {
            let res = await alchemy.core.getAssetTransfers({
              fromBlock: hexBlockNumber,
              fromAddress: subs[j],
              excludeZeroValue: true,
              category: ["external", "erc20", "erc721", "erc1155"],
            });
            let data = res.transfers;
            for (let j = 0; j < data.length; j++) {
              let to1 = data[j].to.substring(0, 4);
              let to2 = data[j].to.substring(38, 42);
              msg =
                msg +
                `<span color='#457b9d'>${data[j].value.toFixed(3)} ${
                  data[j].asset
                }</span> sent to ${to1}...${to2}\n`;
              if (msg.length >= 335) {
                let cta = `https://etherscan.io/address/${subs[j]}`;
                msg = msg + `[timestamp: ${Math.floor(Date.now() / 1000)}]`;
                const sendNotifRes = await userAlice.channel.send(
                  [`${subs[j]}`],
                  {
                    notification: {
                      title: "Asset Transfers",
                      body: "Following assets were transfered from your account",
                    },
                    payload: {
                      title:
                        "Following assets were transfered from your account",
                      body: msg,
                      cta: cta,
                    },
                    channel: "0x0f0aE1ceEBc4b5aB14A47202eD6A52D3ef698b5B",
                  }
                );
                msg = "";
              }
            }
            if (msg != "") {
              let cta = `https://etherscan.io/address/${subs[j]}`;
              msg = msg + `[timestamp: ${Math.floor(Date.now() / 1000)}]`;
              console.log(
                "**** Wallet Tracker sending Transaction Notifications ****"
              );
              const sendNotifRes = await userAlice.channel.send(
                [`${subs[j]}`],
                {
                  notification: {
                    title: "Asset Transfers",
                    body: "Following assets were transfered from your account",
                  },
                  payload: {
                    title: "Following assets were transfered from your account",
                    body: msg,
                    cta: cta,
                  },
                  channel: "0x0f0aE1ceEBc4b5aB14A47202eD6A52D3ef698b5B",
                }
              );
            }
          }
          i++;
        } else {
          await blockNumberModel.findByIdAndUpdate(
            { _id: "BLOCK_NUMBER" },
            { blockNumber: Number(blockNumberLocal) }
          );
          i = 1;
          break;
        }
      } catch (e) {
        this.logError("Error in sending Transaction Notifications" + e);
      }
    }
  }

// ***************************************************************
// //////////////// CONTRIBUTIONS STARTS HERE ////////////////////
// ***************************************************************
}
