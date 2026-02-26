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

import { HRPC as wdkManagerHRPC } from '@tetherto/pear-wrk-wdk';
import { Worklet } from 'react-native-bare-kit';
// @ts-expect-error - spec files don't have type definitions
import HRPC from '../../spec/hrpc';
// @ts-expect-error - spec files don't have type definitions
import { getEnum } from '../../spec/schema';
export enum InstanceEnum {
  wdkSecretManager = 'wdkSecretManager',
  wdkManager = 'wdkManager',
}

export type BareInstanceTypes = Partial<{
  [K in InstanceEnum]: Worklet;
}>;

export type HRPCInstanceTypes = Partial<{
  [K in InstanceEnum]: HRPC | wdkManagerHRPC;
}>;

export class BareWorkletApi {
  static bareInstances: BareInstanceTypes = {
    wdkSecretManager: undefined,
    wdkManager: undefined,
  };
  static hrpcInstances: HRPCInstanceTypes = {
    wdkSecretManager: null,
    wdkManager: null,
  };

  /**
   * Start bare worklet and assign HRPC instance.
   * @param {InstanceEnum} instance
   * @param {string} fileName
   * @param {string} source
   * @return Worklet
   */
  static startWorklet(
    instance: InstanceEnum,
    fileName: string,
    source: string
  ): Worklet | undefined {
    try {
      if (BareWorkletApi.bareInstances[instance])
        return BareWorkletApi.bareInstances[instance];
      BareWorkletApi.bareInstances[instance] = new Worklet();
      BareWorkletApi.bareInstances[instance].start(fileName, source);
      switch (instance) {
        case InstanceEnum.wdkSecretManager:
          BareWorkletApi.hrpcInstances[instance] = new HRPC(
            BareWorkletApi.bareInstances[instance].IPC
          );
          BareWorkletApi.registerHRPCLog(
            BareWorkletApi.hrpcInstances[instance]
          );
          break;
        case InstanceEnum.wdkManager:
          BareWorkletApi.hrpcInstances[instance] = new wdkManagerHRPC(
            BareWorkletApi.bareInstances[instance].IPC
          );
          break;
      }
      return BareWorkletApi.bareInstances[instance];
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  static registerHRPCLog(instance: any): void {
    const logEnums = getEnum('@tetherto/wdk-secret-manager/log-type-enum');
    instance.onCommandLog((data: any) => {
      if (data.type === logEnums.info) console.info(data.data);
      if (data.type === logEnums.error) console.error(data.data);
      if (data.type === logEnums.debug) console.debug(data.data);
    });
  }

  /**
   * Terminate worklet
   * @param {InstanceEnum} instance
   */
  static terminateWorklet(instance: InstanceEnum): void {
    if (BareWorkletApi.bareInstances[instance])
      BareWorkletApi.bareInstances[instance].terminate();
    if (BareWorkletApi.hrpcInstances[instance])
      BareWorkletApi.hrpcInstances[instance] = null;
  }
}
