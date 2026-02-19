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

/**
 * Polyfills for React Native environment
 * This file sets up necessary polyfills for cryptographic and stream operations
 * that are required by the WDK library and related crypto packages.
 */

import { Buffer } from '@craftzdog/react-native-buffer';
import 'react-native-get-random-values';

// Set up Buffer polyfill
if (typeof global.Buffer === 'undefined') {
  // @ts-ignore
  global.Buffer = Buffer;
}

// Set up process polyfill for stream operations
if (typeof global.process === 'undefined') {
  // @ts-ignore
  global.process = require('process');
}

// Initialize crypto polyfill after Buffer and process are available
if (typeof global.crypto === 'undefined') {
  try {
    const crypto = require('react-native-crypto');
    // @ts-ignore
    global.crypto = crypto;
  } catch (e) {
    console.warn('Failed to load crypto polyfill:', e);
  }
}
