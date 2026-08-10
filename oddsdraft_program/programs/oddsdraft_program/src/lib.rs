use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};

declare_id!("FW8MmmLJ99w5LxVBZAG5T3Lx5WU7vnh1XaSSS2vj8AGJ");

#[program]
pub mod oddsdraft_program {
    use super::*;

    // ── SOL Contests ──────────────────────────────────────────────────────────

    pub fn initialize_contest(
        ctx: Context<InitializeContest>,
        contest_id: String,
        entry_fee: u64,
    ) -> Result<()> {
        let contest = &mut ctx.accounts.contest;
        contest.admin = ctx.accounts.admin.key();
        contest.contest_id = contest_id;
        contest.entry_fee = entry_fee;
        contest.prize_pool = 0;
        contest.is_resolved = false;
        contest.bump = ctx.bumps.contest;
        Ok(())
    }

    pub fn join_contest(ctx: Context<JoinContest>) -> Result<()> {
        let contest = &mut ctx.accounts.contest;
        let participant = &mut ctx.accounts.participant;
        require!(!contest.is_resolved, OddsDraftError::ContestAlreadyResolved);
        participant.user = ctx.accounts.user.key();
        participant.contest = contest.key();
        participant.bump = ctx.bumps.participant;
        anchor_lang::solana_program::program::invoke(
            &anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.user.key(),
                &contest.key(),
                contest.entry_fee,
            ),
            &[
                ctx.accounts.user.to_account_info(),
                contest.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
        contest.prize_pool = contest.prize_pool.checked_add(contest.entry_fee).unwrap();
        Ok(())
    }

    pub fn resolve_contest(ctx: Context<ResolveContest>, amounts: Vec<u64>) -> Result<()> {
        let contest = &mut ctx.accounts.contest;
        require!(!contest.is_resolved, OddsDraftError::ContestAlreadyResolved);
        require_keys_eq!(contest.admin, ctx.accounts.admin.key(), OddsDraftError::Unauthorized);
        let winners_info = ctx.remaining_accounts;
        require!(winners_info.len() == amounts.len(), OddsDraftError::MismatchedWinnersAndAmounts);
        let total_prize: u64 = amounts.iter().sum();
        require!(total_prize <= contest.prize_pool, OddsDraftError::InsufficientPrizePool);
        for (i, winner_info) in winners_info.iter().enumerate() {
            let amount = amounts[i];
            **contest.to_account_info().try_borrow_mut_lamports()? = contest.to_account_info().lamports().checked_sub(amount).unwrap();
            **winner_info.try_borrow_mut_lamports()? = winner_info.lamports().checked_add(amount).unwrap();
        }
        let platform_fee = contest.prize_pool.checked_sub(total_prize).unwrap();
        if platform_fee > 0 {
            **contest.to_account_info().try_borrow_mut_lamports()? = contest.to_account_info().lamports().checked_sub(platform_fee).unwrap();
            **ctx.accounts.admin.to_account_info().try_borrow_mut_lamports()? = ctx.accounts.admin.lamports().checked_add(platform_fee).unwrap();
        }
        contest.is_resolved = true;
        Ok(())
    }

    // ── USDC Pool Contests ────────────────────────────────────────────────────

    pub fn init_usdc_contest(ctx: Context<InitUsdcContest>, contest_id: String) -> Result<()> {
        require!(contest_id.len() <= 64, OddsDraftError::ContestIdTooLong);
        let c = &mut ctx.accounts.usdc_contest;
        c.admin = ctx.accounts.admin.key();
        c.contest_id = contest_id;
        c.usdc_mint = ctx.accounts.usdc_mint.key();
        c.vault = ctx.accounts.vault.key();
        c.total_pool = 0;
        c.is_resolved = false;
        c.bump = ctx.bumps.usdc_contest;
        c.vault_bump = ctx.bumps.vault;
        Ok(())
    }

    pub fn join_usdc_contest(ctx: Context<JoinUsdcContest>, usdc_amount: u64) -> Result<()> {
        require!(usdc_amount > 0, OddsDraftError::InvalidAmount);
        require!(!ctx.accounts.usdc_contest.is_resolved, OddsDraftError::ContestAlreadyResolved);
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault.to_account_info().clone(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.key(), cpi_accounts);
        token::transfer(cpi_ctx, usdc_amount)?;
        let p = &mut ctx.accounts.usdc_participant;
        p.user = ctx.accounts.user.key();
        p.contest = ctx.accounts.usdc_contest.key();
        p.usdc_staked = usdc_amount;
        p.bump = ctx.bumps.usdc_participant;
        let c = &mut ctx.accounts.usdc_contest;
        c.total_pool = c.total_pool.checked_add(usdc_amount).unwrap();
        Ok(())
    }

    pub fn resolve_usdc_contest<'a>(ctx: Context<'a, ResolveUsdcContest<'a>>, amounts: Vec<u64>) -> Result<()> {
        let c = &mut ctx.accounts.usdc_contest;
        require!(!c.is_resolved, OddsDraftError::ContestAlreadyResolved);
        require_keys_eq!(c.admin, ctx.accounts.admin.key(), OddsDraftError::Unauthorized);
        let winner_atas = ctx.remaining_accounts;
        require!(winner_atas.len() == amounts.len(), OddsDraftError::MismatchedWinnersAndAmounts);
        let total_out: u64 = amounts.iter().sum();
        require!(total_out <= c.total_pool, OddsDraftError::InsufficientPrizePool);
        let contest_key = c.key();
        let vault_bump = c.vault_bump;
        let seeds: &[&[u8]] = &[b"usdc_vault", contest_key.as_ref(), &[vault_bump]];
        let signer_seeds = &[seeds];
        for (i, winner_ata_info) in winner_atas.iter().enumerate() {
            let amount = amounts[i];
            if amount == 0 { continue; }
            let cpi_accounts = Transfer {
                from: ctx.accounts.vault.to_account_info().clone(),
                to: winner_ata_info.to_account_info(),
                authority: ctx.accounts.vault.to_account_info().clone(),
            };
            let cpi_ctx = CpiContext::new_with_signer(ctx.accounts.token_program.key(), cpi_accounts, signer_seeds);
            token::transfer(cpi_ctx, amount)?;
        }
        let platform_fee = c.total_pool.saturating_sub(total_out);
        if platform_fee > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.vault.to_account_info().clone(),
                to: ctx.accounts.treasury_token_account.to_account_info(),
                authority: ctx.accounts.vault.to_account_info().clone(),
            };
            let cpi_ctx = CpiContext::new_with_signer(ctx.accounts.token_program.key(), cpi_accounts, signer_seeds);
            token::transfer(cpi_ctx, platform_fee)?;
        }
        c.is_resolved = true;
        Ok(())
    }

    // ── Marketplace ───────────────────────────────────────────────────────────

    pub fn list_card(ctx: Context<ListCard>, card_id: String, card_type: String, price: u64) -> Result<()> {
        require!(price > 0, OddsDraftError::InvalidPrice);
        require!(card_id.len() <= 64, OddsDraftError::CardIdTooLong);
        require!(card_type == "skill" || card_type == "upgrade", OddsDraftError::InvalidCardType);
        let listing = &mut ctx.accounts.listing;
        listing.seller = ctx.accounts.seller.key();
        listing.card_id = card_id;
        listing.card_type = card_type;
        listing.price = price;
        listing.bump = ctx.bumps.listing;
        Ok(())
    }

    pub fn buy_card(ctx: Context<BuyCard>, _card_id: String) -> Result<()> {
        let listing = &ctx.accounts.listing;
        let price = listing.price;
        require!(ctx.accounts.buyer.key() != listing.seller, OddsDraftError::CannotBuyOwnListing);
        let platform_fee = price.checked_mul(5).unwrap().checked_div(100).unwrap();
        let seller_amount = price.checked_sub(platform_fee).unwrap();
        anchor_lang::solana_program::program::invoke(
            &anchor_lang::solana_program::system_instruction::transfer(&ctx.accounts.buyer.key(), &ctx.accounts.seller.key(), seller_amount),
            &[ctx.accounts.buyer.to_account_info(), ctx.accounts.seller.to_account_info(), ctx.accounts.system_program.to_account_info()],
        )?;
        if platform_fee > 0 {
            anchor_lang::solana_program::program::invoke(
                &anchor_lang::solana_program::system_instruction::transfer(&ctx.accounts.buyer.key(), &ctx.accounts.treasury.key(), platform_fee),
                &[ctx.accounts.buyer.to_account_info(), ctx.accounts.treasury.to_account_info(), ctx.accounts.system_program.to_account_info()],
            )?;
        }
        Ok(())
    }

    pub fn cancel_listing(ctx: Context<CancelListing>, _card_id: String) -> Result<()> {
        require_keys_eq!(ctx.accounts.listing.seller, ctx.accounts.seller.key(), OddsDraftError::Unauthorized);
        Ok(())
    }
}

// ── Account structs ───────────────────────────────────────────────────────────

#[account]
pub struct Contest {
    pub admin: Pubkey,
    pub contest_id: String,
    pub entry_fee: u64,
    pub prize_pool: u64,
    pub is_resolved: bool,
    pub bump: u8,
}

#[account]
pub struct Participant {
    pub user: Pubkey,
    pub contest: Pubkey,
    pub bump: u8,
}

/// USDC pool contest. seeds = [b"usdc_contest", contest_id.as_bytes()]
#[account]
pub struct UsdcContest {
    pub admin: Pubkey,
    pub contest_id: String,
    pub usdc_mint: Pubkey,
    pub vault: Pubkey,
    pub total_pool: u64,
    pub is_resolved: bool,
    pub bump: u8,
    pub vault_bump: u8,
}

/// User stake record. seeds = [b"usdc_participant", usdc_contest.key(), user.key()]
#[account]
pub struct UsdcParticipant {
    pub user: Pubkey,
    pub contest: Pubkey,
    pub usdc_staked: u64,
    pub bump: u8,
}

/// On-chain record of a card listing.
#[account]
pub struct ListingAccount {
    pub seller: Pubkey,
    pub card_id: String,
    pub card_type: String,
    pub price: u64,
    pub bump: u8,
}

// ── Contexts ──────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(contest_id: String)]
pub struct InitializeContest<'info> {
    #[account(init, payer = admin, space = 8 + 32 + 4 + 32 + 8 + 8 + 1 + 1, seeds = [b"contest", contest_id.as_bytes()], bump)]
    pub contest: Account<'info, Contest>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinContest<'info> {
    #[account(mut)]
    pub contest: Account<'info, Contest>,
    #[account(init, payer = user, space = 8 + 32 + 32 + 1, seeds = [b"participant", contest.key().as_ref(), user.key().as_ref()], bump)]
    pub participant: Account<'info, Participant>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveContest<'info> {
    #[account(mut)]
    pub contest: Account<'info, Contest>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(contest_id: String)]
pub struct InitUsdcContest<'info> {
    #[account(init, payer = admin, space = 8 + 32 + (4 + 64) + 32 + 32 + 8 + 1 + 1 + 1, seeds = [b"usdc_contest", contest_id.as_bytes()], bump)]
    pub usdc_contest: Account<'info, UsdcContest>,
    #[account(init, payer = admin, token::mint = usdc_mint, token::authority = vault, seeds = [b"usdc_vault", usdc_contest.key().as_ref()], bump)]
    pub vault: Account<'info, TokenAccount>,
    pub usdc_mint: Account<'info, Mint>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct JoinUsdcContest<'info> {
    #[account(mut)]
    pub usdc_contest: Account<'info, UsdcContest>,
    #[account(mut, seeds = [b"usdc_vault", usdc_contest.key().as_ref()], bump = usdc_contest.vault_bump)]
    pub vault: Account<'info, TokenAccount>,
    #[account(init, payer = user, space = 8 + 32 + 32 + 8 + 1, seeds = [b"usdc_participant", usdc_contest.key().as_ref(), user.key().as_ref()], bump)]
    pub usdc_participant: Account<'info, UsdcParticipant>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveUsdcContest<'info> {
    #[account(mut)]
    pub usdc_contest: Account<'info, UsdcContest>,
    #[account(mut, seeds = [b"usdc_vault", usdc_contest.key().as_ref()], bump = usdc_contest.vault_bump)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(card_id: String, card_type: String, price: u64)]
pub struct ListCard<'info> {
    #[account(init, payer = seller, space = 200, seeds = [b"listing", seller.key().as_ref(), card_id.as_bytes()], bump)]
    pub listing: Account<'info, ListingAccount>,
    #[account(mut)]
    pub seller: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(card_id: String)]
pub struct BuyCard<'info> {
    #[account(mut, close = seller, seeds = [b"listing", seller.key().as_ref(), card_id.as_bytes()], bump = listing.bump, has_one = seller)]
    pub listing: Account<'info, ListingAccount>,
    /// CHECK: seller receives SOL — validated by has_one on listing
    #[account(mut)]
    pub seller: UncheckedAccount<'info>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK: treasury receives platform fee — validated off-chain by our server
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(card_id: String)]
pub struct CancelListing<'info> {
    #[account(mut, close = seller, seeds = [b"listing", seller.key().as_ref(), card_id.as_bytes()], bump = listing.bump, has_one = seller)]
    pub listing: Account<'info, ListingAccount>,
    #[account(mut)]
    pub seller: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ── Errors ────────────────────────────────────────────────────────────────────

#[error_code]
pub enum OddsDraftError {
    #[msg("Contest has already been resolved.")]
    ContestAlreadyResolved,
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("Mismatched number of winners and amounts.")]
    MismatchedWinnersAndAmounts,
    #[msg("Insufficient prize pool.")]
    InsufficientPrizePool,
    #[msg("Price must be greater than zero.")]
    InvalidPrice,
    #[msg("Card ID exceeds maximum length of 64 characters.")]
    CardIdTooLong,
    #[msg("Card type must be 'skill' or 'upgrade'.")]
    InvalidCardType,
    #[msg("You cannot buy your own listing.")]
    CannotBuyOwnListing,
    #[msg("USDC amount must be greater than zero.")]
    InvalidAmount,
    #[msg("Contest ID exceeds maximum length of 64 characters.")]
    ContestIdTooLong,
}
