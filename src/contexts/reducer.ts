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

import type {
  AddressMap,
  BalanceMap,
  TransactionMap,
  Wallet,
} from '../services/wdk-service/types';
import getBalancesFromBalanceMap from '../utils/get-balances-from-balance-map';
import getTransactionsFromTransactionMap from '../utils/get-transactions-from-transaction-map';
import type { WalletContextState } from './types';
import { WALLET_CONTEXT_INITIAL_STATE } from './constants';

type WalletAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_WALLET'; payload: Wallet }
  | { type: 'SET_ADDRESSES'; payload: AddressMap }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_UNLOCKED'; payload: boolean }
  | { type: 'SET_BALANCES'; payload: BalanceMap }
  | { type: 'SET_TRANSACTIONS'; payload: TransactionMap }
  | { type: 'SET_LOADING_BALANCES'; payload: boolean }
  | { type: 'SET_LOADING_TRANSACTIONS'; payload: boolean }
  | { type: 'CLEAR_WALLET' };

// Reducer
function reducer(
  state: WalletContextState,
  action: WalletAction
): WalletContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'SET_WALLET':
      return {
        ...state,
        wallet: action.payload,
      };

    case 'SET_ADDRESSES':
      return {
        ...state,
        addresses: action.payload,
      };

    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };

    case 'SET_UNLOCKED':
      return { ...state, isUnlocked: action.payload };

    case 'SET_BALANCES':
      const balances = getBalancesFromBalanceMap(action.payload);

      return {
        ...state,
        balances: {
          ...state.balances,
          list: balances,
          map: action.payload,
        },
      };

    case 'SET_TRANSACTIONS':
      const transactions = getTransactionsFromTransactionMap(action.payload);

      return {
        ...state,
        transactions: {
          ...state.transactions,
          list: transactions,
          map: action.payload,
        },
      };

    case 'SET_LOADING_BALANCES':
      return {
        ...state,
        balances: { ...state.balances, isLoading: action.payload },
      };

    case 'SET_LOADING_TRANSACTIONS':
      return {
        ...state,
        transactions: { ...state.transactions, isLoading: action.payload },
      };

    case 'CLEAR_WALLET':
      return {
        ...WALLET_CONTEXT_INITIAL_STATE,
        // Keep isInitialized true since WDK worklets remain active
        isInitialized: state.isInitialized,
      };

    default:
      return state;
  }
}

export default reducer;
