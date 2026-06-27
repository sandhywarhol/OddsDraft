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

        // Record participant
        participant.user = ctx.accounts.user.key();
        participant.contest = contest.key();
        participant.bump = ctx.bumps.participant;

        // Transfer entry fee from user to contest PDA
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

        // Update prize pool
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
        
        // Ensure total prize does not exceed 95% of prize pool (5% platform fee stays or goes to admin)
        // Wait, to be safe, just make sure total_prize <= contest.prize_pool.
        // We will send the exact amounts to winners, and then the remaining balance can be claimed by admin later or sent to admin now.
        require!(total_prize <= contest.prize_pool, OddsDraftError::InsufficientPrizePool);

        // Transfer SOL from Contest PDA to winners
        for (i, winner_info) in winners_info.iter().enumerate() {
            let amount = amounts[i];
            
            // PDA native SOL transfer
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

        // Send remaining balance (5% platform fee + rounding dust) to admin
        let _remaining_balance = contest.to_account_info().lamports() - contest.get_lamports() /* wait, get_lamports is just lamports() */ ;
        // We must leave rent exemption amount in the PDA, so let's only take out what was added to the prize pool.
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
}

#[derive(Accounts)]
#[instruction(contest_id: String)]
pub struct InitializeContest<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 4 + 32 + 8 + 8 + 1 + 1, // 8 discriminator, 32 pubkey, 4+32 string, 8 u64, 8 u64, 1 bool, 1 bump. 
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
    // Winners are passed as remaining_accounts
}

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
}
