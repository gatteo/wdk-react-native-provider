/**
 * Balance fetcher types
 */

import type { TokenConfig, TokenConfigs } from '@tetherto/wdk-rn-worklet'

/**
 * Wallet interface for balance fetching
 * Re-export from wdk-rn-worklet for convenience
 */
export type { Wallet } from '@tetherto/wdk-rn-worklet'

/**
 * Balance store interface
 * Apps must implement this interface to use the balance fetcher
 */
export interface BalanceStore {
  /**
   * Update balance for a specific wallet, network, and token
   */
  updateBalance: (
    accountIndex: number,
    network: string,
    tokenAddress: string | null,
    balance: string
  ) => void

  /**
   * Set loading state for a balance fetch operation
   */
  setBalanceLoading: (
    network: string,
    accountIndex: number,
    tokenAddress: string | null,
    loading: boolean
  ) => void

  /**
   * Update the timestamp of the last balance update
   */
  updateLastBalanceUpdate: (network: string, accountIndex: number) => void

  /**
   * Get all wallets that need balance fetching
   */
  getAllWallets: () => Wallet[]
}

/**
 * Balance fetch result
 */
export interface BalanceFetchResult {
  success: boolean
  network: string
  accountIndex: number
  tokenAddress: string | null
  balance: string | null
  error?: string
}

/**
 * Token config provider
 * Apps can provide token configs directly or through a function
 */
export type TokenConfigProvider = TokenConfigs | (() => TokenConfigs)

/**
 * Token helper functions
 * Apps can provide custom implementations or use the default
 */
export interface TokenHelpers {
  /**
   * Get all tokens for a specific network (native + ERC20)
   */
  getTokensForNetwork: (network: string) => TokenConfig[]

  /**
   * Get all supported networks
   */
  getSupportedNetworks: () => string[]
}

