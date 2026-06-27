import re

with open('src/app/live/[contestId]/page.tsx', 'r') as f:
    content = f.read()

# Replace Commentator 3 with Martin
content = content.replace("speakerTitle: 'Commentator 3'", "speakerTitle: 'Martin'")
content = content.replace("speakerTitle: 'Commentator 1'", "speakerTitle: 'Martin'")
content = content.replace("speakerTitle: 'Commentator 2'", "speakerTitle: 'Alan'")

# Now for images.
# Calm events: kick_off, half_time, full_time, var_review, substitution, pass_accuracy, clean_sheet, assist.
# We will use Regex to find these cases and apply calm images.
# Actually, an easier way is to map the image keys back to standard keys like `commentator1Image` and `commentator2Image` 
# and dynamically assign the calm or high energy image based on the event type inside the component.

