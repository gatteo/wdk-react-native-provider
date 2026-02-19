// Copyright 2024 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export enum AssetTicker {
  BTC = 'btc',
  USDT = 'usdt',
  XAUT = 'xaut',
}

export enum NetworkType {
  SEGWIT = 'bitcoin',
  LIGHTNING = 'lightning',
  ETHEREUM = 'ethereum',
  SOLANA = 'solana',
  TRON = 'tron',
  TON = 'ton',
  POLYGON = 'polygon',
  ARBITRUM = 'arbitrum',
}

export const AssetAddressMap = {
  [AssetTicker.BTC]: {
    [NetworkType.SEGWIT]: 'bitcoin',
  },
  [AssetTicker.USDT]: {
    [NetworkType.ETHEREUM]: 'ethereum',
    [NetworkType.POLYGON]: 'polygon',
    [NetworkType.ARBITRUM]: 'arbitrum',
    [NetworkType.TON]: 'ton',
  },
  [AssetTicker.XAUT]: {
    [NetworkType.ETHEREUM]: 'ethereum',
  },
};

export const AssetBalanceMap = {
  [AssetTicker.BTC]: {
    [NetworkType.SEGWIT]: 'bitcoin',
  },
  [AssetTicker.USDT]: {
    [NetworkType.ETHEREUM]: 'ethereum',
    [NetworkType.POLYGON]: 'polygon',
    [NetworkType.ARBITRUM]: 'arbitrum',
    [NetworkType.TON]: 'ton',
  },
  [AssetTicker.XAUT]: {
    [NetworkType.ETHEREUM]: 'ethereum',
  },
};

export interface Amount {
  denomination: AssetTicker;
  value: string;
  networkType: NetworkType;
}

export interface Wallet {
  id: string;
  name: string;
  enabledAssets: AssetTicker[];
}

export type AddressMap = Partial<Record<NetworkType, string>>;
export type BalanceMap = Record<
  string,
  { balance: number; asset: AssetTicker }
>;
export type TransactionMap = Partial<Record<NetworkType, Transaction[]>>;

export interface Transaction {
  blockchain: string;
  blockNumber: number;
  transactionHash: string;
  transferIndex: number;
  token: string;
  amount: string;
  timestamp: number;
  transactionIndex: number;
  logIndex: number;
  from: string;
  to: string;
}

export interface PaymasterToken {
  address: string;
}

export interface EVMChainConfig {
  chainId: number;
  blockchain: string;
  provider: string;
  bundlerUrl: string;
  paymasterUrl: string;
  paymasterAddress: string;
  entrypointAddress: string;
  transferMaxFee: number;
  swapMaxFee: number;
  bridgeMaxFee: number;
  paymasterToken: PaymasterToken;
  safeModulesVersion?: string;
}

export interface TONChainConfig {
  tonApiClient: {
    url: string;
  };
  tonClient: {
    url: string;
  };
  paymasterToken: PaymasterToken;
  transferMaxFee: number;
}

export interface BitcoinChainConfig {
  host: string;
  port: number;
}

export interface TronChainConfig {
  chainId: number;
  provider: string;
  gasFreeProvider: string;
  apiKey: string;
  apiSecret: string;
  serviceProvider: string;
  verifyingContract: string;
  transferMaxFee: number;
  swapMaxFee: number;
  bridgeMaxFee: number;
  paymasterToken: PaymasterToken;
}

export interface ChainsConfig {
  ethereum?: EVMChainConfig;
  arbitrum?: EVMChainConfig;
  polygon?: EVMChainConfig;
  ton?: TONChainConfig;
  bitcoin?: BitcoinChainConfig;
  tron?: TronChainConfig;
}
