import React, { useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import axios from 'axios';
import { Buffer } from 'buffer';

export default function SolanaPay({ link, disabled }) {
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
    <div className="flex h-[30px] w-[30px] place-items-center rounded border-2 border-gray-300 hover:opacity-50">
      <button className="mx-auto my-auto p-1" onClick={sign} disabled={disabled ?? false}>
        <img src="https://chatgpt.solanalabs.com/favicon.ico" className="h-[18px] w-[20px]" />
      </button>
    </div>
  );
}
