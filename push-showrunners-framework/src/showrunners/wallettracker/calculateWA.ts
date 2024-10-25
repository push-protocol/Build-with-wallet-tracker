import PushCoreAbi from './abi/pushCore.json';
import yieldFarmingLPAbi from './abi/yieldFarming.json';
import { BigNumber } from '@ethersproject/bignumber';
import wtChannel from './wallettrackerChannel';
import { Container } from 'typedi';

import { ethers } from 'ethers';
import {CONSTANTS, PushAPI } from '@pushprotocol/restapi';
import {keys} from './wallettrackerKeys';
import {settings} from './wallettrackerSettings';
import { userDataModel } from './wallettrackerModel';

export async function calculateWalletPerformance(currentBalance: number, userAddress: string, cta: string, pushStatus: boolean, pushAmount, currentBlockNumber: any){
    const channel = Container.get(wtChannel);
    const title = `Portfolio`;
    const message = `Here comes your portfolio insight!`;
    let payloadMsg = '';
    
    channel.logInfo("2----Calculating Wallet Performance----2");
    try {
      const prevBalance = await userDataModel.findOne({ _id: userAddress }) ||
        (await userDataModel.create({ address: userAddress, balance: currentBalance, _id: userAddress }));
      const prevBal: any = prevBalance?.balance;
      const diff = Number(currentBalance) - prevBal;
      const percentageChange = Math.round(((diff / prevBal)) * 100);
      channel.logInfo(`User Address : ${userAddress}, Previous Balance: ${prevBal}, Current Balance: ${currentBalance}, percentage Change: ${percentageChange}`);

      payloadMsg = `<span color='#457b9d'>Portfolio balance</span>: <span color='#e76f51'>$${currentBalance.toFixed(2)}</span>\n\n`;
      if (percentageChange > 0) {
        payloadMsg += `Anon, your portfolio's on the rise! Up <span color="#40916c">${percentageChange > 200 ? 10 : percentageChange}%</span> — sweet gains!\n`;
      } else if (percentageChange == 0) {
        payloadMsg += `Steady as its goes, Anon! Your portfolio hasn't budged an inch channel week.\n`
      } else if (percentageChange < 0) {
        payloadMsg += `Anon, it's a dip, not a dive! Your portfolio's down by <span color="#e63946">${percentageChange}%</span> — time to rally!\n`;
      }
      await userDataModel.findOneAndUpdate({ _id: userAddress }, { balance: currentBalance });

      //Set Contracts
      const uniAbi = ['function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)'];
      const pushBalanceOfAbi = ['function balanceOf(address token) view returns (uint256)'];
      const sharedABI = [
        'function balanceOf(address user, address token) view returns (uint256)',
        'function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)',
        'function userFeesInfo(address user) view returns(uint256,uint256,uint256,uint256)'
      ];
      const epnsLpABI = ['function totalSupply() view returns (uint256)'];
      let pushCore = await channel.getContract(`${settings.pushCoreContract}`, JSON.stringify(PushCoreAbi));
      let yieldFarmingLpContract = await channel.getContract(`${settings.yieldFarmingContract}`, JSON.stringify(yieldFarmingLPAbi));
      let uniContract = await channel.getContract(`${settings.uniswapRouterV2}`, uniAbi);
      let epnsLpContract = await channel.getContract(`${settings.pushLPTokenAddr}`, epnsLpABI);
      let pushtokenContract = await channel.getContract(`${settings.pushTokenAddr}`, pushBalanceOfAbi);
      let wethtokenContract = await channel.getContract(`${settings.WETHAddress}`, pushBalanceOfAbi);
      //Fixed Variables
      const Annualreward = settings.annualRewards;
      const totalStaked = await pushCore?.contract.totalStakedAmount();
      //Push Token Staking APR
      let PushApr: any = (((Annualreward / totalStaked) * 100) * 1e18).toFixed(2);
      //Uni LP Staking APR
      const Gen = settings.genisisEpocAmount;
      const Dep = settings.DeprecationPerEpoch;
      const genisisEpoc = settings.genisisEpoc;
      let epocId = await pushCore?.contract.lastEpochRelative(genisisEpoc, currentBlockNumber.data.result);
      let CurrentEpochReward = Gen - (Dep * Number(epocId));

      const NUM_MONTHS = 12
      let annualRewards = CurrentEpochReward
      for (let i = epocId.toNumber(); i < epocId.toNumber() + NUM_MONTHS; i++) {
        annualRewards += (CurrentEpochReward - (Dep * i))
      }

      let poolBalance = await yieldFarmingLpContract?.contract.getEpochPoolSize(settings.pushLPTokenAddr, epocId + 1);
      poolBalance = poolBalance.div(BigNumber.from(10).pow(BigNumber.from(10))).toNumber() / 100000000
      // 6 months push staked 
      let pushPrice = await uniContract?.contract.getAmountsOut(
        '1000000000000000000',
        [settings.pushTokenAddr, settings.WETHAddress, settings.USDTAddress]
      );
      let wethPrice = await uniContract?.contract.getAmountsOut(
        '1000000000000000000', [settings.WETHAddress, settings.USDTAddress]
      );

      pushPrice = pushPrice[2].toNumber() / 1e6;
      wethPrice = wethPrice[1].toNumber() / 1e6;


      let lpTotalSupply = await epnsLpContract?.contract.totalSupply();
      lpTotalSupply = lpTotalSupply.div(BigNumber.from(10).pow(BigNumber.from(10))).toNumber() / 100000000

      let pushAmountReserve = await pushtokenContract?.contract.balanceOf(settings.pushLPTokenAddr);
      let wethAmountReserve = await wethtokenContract?.contract.balanceOf(settings.pushLPTokenAddr);

      pushAmountReserve = pushAmountReserve.div(BigNumber.from(10).pow(BigNumber.from(10))).toNumber() / 100000000
      wethAmountReserve = wethAmountReserve.div(BigNumber.from(10).pow(BigNumber.from(10))).toNumber() / 100000000

      const uniLpPrice =
        (pushAmountReserve * pushPrice + wethAmountReserve * wethPrice) /
        lpTotalSupply;

      const lpToPushRatio = uniLpPrice / pushPrice;

      const uniLpApr = (poolBalance / lpToPushRatio).toFixed(2);
      //Trigger Notification 
      await userDataModel.findOneAndUpdate({ _id: userAddress, userAddress: userAddress }, { balance: currentBalance });
      const provider = new ethers.providers.JsonRpcProvider(settings.providerUrl);

      const signer = new ethers.Wallet(keys.PRIVATE_KEY_NEW_STANDARD.PK, provider);
      const userAlice = await PushAPI.initialize(signer, { env: CONSTANTS.ENV[process.env.SHOWRUNNERS_ENV] });

      payloadMsg += `$PUSH Staking APR: <span color="#40916c">${PushApr}%</span>\n`;
      payloadMsg += `PUSH-WETH UNISWAP LP Token Staking APR: <span color="#40916c">${uniLpApr}%</span>\n`;

      if (pushStatus == true) {
        let pushTokens = (pushAmount * (PushApr / 100)) / 2;
        let yeild = pushAmount + pushTokens;
        payloadMsg += `You have : ${pushAmount.toFixed(2)} $PUSH, If you stake it for 6 months it will be <span color="#40916c"> ${yeild.toFixed(2)}</span> at ${PushApr}% APR` + '\n';
      }
      payloadMsg = payloadMsg + `[timestamp: ${Math.floor(Date.now() / 1000)}]`;

      channel.logInfo(`Sending Wallet Performance Notification : ${userAddress} : ${payloadMsg}`);
    channel.sendNotificationHelper(title, message, payloadMsg, cta, userAddress);
      
    } catch (err) {
      channel.logInfo(`Error in calculating wallet performance ${err}`);
    }
  }
