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

// Import polyfills first - these must be loaded before any other code
import './polyfills';

// Export the wallet context and provider
export {
  useWallet,
  default as WalletContext,
  WalletProvider,
} from './contexts/wallet-context';
export type { WalletProviderConfig } from './contexts/types';

// Export WDK service
export {
  WDKService,
  wdkService,
  SMART_CONTRACT_BALANCE_ADDRESSES,
} from './services/wdk-service';

// Export all types
export type { Amount, Transaction, Wallet } from './services/wdk-service/types';

// Export enums (can be used as both types and values)
export {
  AssetAddressMap,
  AssetBalanceMap,
  AssetTicker,
  NetworkType,
} from './services/wdk-service/types';
