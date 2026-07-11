use anchor_lang::prelude::*;

declare_id!("FW8MmmLJ99w5LxVBZAG5T3Lx5WU7vnh1XaSSS2vj8AGJ");

#[program]
pub mod oddsdraft_program {
    use super::*;

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

    pub fn resolve_contest(
        ctx: Context<ResolveContest>,
        amounts: Vec<u64>,
    ) -> Result<()> {
        let contest = &mut ctx.accounts.contest;

        require!(!contest.is_resolved, OddsDraftError::ContestAlreadyResolved);
        require_keys_eq!(contest.admin, ctx.accounts.admin.key(), OddsDraftError::Unauthorized);

        let winners_info = ctx.remaining_accounts;
        require!(winners_info.len() == amounts.len(), OddsDraftError::MismatchedWinnersAndAmounts);

        let total_prize: u64 = amounts.iter().sum();
        require!(total_prize <= contest.prize_pool, OddsDraftError::InsufficientPrizePool);

        for (i, winner_info) in winners_info.iter().enumerate() {
            let amount = amounts[i];
            **contest.to_account_info().try_borrow_mut_lamports()? = contest
                .to_account_info()
                .lamports()
                .checked_sub(amount)
                .unwrap();
            **winner_info.try_borrow_mut_lamports()? = winner_info
                .lamports()
                .checked_add(amount)
                .unwrap();
        }

        let platform_fee = contest.prize_pool.checked_sub(total_prize).unwrap();
        if platform_fee > 0 {
            **contest.to_account_info().try_borrow_mut_lamports()? = contest
                .to_account_info()
                .lamports()
                .checked_sub(platform_fee)
                .unwrap();
            **ctx.accounts.admin.to_account_info().try_borrow_mut_lamports()? = ctx
                .accounts
                .admin
                .lamports()
                .checked_add(platform_fee)
                .unwrap();
        }

        contest.is_resolved = true;
        Ok(())
    }

    // ── Marketplace ───────────────────────────────────────────────────────────

    /// Seller creates a listing. The card is identified off-chain by card_id;
    /// the PDA acts as on-chain proof of a valid listing at the stated price.
    pub fn list_card(
        ctx: Context<ListCard>,
        card_id: String,
        card_type: String,
        price: u64,
    ) -> Result<()> {
        require!(price > 0, OddsDraftError::InvalidPrice);
        require!(card_id.len() <= 64, OddsDraftError::CardIdTooLong);
        require!(
            card_type == "skill" || card_type == "upgrade",
            OddsDraftError::InvalidCardType
        );

        let listing = &mut ctx.accounts.listing;
        listing.seller = ctx.accounts.seller.key();
        listing.card_id = card_id;
        listing.card_type = card_type;
        listing.price = price;
        listing.bump = ctx.bumps.listing;
        Ok(())
    }

    /// Buyer purchases a listed card. SOL flows: buyer → seller (95%) + buyer → treasury (5%).
    /// The listing PDA is closed, returning rent to the seller.
    pub fn buy_card(ctx: Context<BuyCard>, _card_id: String) -> Result<()> {
        let listing = &ctx.accounts.listing;
        let price = listing.price;

        require!(
            ctx.accounts.buyer.key() != listing.seller,
            OddsDraftError::CannotBuyOwnListing
        );

        let platform_fee = price.checked_mul(5).unwrap().checked_div(100).unwrap();
        let seller_amount = price.checked_sub(platform_fee).unwrap();

        // Transfer seller portion
        anchor_lang::solana_program::program::invoke(
            &anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.buyer.key(),
                &ctx.accounts.seller.key(),
                seller_amount,
            ),
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.seller.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Transfer platform fee to treasury
        if platform_fee > 0 {
            anchor_lang::solana_program::program::invoke(
                &anchor_lang::solana_program::system_instruction::transfer(
                    &ctx.accounts.buyer.key(),
                    &ctx.accounts.treasury.key(),
                    platform_fee,
                ),
                &[
                    ctx.accounts.buyer.to_account_info(),
                    ctx.accounts.treasury.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }

        // listing PDA is closed via `close = seller` constraint → rent returns to seller
        Ok(())
    }

    /// Seller cancels their own listing. PDA closes, rent returns to seller.
    pub fn cancel_listing(ctx: Context<CancelListing>, _card_id: String) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.listing.seller,
            ctx.accounts.seller.key(),
            OddsDraftError::Unauthorized
        );
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

/// On-chain record of a card listing.
/// seeds = [b"listing", seller.key(), card_id.as_bytes()]
#[account]
pub struct ListingAccount {
    pub seller: Pubkey,    // 32
    pub card_id: String,   // 4 + up to 64 bytes
    pub card_type: String, // 4 + 8 bytes ("skill" | "upgrade")
    pub price: u64,        // 8
    pub bump: u8,          // 1
}

// ── Contexts ──────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(contest_id: String)]
pub struct InitializeContest<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 4 + 32 + 8 + 8 + 1 + 1,
        seeds = [b"contest", contest_id.as_bytes()],
        bump
    )]
    pub contest: Account<'info, Contest>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinContest<'info> {
    #[account(mut)]
    pub contest: Account<'info, Contest>,
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 32 + 1,
        seeds = [b"participant", contest.key().as_ref(), user.key().as_ref()],
        bump
    )]
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
#[instruction(card_id: String, card_type: String, price: u64)]
pub struct ListCard<'info> {
    #[account(
        init,
        payer = seller,
        // 8 disc + 32 seller + (4+64) card_id + (4+8) card_type + 8 price + 1 bump
        space = 200,
        seeds = [b"listing", seller.key().as_ref(), card_id.as_bytes()],
        bump
    )]
    pub listing: Account<'info, ListingAccount>,
    #[account(mut)]
    pub seller: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(card_id: String)]
pub struct BuyCard<'info> {
    #[account(
        mut,
        close = seller,
        seeds = [b"listing", seller.key().as_ref(), card_id.as_bytes()],
        bump = listing.bump,
        has_one = seller,
    )]
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
    #[account(
        mut,
        close = seller,
        seeds = [b"listing", seller.key().as_ref(), card_id.as_bytes()],
        bump = listing.bump,
        has_one = seller,
    )]
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
}
