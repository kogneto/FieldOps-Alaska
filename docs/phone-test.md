# Phone test script

A hand check of the public demo on a real phone, for the items the roadmap marks "Not yet checked on a real phone" in slices 1, 2 and 3. Run it once on an iPhone (Safari) and once on an Android phone (Chrome). It takes about 20 minutes per phone.

Demo: <https://fieldops-alaska.andy-deloose.workers.dev>

Write down the phone, OS version and browser at the top of your notes, and mark each step pass or fail. For a failure, note what you saw and take a screenshot.

## Before you start

- Charge the phone and have signal (Wi-Fi or cellular).
- If the demo was opened on this phone before, clear its site data first so the test starts from nothing:
  - iPhone: Settings → Apps → Safari → Advanced → Website Data, find the workers.dev entry and delete it. If the app is already on the home screen, remove it too.
  - Android: Chrome → ⋮ → Settings → Site settings → All sites, find the workers.dev entry and clear it. Uninstall the app from the home screen if it's there.
- Have the PC nearby for step 5, to read feedback notes with `bun run notes`.

**Airplane mode on iPhone:** turning on airplane mode can leave Wi-Fi or Bluetooth on if you turned them on in airplane mode before. Each time this script says "go offline", check that Wi-Fi is off as well, in Control Center.

## 1. Install

1. With signal, open the demo in the browser.
2. Wait until the home screen has fully loaded, then wait 10 more seconds so the app can finish caching itself in the background.
3. Install it:
   - iPhone: Share → Add to Home Screen → Add.
   - Android: ⋮ → Add to home screen (or Install app) → Install.
4. Open it from the home screen icon.

Pass if it opens full screen, with no browser address bar, and the status line under the header says **Online** and **Records as of** a date.

## 2. Every screen opens offline (slice 1)

1. Close the app fully (swipe it away), go offline, and open it from the home screen icon.
2. Check the status line now says **Offline**.
3. Visit each of these and check it loads, not the "No signal" page:
   - Home
   - Trips, and Your qualifications and Your sites under it
   - Sites
   - Find: search for "Hooper Bay", then clear it and filter by each region chip (Southeast, Southwest, Yukon-Kuskokwim Delta, Northwest, All regions)
   - Three different operator pages, including the ferry system
   - Saved
   - Send feedback
4. On an operator page, tap the star (**Add to Saved**), then open Saved and check the operator is listed. Remove it again.

Pass if every screen opens offline and the star works.

## 3. Trips work offline (slices 3 and 4)

Stay offline.

1. Open Trips and tap **Plan a new trip**.
2. Under "Type in the site", enter "Phone test site" with the village "Bethel", and tap **Add and continue**.
3. On the dates screen, use + to make it three days, then tap **Start trip**.
4. Check the trip page says "Next: Get ready", and that the **Get ready** step is open with the prep checklists. Some lists may start skipped with a note saying when they're needed.
5. Tick two items on a checklist. Skip one whole checklist, then **Include** it again.
6. Under **Plan**, tap **Add a site**, type in "Second test site", and tap **Add to this trip**. Check both sites are listed with a **Confidential** tag, then move the second one up with its ↑ button.
7. Tap the first site's name to open its page. Set the kind to **Cell tower**, and tick **Tower climb cert** under "Qualifications needed". Go back to the trip and check the parts kit is now included and Tower climb cert is in the Qualifications list under **Get ready**.
8. Open Your qualifications and mark Tower climb cert as **I hold this**, with last month as its expiry month. Go back to the trip and check it's flagged as expired. (Expiring in the trip's last month counts as valid, so this month won't show a flag.)
9. Close the app fully and reopen it, still offline. Check the trip, its two sites in their new order, the ticks and the qualification record are all still there.
10. On the trip, tap **Share trip plan**. Pass if the share sheet opens with the plan as text (you can cancel it), starting with "CONFIDENTIAL — keep this plan with the technicians working these sites."

## 3b. The loadout and steps work offline (slice 4)

Stay offline, on the same trip.

1. Open **Get ready** and tap **Done · Next step**. Check **Build and ship the loadout** opens and the screen scrolls to it.
2. In that step, tap **Add a tub**, then **Start from the tower site parts kit**. Check six items appear under "Not on a pallet or in a tub".
3. In "Add a tool or part", choose **Tub 1**, type "Bear spray", tick **Dangerous goods**, and tap **Add to the loadout**. Check the form stays open and the summary says "7 items on 1 tub" with "1 to declare as dangerous goods".
4. Under **Pre-loadout** in the same step, check it warns to declare Bear spray. Tap **All packed** beside Tub 1, type "027 1234" as the waybill number, and tap **Done · Next step**.
5. In **Travel to** the first site, tap an operator. Check a **Call** button appears with its number. Tap **Done · Next step**.
6. In the **Arrival checklist**, check it lists only Bear spray and says "Shipped with waybill 027 1234". Add "Spare fuse" under "Picked something up?", and check it appears ticked.
7. Under **Plan**, tap − on "First day" until the trip's dates are in the past. Check the trip still says **Under way**.
8. Close the app fully and reopen it, still offline. Check the trip opens on the step you were on, with the loadout, ticks and waybill all still there.
9. Open **Return checklist** and tap **Done · Finish the trip**. Check the trip now says **Done**.

## 3c. Travel works offline (slice 4)

Stay offline, on the same trip.

1. Open the first site's page from the trip. Under "Where it is", tap **Use where I am now**. Check coordinates fill in (allow location if the phone asks), then go back.
2. Open the **Travel to** step for the first site. Choose an operator if you haven't. Under "Where you meet the operator", type "Bethel airport" with the address "Bethel Airport". Under "Lodging", type "Test Inn".
3. Tap **Directions** under the meeting place. Pass if the maps app opens searching for Bethel Airport (it may not load offline). Come back to FieldOps.
4. Tap **Directions to the site**. Pass if the maps app opens at the coordinates from step 1.
5. Under "Travel documents", leave **Boarding pass** chosen and tap **Add a boarding pass**. Pick a screenshot from your photos. Check it says **Saved on this phone.** and a thumbnail appears.
6. Tap the thumbnail. Check it opens full screen, then tap **Close**.
7. Close the app fully and reopen it, still offline. Check the meeting place, lodging and boarding pass are all still there.

## 4. Feedback written offline sends later (slice 2)

1. Still offline, on the Alaska Marine Highway operator page, tap **Send feedback**.
2. Write "Phone test, iPhone, offline note" (or Android), with the time, and send it.
3. Check it says **Saved on this phone. It will send when you have signal.**
4. Close the app fully.
5. Turn airplane mode off and wait for signal. Open the app.
6. On the PC, run `bun run notes`.

Pass if the note shows up within a minute, tied to the ferry operator. If it doesn't, try once more by switching away from the app and back to it, then run `bun run notes` again.

## 5. Feedback with signal

1. With signal, on the Home screen, tap **Send feedback**, write "Phone test, online note", and send it.
2. Check it says **Sent. Thank you.**
3. Run `bun run notes` on the PC and check it arrived, not tied to any record.

## 6. Gloves and outdoors (optional, but worth doing)

Do steps 2 and 3 again outside, wearing the gloves a technician would wear, in daylight.

Note any control that took more than one try to hit, any text you couldn't read in the sun, and anything you had to take a glove off for.

## 7. A new version takes over (only after the next deploy)

Do this the next time you run `bun run deploy`, on a phone that already has the app installed.

1. With signal, open the app and leave it open for 10 seconds.
2. Close it fully and reopen it.

Pass if the change from the deploy shows up on the second launch, not the first.

## After the test

- Delete the test trip (it takes a second tap to confirm), then the two test sites under Sites, and clear the qualification record if you want the phone clean.
- Update [roadmap.md](../roadmap.md): replace each "Not yet checked on a real phone" with which phones passed, and when.
- Turn each failure into a roadmap item or a fix.
