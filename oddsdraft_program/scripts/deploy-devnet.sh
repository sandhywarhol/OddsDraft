#!/bin/bash
# Deploy OddsDraft Anchor program to devnet.
# Run from the project root: bash oddsdraft_program/scripts/deploy-devnet.sh
#
# Prerequisites:
#   - Solana CLI installed (solana --version)
#   - Anchor CLI installed (anchor --version)
#   - A funded devnet keypair at ~/devnet-admin.json
#     Create:  solana-keygen new --outfile ~/devnet-admin.json
#     Fund:    solana airdrop 2 ~/devnet-admin.json --url devnet

set -e

WALLET="${DEPLOY_WALLET:-$HOME/devnet-admin.json}"
PROGRAM_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== OddsDraft devnet deploy ==="
echo "Program dir : $PROGRAM_DIR"
echo "Wallet      : $WALLET"
echo ""

# Confirm wallet exists
if [ ! -f "$WALLET" ]; then
  echo "ERROR: wallet not found at $WALLET"
  echo "Create one with: solana-keygen new --outfile $WALLET"
  exit 1
fi

# Show wallet balance
PUBKEY=$(solana-keygen pubkey "$WALLET")
echo "Deploy wallet: $PUBKEY"
solana balance "$PUBKEY" --url devnet
echo ""

# Build
echo "--- Building program ---"
cd "$PROGRAM_DIR"
anchor build

# Show program ID
PROGRAM_ID=$(solana-keygen pubkey target/deploy/oddsdraft_program-keypair.json)
echo ""
echo "Program ID: $PROGRAM_ID"
echo "(This should match declare_id! in lib.rs and NEXT_PUBLIC_ODDSDRAFT_PROGRAM_ID in .env.local)"
echo ""

# Deploy
echo "--- Deploying to devnet ---"
anchor deploy \
  --provider.cluster devnet \
  --provider.wallet "$WALLET"

echo ""
echo "=== Deploy complete ==="
echo ""
echo "Next steps:"
echo "  1. Update NEXT_PUBLIC_ODDSDRAFT_PROGRAM_ID=$PROGRAM_ID in .env.local (if changed)"
echo "  2. Uncomment the devnet block in .env.local"
echo "  3. Set SMART_CONTRACT_ENABLED=true when integration is ready"
echo "  4. Generate a devnet admin keypair for initialize_contest calls:"
echo "     solana-keygen new --outfile ~/devnet-treasury.json"
echo "     solana airdrop 5 \$(solana-keygen pubkey ~/devnet-treasury.json) --url devnet"
