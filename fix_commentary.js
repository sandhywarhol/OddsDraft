const fs = require('fs');
let code = fs.readFileSync('src/app/live/[contestId]/page.tsx', 'utf8');

// 1. Modify the getDialogData signature and kick_off logic
code = code.replace(
  "userLineupNames?: string[];",
  "userLineupStarters?: string[]; userLineupBenched?: string[];"
);

// We need to replace the step === 3 logic for kick_off.
const oldLogic = `        } else if (extra?.userLineupNames && extra.userLineupNames.length > 0) {
          // Fix 2: commentator reviews which of the user's picked players are in today's lineup
          const picks = extra.userLineupNames.slice(0, 3).join(', ');
          const rest = extra.userLineupNames.length > 3 ? \` and \${extra.userLineupNames.length - 3} more\` : '';
          return {
            speakerTitle: 'Martin',
            text: \`"Your lineup features \${picks}\${rest}. Great selections — let's see how they perform in this World Cup Final!"\`,
            commentator1Image: '/NPC/Komentator%201%20calm.svg',
          };`;

const newLogic = `        } else if (extra?.userLineupStarters && extra?.userLineupBenched) {
          const starters = extra.userLineupStarters;
          const benched = extra.userLineupBenched;
          let text = "Let's see... ";
          if (starters.length > 0) {
            text += \`\${starters.slice(0, 3).join(', ')} \${starters.length > 3 ? 'and others ' : ''}are starting today. \`;
          }
          if (benched.length > 0) {
            text += \`Meanwhile, \${benched.slice(0, 2).join(', ')} \${benched.length > 2 ? 'and others ' : ''}start on the bench.\`;
          }
          if (starters.length === 0) {
            text += "None of your picked players made the starting XI!";
          }
          return {
            speakerTitle: 'Martin',
            text: \`"\${text.trim()}"\`,
            commentator1Image: '/NPC/Komentator%201%20calm.svg',
          };`;

code = code.replace(oldLogic, newLogic);

// 2. Modify the call site
const oldCallSite = `        const _userLineupNames: string[] = guestDemoMode
          ? ((userLineup?.players as any[] ?? []).map((p: any) => p?.name).filter(Boolean) as string[])
          : [];`;

const newCallSite = `        const _userLineupStarters: string[] = [];
        const _userLineupBenched: string[] = [];
        if (guestDemoMode && userLineup?.players) {
          const rStarters = getRealStarterIds();
          for (const p of userLineup.players as any[]) {
            if (p && p.name && p.id) {
              if (rStarters && rStarters.has(p.id)) _userLineupStarters.push(p.name);
              else _userLineupBenched.push(p.name);
            }
          }
        }`;

code = code.replace(oldCallSite, newCallSite);

// Replace the passed object
code = code.replace(
  "userLineupNames: _userLineupNames,",
  "userLineupStarters: _userLineupStarters, userLineupBenched: _userLineupBenched,"
);

fs.writeFileSync('src/app/live/[contestId]/page.tsx', code);
