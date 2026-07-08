import os

file_path = 'src/app/live/[contestId]/page.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# 1. Update Fantasy Points
content = content.replace(
    '<div className="desktop-only" style={{ display: \'contents\' }}>\n              {/* User Fantasy Stats */}\n              <div className="card card--primary live-stats"',
    '<div className="desktop-only" style={{ display: \'contents\' }}>\n              {/* User Fantasy Stats */}\n              <div className="card card--primary live-stats live-fantasy-points"'
)

# 2. Update Team Lineup (Remove display: contents)
content = content.replace(
    '<div className="live-team-lineup" style={{ display: \'contents\' }}>\n              {(() => {',
    '<div className="live-team-lineup">\n              {(() => {'
)

# 3. Update Match Events Wrapper
content = content.replace(
    '<div className="desktop-only" style={{ display: \'contents\' }}>\n              {/* Match Events panel */}\n              <div className="ro-window live-events"',
    '<div className="desktop-only live-events-wrapper">\n              {/* Match Events panel */}\n              <div className="ro-window live-events"'
)

# 4. Swap Point Reference and Leaderboard
# Extract Point Reference block
pt_start = content.find('              {/* Point Reference */}')
pt_end = content.find('            </div>\n              {/* Leaderboard */}')
if pt_start == -1 or pt_end == -1:
    print("Could not find Point Reference block")
pt_block = content[pt_start:pt_end].rstrip()

# Extract Leaderboard block
lb_start = content.find('              {/* Leaderboard */}')
lb_end = content.find('              {/* Cryptographic Result Verification Panel */}')
if lb_start == -1 or lb_end == -1:
    print("Could not find Leaderboard block")
lb_block = content[lb_start:lb_end].rstrip()

# Reconstruct
# The order in the original file is:
# [Match Events]
# [Point Reference]
# </div> (end of live-col-right)
# </div> (end of live-grid)
# <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
# [Leaderboard]
# [Crypto Panel]

# We want:
# [Match Events]
# [Leaderboard with live-leaderboard class]
# </div>
# </div>
# <div style={{ marginTop: 24 ... }}>
# [Point Reference]
# [Crypto Panel]

# Add live-leaderboard class to Leaderboard
lb_block = lb_block.replace('<div className="ro-window live-leaderboard">', '<div className="ro-window live-leaderboard">')

closing_tags = '\n            </div>\n          </div>\n          \n          <div style={{ marginTop: 24, display: \'flex\', flexDirection: \'column\', gap: 24 }}>\n'

new_content = content[:pt_start] + lb_block + closing_tags + '  ' + pt_block + '\n\n' + content[lb_end:]

with open(file_path, 'w') as f:
    f.write(new_content)

print("SUCCESS")
