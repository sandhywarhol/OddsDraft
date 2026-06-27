import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, Idl, BN } from '@coral-xyz/anchor';
import idl from './idl.json';

const PROGRAM_ID = new PublicKey("FW8MmmLJ99w5LxVBZAG5T3Lx5WU7vnh1XaSSS2vj8AGJ");

export const getProvider = (connection: Connection, wallet: any) => {
  return new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
};

export const getProgram = (connection: Connection, wallet: any) => {
  const provider = getProvider(connection, wallet);
  return new Program(idl as Idl, provider);
};

export const getContestPDA = (contestId: string): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("contest"), Buffer.from(contestId)],
    PROGRAM_ID
  );
};

export const getParticipantPDA = (contestPDA: PublicKey, userPubkey: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("participant"), contestPDA.toBuffer(), userPubkey.toBuffer()],
    PROGRAM_ID
  );
};

export const buildEntryFeeTransaction = async (
  connection: Connection,
  wallet: any,
  contestId: string
): Promise<Transaction> => {
  const program = getProgram(connection, wallet);
  const [contestPDA] = getContestPDA(contestId);
  const [participantPDA] = getParticipantPDA(contestPDA, wallet.publicKey);

  // We build the instruction to join_contest
  const ix = await program.methods
    .joinContest()
    .accounts({
      contest: contestPDA,
      participant: participantPDA,
      user: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const tx = new Transaction().add(ix);
  tx.feePayer = wallet.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  return tx;
};

// Admin helper to resolve the contest
export const buildResolveContestTransaction = async (
  connection: Connection,
  adminWallet: any,
  contestId: string,
  winners: PublicKey[],
  amounts: BN[]
): Promise<Transaction> => {
  const program = getProgram(connection, adminWallet);
  const [contestPDA] = getContestPDA(contestId);

  const remainingAccounts = winners.map((pubkey) => ({
    pubkey,
    isSigner: false,
    isWritable: true,
  }));

  const ix = await program.methods
    .resolveContest(amounts)
    .accounts({
      contest: contestPDA,
      admin: adminWallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();

  const tx = new Transaction().add(ix);
  tx.feePayer = adminWallet.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  return tx;
};
