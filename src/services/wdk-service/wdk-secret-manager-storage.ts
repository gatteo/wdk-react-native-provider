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

import b4a from 'b4a';
import * as Keychain from 'react-native-keychain';

export const WDK_STORAGE_SEED = 'seed' as const;
export const WDK_STORAGE_ENTROPY = 'entropy' as const;
export const WDK_STORAGE_SALT = 'salt' as const;

export class WdkSecretManagerStorage {
  static BASE_SERVICE_NAME = 'wdk.secretManager';

  static async saveData(
    key:
      | typeof WDK_STORAGE_SEED
      | typeof WDK_STORAGE_ENTROPY
      | typeof WDK_STORAGE_SALT,
    value: Buffer | string
  ) {
    const itemService = WdkSecretManagerStorage.getServiceForItem(key);
    await Keychain.setGenericPassword(
      key,
      b4a.isBuffer(value) ? b4a.toString(value, 'hex') : value,
      {
        service: itemService,
        accessControl:
          key === 'seed' ? Keychain.ACCESS_CONTROL.BIOMETRY_ANY : undefined,
      }
    );
  }

  static async retrieveData(
    key:
      | typeof WDK_STORAGE_SEED
      | typeof WDK_STORAGE_ENTROPY
      | typeof WDK_STORAGE_SALT
  ) {
    const itemService = WdkSecretManagerStorage.getServiceForItem(key);

    try {
      const credentials = await Keychain.getGenericPassword({
        service: itemService,
        accessControl:
          key === 'seed' ? Keychain.ACCESS_CONTROL.BIOMETRY_ANY : undefined,
      });
      if (credentials) {
        return b4a.from(credentials.password, 'hex');
      }
      console.info(
        `For key ${itemService} in secure storage data do not exist.`
      );
      return false;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  static async hasKey(
    key:
      | typeof WDK_STORAGE_SEED
      | typeof WDK_STORAGE_ENTROPY
      | typeof WDK_STORAGE_SALT
  ) {
    const itemService = WdkSecretManagerStorage.getServiceForItem(key);
    return await Keychain.hasGenericPassword({ service: itemService });
  }

  static async resetData(
    key:
      | typeof WDK_STORAGE_SEED
      | typeof WDK_STORAGE_ENTROPY
      | typeof WDK_STORAGE_SALT
  ) {
    const itemService = WdkSecretManagerStorage.getServiceForItem(key);
    try {
      const success = await Keychain.resetGenericPassword({
        service: itemService,
      });
      if (success) {
        console.info(`Item for key '${key}' was reset successfully.`);
      }
      return true;
    } catch (error) {
      console.error(`Failed to reset item for key '${key}':`, error);
      return false;
    }
  }

  static async resetAllData() {
    await WdkSecretManagerStorage.resetData(WDK_STORAGE_ENTROPY);
    await WdkSecretManagerStorage.resetData(WDK_STORAGE_SEED);
    await WdkSecretManagerStorage.resetData(WDK_STORAGE_SALT);
  }

  static getServiceForItem(
    key:
      | typeof WDK_STORAGE_SEED
      | typeof WDK_STORAGE_ENTROPY
      | typeof WDK_STORAGE_SALT
  ) {
    return `${WdkSecretManagerStorage.BASE_SERVICE_NAME}.${key}`;
  }
}
