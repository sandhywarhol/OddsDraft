const fs = require('fs');
let code = fs.readFileSync('src/app/live/[contestId]/page.tsx', 'utf8');

// Change `(latestEvent?.type === 'full_time' && !showPopup) || matchCompleted`
// to `((latestEvent?.type === 'full_time') || matchCompleted) && !showPopup`
code = code.replace(
  "const shouldShow = (latestEvent?.type === 'full_time' && !showPopup) || matchCompleted;",
  "const shouldShow = ((latestEvent?.type === 'full_time') || matchCompleted) && !showPopup;"
);

// We also need to fix the referee bubble size to 2.5x larger, which means ~font size increase.
// The user says "perbesar chat bubble referee 3x lebih besar"
// I will edit globals.css to scale it, because it's easier.
// Wait, I can just use a transform in the inline style.
