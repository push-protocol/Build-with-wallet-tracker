import { model, Schema } from 'mongoose';

export interface IWalletTracker {
  _id: String;
  lastBlock: Number;
}

const WalletTrackerSchema = new Schema<IWalletTracker>({
  _id: String,
  lastBlock: Number
});

 export default model<IWalletTracker>('WalletTracker', WalletTrackerSchema);

export interface globalCycleData {
  _id: string;
  lastCycle?: number;
}

const globalDataSchema = new Schema<globalCycleData>({
  _id: {
    type: String,
  },
  lastCycle: {
    type: Number,
  },
});

//keeps track of the cycles
//send wallet performance when cycle value is 2 and then reset it.
export const globalCycleModel = model<globalCycleData>('walletTrackerCycleDB', globalDataSchema);


export interface userWalletTrackerData {
  _id: string;
  address: string;
  balance: number;
}


const userData = new Schema<userWalletTrackerData>({
  _id: {
    type: String,
  },
  address: {
    type: String,
  },
  balance: {
    type: Number,
  },
});

//keps track of user's balance
export const userDataModel = model<userWalletTrackerData>('walletTrackeruserDB', userData);

export interface IethTracker {
  _id: String;
  balance: Number;
  lastDelta: Number
}

const EthTrackerSchema = new Schema<IethTracker>({
  _id: String,
  balance: Number,
  lastDelta: Number
});

export const ethTrackerModel =  model<IethTracker>('Ethtracker', EthTrackerSchema);

export interface HackNewsData {
  _id?: string;
  rektId: string;
}

const hackNewsDataSchema = new Schema<HackNewsData>({
  _id: {
    type: String,
  },
  rektId: {
    type: String,
  }
});

// keep tracks of last know hack
export const hackNewsDataModel = model<HackNewsData>('hackNewsDataDB', hackNewsDataSchema);
