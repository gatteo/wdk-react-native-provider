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

const MAX_BYTES = 16;

function generateWdkSalt(email: any): Buffer {
  const localPart = email.split('@')[0];

  // Encode the local part using TextEncoder
  const encoder = new TextEncoder();
  const encoded = encoder.encode(localPart);

  // Prepare a MAX_BYTES-byte buffer
  const bf = new Uint8Array(MAX_BYTES);

  if (encoded.length > MAX_BYTES) {
    // If more than MAX_BYTES bytes, take the last MAX_BYTES bytes
    const sliced = encoded.slice(0, MAX_BYTES);
    bf.set(sliced);
  } else {
    // Copy encoded bytes to beginning
    bf.set(encoded, 0);

    // Fill the remaining bytes with 7
    bf.fill(7, encoded.length);
  }

  return bf as Buffer;
}

export const wdkEncryptionSalt = {
  generateWdkSalt,
};
