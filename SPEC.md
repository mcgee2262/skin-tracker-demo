# Skin Tracker — Feature Spec

**Goal:** 90-Day Clear Skin Challenge (blackheads). One daily check-in; everything else is automatic.

---

## Navigation
Bottom tab bar (iOS style): **Today · Progress · Photos · Products**.
**Check In** is a full-screen flow opened from Today (no tab).

---

## 1. Today tab
- Header: today's date (small caps) + large title **"Day N of 90"** (N = days since challenge start + 1, capped display at 90).
- Streak pill (flame icon + number) = consecutive days with a check-in, ending today or yesterday.
- **Score card:** ring showing Clear Skin Score (0–100), rank name, change vs. yesterday ("+3 since yesterday"), and "X pts to {next rank}".
- **Quote card** (blue, large type, always shown):
  > "No one buys from chuds."
  > — Blake B Sales
- **Routine list** (grouped iOS list): Morning row and Night row, each with a check circle, subtitle of steps, and status (Done / Tonight / Missed). Tapping a row toggles it for today (also editable in Check In).
  - Night subtitle shows "Wash, Differin, Cetaphil" on Differin nights and "Wash, Cetaphil (skip Differin)" on skip nights — see Routine logic.
- Big **Check In** button pinned above the tab bar. If already checked in today, it reads **"Checked in ✓ — Redo"**.

## 2. Check In flow (full screen, black background)
Top: **Cancel** (left) + segmented step indicator **Photo · Spots · Routine**.

**Step 0 — Timelapse intro (auto):**
- Plays all previous photos Day 1 → yesterday, oldest to newest.
- Total duration always ~3 seconds: frame time = 3000 ms / photo count (min 40 ms, max 600 ms).
- Tap anywhere to skip.
- Day 1 (no photos yet): show "Day 1. Let's go." for 1.5s instead.
- Last frame (yesterday's photo) crossfades into the live camera.

**Step 1 — Photo:**
- Live front camera via `getUserMedia` (`facingMode: "user"`), mirrored preview.
- **Ghost overlay:** yesterday's photo at ~35% opacity over the live feed + a dashed face-oval guide.
- Shutter button (white iOS-style ring). Flip-camera button. Thumbnail of yesterday bottom-left.
- On capture: draw video frame to canvas, un-mirror, export JPEG (quality 0.85, max 1080px wide), upload to `health-photos/{user_id}/skin/{date}.jpg` (upsert).
- Fallback if camera permission denied: `<input type="file" accept="image/*" capture="user">`.

**Step 2 — Spots:**
- Show the photo just taken, full width.
- Tap to drop a marker (blue dot, 24px hit area). Tap a marker to remove it.
- Counter: "N spots". Store each spot as normalized `x, y` (0–1) relative to the photo.
- "Same as yesterday" shortcut button copies yesterday's spot positions as a starting point (user can then remove healed ones).

**Step 3 — Routine:**
- Two toggles: **Morning** (Wash · SPF moisturizer) and **Night** (Wash · Differin* · Cetaphil). *Differin omitted on skip nights.
- **Done** saves the check-in, computes score, returns to Today with a short score-change animation.

## 3. Progress tab
- Large title "Progress".
- **Score chart:** line + light fill of daily score, x-axis Day 1 → Day 90, today highlighted.
- **Purge note** (shown only on days 8–28): "Weeks 2 to 4: a small dip is normal while Differin purges. Keep going."
- **Problem Zones heat map:** face oval; aggregate all spot positions from the last 7 check-ins into a blurred density map (blue scale, darker = more). Caption names the hottest zone (forehead / nose / cheeks / chin / jaw — map by normalized y/x bands).
- **Stats:** Spots today vs. Day 1 ("24 · Down from 40"); Routine last 7 days ("13/14").
- **Before and After** list: Day 30 / 60 / 90 rows. Locked until reached ("in 18 days"); when unlocked, opens a side-by-side Day 1 vs. that day.
- **Ranks row:** Rookie → Closer → Top Seller → Chad Salesman, current highlighted.

## 4. Photos tab
- Large title "Photos" + **Timelapse** button (plays all photos full screen, ~3–6s, tap to close).
- **Compare panel:** two photos side by side (defaults: Day 1 and latest).
- **Grid:** 4 columns, 3:4 tiles, "Day N" label. Tap selects for compare (max 2, blue check badge, tapping a third replaces the oldest selection).

## 5. Products tab
- Large title "Products" + total cost of items not yet purchased for the selected house.
- iOS segmented control: **Mom's House | Dad's House** (remember last choice in localStorage).
- Grouped list per house. Each row: name, usage note, price, status pill, "Target ›" link (opens in new tab).
- Tap status pill to cycle: **Not purchased → Purchased → Running low → Not purchased**. "Running low" items sort to the top.
- Cetaphil starts as **"Have it?"** (status `unknown`); tapping cycles it into the normal statuses.
- Seed data in `supabase/seed.sql` (same 4 items for both houses).

---

## Clear Skin Score (`score.ts`, pure functions)
```
baseline   = spot_count on the first check-in of the challenge (min 1)
spotsNow   = average spot_count of the last 3 check-ins (smooths noise)
spotPart   = clamp(100 * (1 - spotsNow / baseline), 0, 100)
routinePart= 100 * (routine steps done in last 7 days) / 14     // AM + PM per day; days before Day 1 not counted (use days elapsed * 2 as denominator if < 7 days)
score      = round(0.7 * spotPart + 0.3 * routinePart)
```
Ranks: **Rookie** 0–39 · **Closer** 40–69 · **Top Seller** 70–89 · **Chad Salesman** 90–100.
Store the computed score on each check-in row so the chart is just a read.

## Routine logic (`routine.ts`, pure)
- Days 1–14: Differin on **odd** challenge days only (every other night). Even days = skip night.
- Day 15+: Differin every night.
- `isDifferinNight(dayNumber): boolean` and `nightSteps(dayNumber): string[]`.

## Data rules
- One check-in per calendar day (America/New_York). Redo overwrites that day's row, spots, and photo.
- Missed days are simply absent; streak resets; challenge day count keeps going by date.
- Challenge start date defaults to the first check-in date; editable in a small sheet (gear icon on Today header) along with Sign out.

## Out of scope (for now)
AI photo analysis, notifications, multiple users, factor tags (sleep/diet), Health Center integration code (just keep the data layout ready).
