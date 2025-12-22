/**
 * WdkAppProvider
 *
 * App-level orchestration provider that composes existing WDK hooks.
 * Manages the complete initialization flow:
 * 1. Start worklet immediately on app open
 * 2. Check if wallet exists
 * 3. Wait for biometric authentication (if required)
 * 4. Initialize/load wallet
 *
 * This provider is generic and reusable - it doesn't know about app-specific
 * concerns like auth state or UI branding.
 */

import React, { createContext, useContext, useEffect, useRef, useState, useMemo, useCallback } from 'react'
import type { SecureStorage } from '@tetherto/wdk-rn-secure-storage'
import type { NetworkConfigs } from '../types'
import { useWorklet } from '../hooks/useWorklet'
import { useWalletSetup } from '../hooks/useWalletSetup'
import { useWallet } from '../hooks/useWallet'

/**
 * Context state exposed to consumers
 */
export interface WdkAppContextValue {
  /** All initialization complete, app is ready */
  isReady: boolean
  /** Initialization in progress */
  isInitializing: boolean
  /** Whether a wallet exists in secure storage (null = checking) */
  walletExists: boolean | null
  /** Waiting for biometric authentication */
  needsBiometric: boolean
  /** Call this after biometric authentication succeeds */
  completeBiometric: () => void
  /** Initialization error if any */
  error: Error | null
  /** Retry initialization after an error */
  retry: () => void
}

const WdkAppContext = createContext<WdkAppContextValue | null>(null)

/**
 * Provider props
 */
export interface WdkAppProviderProps {
  /** Secure storage instance */
  secureStorage: SecureStorage
  /** Network configurations */
  networkConfigs: NetworkConfigs
  /** Whether biometric authentication is required before wallet initialization */
  requireBiometric?: boolean
  /** Child components (app content) */
  children: React.ReactNode
}

/**
 * WdkAppProvider - Orchestrates WDK initialization flow
 *
 * Composes useWorklet and useWalletSetup hooks into a unified initialization flow.
 */
export function WdkAppProvider({
  secureStorage,
  networkConfigs,
  requireBiometric = false,
  children,
}: WdkAppProviderProps) {
  // Track initialization state
  const [hasWalletChecked, setHasWalletChecked] = useState(false)
  const [walletExists, setWalletExists] = useState<boolean | null>(null)
  const [biometricAuthenticated, setBiometricAuthenticated] = useState(!requireBiometric)
  const [initializationError, setInitializationError] = useState<Error | null>(null)
  const [walletInitError, setWalletInitError] = useState<Error | null>(null)

  // Use refs to track initialization attempts without causing re-renders
  const hasAttemptedWorkletInitialization = useRef(false)
  const hasAttemptedWalletInitialization = useRef(false)

  // Worklet hooks
  const {
    isWorkletStarted,
    isInitialized: isWorkletInitialized,
    isLoading: isWorkletLoading,
    startWorklet,
  } = useWorklet()

  // Wallet setup hooks
  const {
    initializeWallet,
    hasWallet,
    isInitializing: isWalletInitializing,
  } = useWalletSetup(secureStorage, networkConfigs)

  // Wallet state hook - to check if wallet is actually initialized
  const { isInitialized: walletInitialized } = useWallet()

  // Initialize worklet immediately when component mounts
  useEffect(() => {
    // If worklet is already initialized, don't do anything
    if (isWorkletInitialized) {
      return
    }

    // Check if worklet is already loading
    if (isWorkletLoading) {
      return
    }

    // Only attempt initialization once per app session
    if (hasAttemptedWorkletInitialization.current) {
      return
    }

    const initializeWorklet = async () => {
      try {
        console.log('[WdkAppProvider] Starting worklet initialization...')
        setInitializationError(null)
        hasAttemptedWorkletInitialization.current = true

        await startWorklet(networkConfigs)
        console.log('[WdkAppProvider] Worklet started successfully')
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        console.error('[WdkAppProvider] Failed to initialize worklet:', error)
        setInitializationError(err)
        // Don't block the app - allow user to proceed even if initialization fails
      }
    }

    initializeWorklet()
  }, [isWorkletInitialized, isWorkletLoading, networkConfigs, startWorklet])

  // Check if wallet exists when worklet is started (not fully initialized yet)
  useEffect(() => {
    if (!isWorkletStarted || hasWalletChecked) {
      return
    }

    let cancelled = false

    const checkWallet = async () => {
      try {
        console.log('[WdkAppProvider] Checking if wallet exists...')
        const walletExistsResult = await hasWallet()
        console.log('[WdkAppProvider] Wallet check result:', walletExistsResult)
        if (!cancelled) {
          setHasWalletChecked(true)
          setWalletExists(walletExistsResult)
        }
      } catch (error) {
        console.error('[WdkAppProvider] Failed to check wallet:', error)
        if (!cancelled) {
          setHasWalletChecked(true)
          setWalletExists(false)
        }
      }
    }

    checkWallet()

    return () => {
      cancelled = true
    }
  }, [isWorkletStarted, hasWalletChecked, hasWallet])

  // Initialize wallet when worklet is started, wallet check is complete, and biometric auth is done
  useEffect(() => {
    if (!hasWalletChecked || !isWorkletStarted || !biometricAuthenticated) {
      return
    }

    // Only initialize once per session
    if (hasAttemptedWalletInitialization.current) {
      return
    }

    // Check if wallet is already initializing
    if (isWalletInitializing) {
      return
    }

    const initializeWalletFlow = async () => {
      try {
        console.log('[WdkAppProvider] Starting wallet initialization...')
        hasAttemptedWalletInitialization.current = true
        setWalletInitError(null)

        // Initialize wallet (create new if doesn't exist, or load existing)
        if (walletExists) {
          console.log('[WdkAppProvider] Loading existing wallet from secure storage...')
          await initializeWallet({ createNew: false })
          console.log('[WdkAppProvider] Existing wallet loaded successfully')
        } else {
          console.log('[WdkAppProvider] Creating new wallet...')
          await initializeWallet({ createNew: true })
          console.log('[WdkAppProvider] New wallet created successfully')
        }

        console.log('[WdkAppProvider] Wallet initialized successfully')
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        console.error('[WdkAppProvider] Failed to initialize wallet:', error)
        setWalletInitError(err)
        // Store error so UI can display it with retry option
      }
    }

    initializeWalletFlow()
  }, [
    hasWalletChecked,
    walletExists,
    isWorkletStarted,
    isWalletInitializing,
    biometricAuthenticated,
    initializeWallet,
  ])

  // Handler for completing biometric authentication
  const completeBiometric = () => {
    console.log('[WdkAppProvider] Biometric authentication completed')
    setBiometricAuthenticated(true)
  }

  // Handler for retrying initialization after an error
  const retry = useCallback(async () => {
    console.log('[WdkAppProvider] Retrying initialization...')
    // Reset error states
    setWalletInitError(null)
    setInitializationError(null)
    // Reset initialization attempt flag so we can try again
    hasAttemptedWalletInitialization.current = false
    
    // Retry wallet initialization directly
    if (!hasWalletChecked || !isWorkletStarted) {
      console.log('[WdkAppProvider] Cannot retry: prerequisite conditions not met')
      return
    }

    try {
      console.log('[WdkAppProvider] Retrying wallet initialization...')
      hasAttemptedWalletInitialization.current = true

      // Initialize wallet (create new if doesn't exist, or load existing)
      if (walletExists) {
        console.log('[WdkAppProvider] Loading existing wallet from secure storage...')
        await initializeWallet({ createNew: false })
        console.log('[WdkAppProvider] Existing wallet loaded successfully')
      } else {
        console.log('[WdkAppProvider] Creating new wallet...')
        await initializeWallet({ createNew: true })
        console.log('[WdkAppProvider] New wallet created successfully')
      }

      console.log('[WdkAppProvider] Wallet initialized successfully')
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[WdkAppProvider] Failed to retry wallet initialization:', error)
      setWalletInitError(err)
    }
  }, [hasWalletChecked, isWorkletStarted, walletExists, initializeWallet])

  // Calculate readiness state
  const isReady = useMemo(() => {
    console.log('[WdkAppProvider] Checking readiness:', {
      requireBiometric,
      biometricAuthenticated,
      isWorkletStarted,
      isWorkletInitialized,
      hasWalletChecked,
      isWalletInitializing,
      walletInitialized,
      walletExists,
    })

    // If biometric is required and not authenticated, not ready
    if (requireBiometric && !biometricAuthenticated) {
      console.log('[WdkAppProvider] Not ready: waiting for biometric')
      return false
    }

    // If worklet isn't started, not ready
    if (!isWorkletStarted) {
      console.log('[WdkAppProvider] Not ready: worklet not started')
      return false
    }

    // If we haven't checked wallet existence, not ready
    if (!hasWalletChecked) {
      console.log('[WdkAppProvider] Not ready: wallet existence not checked')
      return false
    }

    // If wallet is initializing, not ready
    if (isWalletInitializing) {
      console.log('[WdkAppProvider] Not ready: wallet is initializing')
      return false
    }

    // If wallet should exist but isn't initialized yet, not ready
    if (walletExists && !walletInitialized) {
      console.log('[WdkAppProvider] Not ready: wallet exists but not initialized')
      return false
    }

    // If worklet+WDK isn't fully initialized, not ready
    if (!isWorkletInitialized) {
      console.log('[WdkAppProvider] Not ready: worklet/WDK not fully initialized')
      return false
    }

    // All conditions met, ready
    console.log('[WdkAppProvider] Ready!')
    return true
  }, [
    requireBiometric,
    biometricAuthenticated,
    isWorkletStarted,
    isWorkletInitialized,
    hasWalletChecked,
    isWalletInitializing,
    walletExists,
    walletInitialized,
  ])

  // Calculate whether we're waiting for biometric
  const needsBiometric = useMemo(() => {
    // Only need biometric if:
    // 1. Biometric is required
    // 2. Not authenticated yet
    // 3. Worklet is started (so we're at the stage where biometric is needed)
    // 4. Wallet exists (only need biometric to unlock existing wallet)
    return requireBiometric && !biometricAuthenticated && isWorkletStarted && walletExists === true
  }, [requireBiometric, biometricAuthenticated, isWorkletStarted, walletExists])

  // Calculate initializing state
  const isInitializing = useMemo(() => {
    return isWorkletLoading || isWalletInitializing || (!hasWalletChecked && isWorkletStarted)
  }, [isWorkletLoading, isWalletInitializing, hasWalletChecked, isWorkletStarted])

  const contextValue: WdkAppContextValue = useMemo(
    () => ({
      isReady,
      isInitializing,
      walletExists,
      needsBiometric,
      completeBiometric,
      error: walletInitError || initializationError,
      retry,
    }),
    [isReady, isInitializing, walletExists, needsBiometric, walletInitError, initializationError, retry]
  )

  return <WdkAppContext.Provider value={contextValue}>{children}</WdkAppContext.Provider>
}

// Export context for use by the useWdkApp hook
export { WdkAppContext }

