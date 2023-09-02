import React, { useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import axios from 'axios';
import { Buffer } from 'buffer';

export default function SolanaPay({ link }) {
  const { publicKey, signTransaction } = useWallet();

  const sign = useMemo(
    () => async () => {
      if (publicKey) {
        // Need a more systematic way of getting the actual tx links & formatting
        const txLink = link.replace('/solana-pay/qr', '/solana-pay/sign');
        const result = await axios.post('/api/plugins/solana-pay', {
          link: txLink,
          account: publicKey.toBase58(),
        });
        if (result) {
          const payload = result.data;
          let txBytes = Buffer.from(payload.transaction, 'base64');
          const tx = VersionedTransaction.deserialize(txBytes);
          await signTransaction(tx);
        }
      }
    },
    [publicKey, signTransaction, link],
  );

  return (
    <div
      height={36}
      width={36}
      className="flex place-items-center rounded border-2 border-gray-300 hover:opacity-50"
    >
      <button className="mx-auto my-auto p-1" onClick={sign}>
        <img src="https://chatgpt.solanalabs.com/favicon.ico" height={18} width={18} />
      </button>
    </div>
  );
}
