import { model, Schema } from 'mongoose';

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

export interface blockNumber {
  _id: string;
  blockNumber: string;
}


const blockNumberData = new Schema<blockNumber>({
  _id: {
    type: String,
  },
  blockNumber: {
    type: String,
  },
});

//keps track of user's balance
export const blockNumberModel = model<blockNumber>('walletTrackerBlockDB', blockNumberData);
