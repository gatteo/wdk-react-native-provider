import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'

/**
 * Secure storage keys
 */
const STORAGE_KEYS = {
  ENCRYPTION_KEY: 'wallet_encryption_key',
  ENCRYPTED_SEED: 'wallet_encrypted_seed',
  ENCRYPTED_ENTROPY: 'wallet_encrypted_entropy',
} as const

/**
 * Secure storage interface
 */
export interface SecureStorage {
  isBiometricAvailable(): Promise<boolean>
  authenticate(): Promise<boolean>
  setEncryptionKey(key: string): Promise<void>
  getEncryptionKey(): Promise<string | null>
  setEncryptedSeed(encryptedSeed: string): Promise<void>
  getEncryptedSeed(): Promise<string | null>
  setEncryptedEntropy(encryptedEntropy: string): Promise<void>
  getEncryptedEntropy(): Promise<string | null>
  hasWallet(): Promise<boolean>
  deleteWallet(): Promise<void>
}

/**
 * Singleton instance of secure storage
 * Created lazily on first access
 */
let secureStorageInstance: SecureStorage | null = null

/**
 * Secure storage wrapper factory for wallet credentials
 * Uses expo-secure-store which provides encrypted storage on device
 * 
 * Returns a singleton instance to maintain referential equality across the app.
 * This eliminates the need for useMemo() in React components.
 * 
 * SECURITY NOTE: Storage is app-scoped by the OS:
 * - iOS: Uses Keychain Services, isolated by bundle identifier
 * - Android: Uses KeyStore, isolated by package name
 * 
 * Two different apps will NOT share data because storage is isolated by bundle ID/package name.
 */
export function createSecureStorage(): SecureStorage {
  // Return singleton instance if already created
  if (secureStorageInstance) {
    return secureStorageInstance
  }
  /**
   * Internal helper: Check if device authentication is available
   * This includes biometrics OR device PIN/password
   * 
   * SECURITY NOTE: Even if device authentication is not available, SecureStore still
   * encrypts data at rest using OS-level encryption (Keychain on iOS, KeyStore on Android).
   * The requireAuthentication flag only controls whether accessing the data requires
   * authentication - it does NOT affect whether the data is encrypted.
   */
  async function isDeviceAuthenticationAvailable(): Promise<boolean> {
    try {
      // isEnrolledAsync() returns true if device has any authentication method:
      // - Biometrics (fingerprint, face, etc.)
      // - Device PIN/password/pattern
      const isEnrolled = await LocalAuthentication.isEnrolledAsync()
      
      // Note: On iOS, device passcode enables secure storage
      // On Android, device credentials (PIN/pattern/password) enable secure storage
      // hasHardwareAsync() checks for biometric hardware, but we don't require it
      // as long as device has some form of authentication enrolled
      return isEnrolled
    } catch (error) {
      console.error('Failed to check device authentication availability:', error)
      return false
    }
  }

  // Create and cache the singleton instance
  secureStorageInstance = {
    /**
     * Check if biometric authentication is available
     */
    async isBiometricAvailable(): Promise<boolean> {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync()
        const enrolled = await LocalAuthentication.isEnrolledAsync()
        return compatible && enrolled
      } catch (error) {
        console.error('Failed to check biometric availability:', error)
        return false
      }
    },

    /**
     * Authenticate with biometrics
     */
    async authenticate(): Promise<boolean> {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to access your wallet',
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        })
        return result.success
      } catch (error) {
        console.error('Biometric authentication failed:', error)
        return false
      }
    },

    /**
     * Store encryption key securely
     * 
     * SECURITY: Data is ALWAYS encrypted at rest by SecureStore (OS-level encryption via
     * Keychain/KeyStore), regardless of requireAuthentication flag.
     * 
     * - If device has authentication: requires authentication to access (more secure)
     * - If device has no authentication: still encrypted at rest, but accessible without auth
     *   (acceptable tradeoff - if device has no PIN, physical access = wallet access anyway)
     */
    async setEncryptionKey(key: string): Promise<void> {
      const deviceAuthAvailable = await isDeviceAuthenticationAvailable()
      
      // Use authentication if available, otherwise fallback to encrypted storage without auth requirement
      // Data is still encrypted at rest in both cases
      await SecureStore.setItemAsync(STORAGE_KEYS.ENCRYPTION_KEY, key, {
        requireAuthentication: deviceAuthAvailable,
        authenticationPrompt: deviceAuthAvailable ? 'Authenticate to access your wallet' : undefined,
      })
    },

    /**
     * Get encryption key from secure storage
     * 
     * SECURITY: Data is ALWAYS encrypted at rest by SecureStore (OS-level encryption via
     * Keychain/KeyStore), regardless of requireAuthentication flag.
     * 
     * - If device has authentication: requires authentication to access (biometrics or PIN/password)
     * - If device has no authentication: still encrypted at rest, but accessible without auth
     *   (acceptable tradeoff - if device has no PIN, physical access = wallet access anyway)
     */
    async getEncryptionKey(): Promise<string | null> {
      try {
        console.log('🔐 Getting encryption key - checking authentication availability...')
        
        const deviceAuthAvailable = await isDeviceAuthenticationAvailable()
        console.log('🔐 Device authentication available:', deviceAuthAvailable)
        
        // Request authentication if available (biometrics or device credentials)
        if (deviceAuthAvailable) {
          const biometricAvailable = await this.isBiometricAvailable()
          if (biometricAvailable) {
            console.log('🔐 Requesting biometric authentication...')
            const authenticated = await this.authenticate()
            console.log('🔐 Biometric authentication result:', authenticated)
            
            if (!authenticated) {
              console.warn('⚠️  Biometric authentication cancelled or failed')
              return null
            }
          } else {
            // Device has authentication but not biometrics - will use device PIN/password
            // expo-secure-store will prompt for device credentials automatically
            console.log('🔐 Biometrics not available - will use device PIN/password')
          }
        } else {
          console.log('🔐 Device has no authentication - using encrypted storage without auth requirement')
        }

        // Retrieve key - will require authentication if device has it, otherwise just encrypted at rest
        console.log('🔐 Retrieving encryption key from secure storage...')
        const key = await SecureStore.getItemAsync(STORAGE_KEYS.ENCRYPTION_KEY, {
          requireAuthentication: deviceAuthAvailable,
          authenticationPrompt: deviceAuthAvailable ? 'Authenticate to access your wallet' : undefined,
        })
        console.log('✅ Encryption key retrieved successfully')
        return key
      } catch (error) {
        console.error('❌ Failed to get encryption key:', error)
        return null
      }
    },

    /**
     * Store encrypted seed securely
     */
    async setEncryptedSeed(encryptedSeed: string): Promise<void> {
      await SecureStore.setItemAsync(STORAGE_KEYS.ENCRYPTED_SEED, encryptedSeed, {
        requireAuthentication: false,
      })
    },

    /**
     * Get encrypted seed from secure storage
     */
    async getEncryptedSeed(): Promise<string | null> {
      try {
        const seed = await SecureStore.getItemAsync(STORAGE_KEYS.ENCRYPTED_SEED, {
          requireAuthentication: false,
        })
        return seed
      } catch (error) {
        console.error('Failed to get encrypted seed:', error)
        return null
      }
    },

    /**
     * Store encrypted entropy securely
     */
    async setEncryptedEntropy(encryptedEntropy: string): Promise<void> {
      await SecureStore.setItemAsync(STORAGE_KEYS.ENCRYPTED_ENTROPY, encryptedEntropy, {
        requireAuthentication: false,
      })
    },

    /**
     * Get encrypted entropy from secure storage
     */
    async getEncryptedEntropy(): Promise<string | null> {
      try {
        const entropy = await SecureStore.getItemAsync(STORAGE_KEYS.ENCRYPTED_ENTROPY, {
          requireAuthentication: false,
        })
        return entropy
      } catch (error) {
        console.error('Failed to get encrypted entropy:', error)
        return null
      }
    },

    /**
     * Check if wallet credentials exist (without requiring biometric authentication)
     */
    async hasWallet(): Promise<boolean> {
      try {
        const encryptedSeed = await this.getEncryptedSeed()
        if (!encryptedSeed) {
          return false
        }

        try {
          const encryptionKey = await SecureStore.getItemAsync(STORAGE_KEYS.ENCRYPTION_KEY, {
            requireAuthentication: false,
          })
          return encryptionKey !== null
        } catch {
          return true
        }
      } catch (error) {
        console.error('Failed to check if wallet exists:', error)
        return false
      }
    },

    /**
     * Delete all wallet credentials
     */
    async deleteWallet(): Promise<void> {
      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.ENCRYPTION_KEY),
        SecureStore.deleteItemAsync(STORAGE_KEYS.ENCRYPTED_SEED),
        SecureStore.deleteItemAsync(STORAGE_KEYS.ENCRYPTED_ENTROPY),
      ])
    },
  }

  return secureStorageInstance
}

