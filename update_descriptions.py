import re

with open('src/app/live/[contestId]/page.tsx', 'r') as f:
    content = f.read()

# We want to use event.description for step 2 of events with referee, or step 1 of events without referee.
# Actually, the user specifically mentioned "foul offside dan lain2" and "setelah refere keluar".
# Let's target the step 2 for Foul, Offside, Corner Kick, Substitution, Yellow Card, Red Card, VAR, Goal (which doesn't have referee but is step 1).

# Let's just modify Foul, Offside, Corner Kick, Goal, Yellow Card, Red Card, Own Goal, Substitution, Goalkeeper Save.

events_to_update = {
    'foul': 'step === 2',
    'offside': 'step === 2',
    'corner_kick': 'step === 2',
    'yellow_card': 'step === 1',  # wait, yellow card has commentator 1 and refereeImage on step 1! 
    'red_card': 'step === 1',
    'goal': 'step === 1',
    'substitution': 'step === 2'
}

# The easiest way is to find the text string inside these and replace it with:
# text: event.description ? `"${event.description}"` : `"Fallback..."`

# I will just write a python script that replaces the specific lines using find/replace.

def replace_line(old, new):
    global content
    if old not in content:
        print(f"NOT FOUND: {old}")
    content = content.replace(old, new)


replace_line(
    'text: `"That\'s a careless foul by ${player}. The referee awards a free kick."`',
    'text: event.description ? `"${event.description}"` : `"That\'s a careless foul by ${player}. The referee awards a free kick."`'
)

replace_line(
    'text: `"The linesman\'s flag goes up! ${player} is caught offside."`',
    'text: event.description ? `"${event.description}"` : `"The linesman\'s flag goes up! ${player} is caught offside."`'
)

replace_line(
    'text: `"It\'s out for a corner kick. A chance for ${team} to send their tall defenders forward."`',
    'text: event.description ? `"${event.description}"` : `"It\'s out for a corner kick. A chance for ${team} to send their tall defenders forward."`'
)

replace_line(
    'text: `"Substitution for ${team}. Let\'s see if this tactical change can turn the tide of the match."`',
    'text: event.description ? `"${event.description}"` : `"Substitution for ${team}. Let\'s see if this tactical change can turn the tide of the match."`'
)

replace_line(
    'text: `"GOAL! ${player} finds the back of the net in the ${minute} minute with a brilliant finish to put his team in front!"`',
    'text: event.description ? `"${event.description}"` : `"GOAL! ${player} finds the back of the net in the ${minute} minute with a brilliant finish to put his team in front!"`'
)

replace_line(
    'text: `"Oh, that\'s a reckless challenge by ${player}! The referee steps in and shows a yellow card. He must be careful now!"`',
    'text: event.description ? `"${event.description}"` : `"Oh, that\'s a reckless challenge by ${player}! The referee steps in and shows a yellow card. He must be careful now!"`'
)

replace_line(
    'text: `"Oh, that\'s a reckless challenge by ${player}! The referee has no choice but to show a straight red card, and it\'s a huge blow for ${team}!"`',
    'text: event.description ? `"${event.description}"` : `"Oh, that\'s a reckless challenge by ${player}! The referee has no choice but to show a straight red card, and it\'s a huge blow for ${team}!"`'
)


with open('src/app/live/[contestId]/page.tsx', 'w') as f:
    f.write(content)

