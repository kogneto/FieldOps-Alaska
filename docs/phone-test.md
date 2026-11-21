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
   - Find: search for "Coldfoot", then clear it and filter by each region chip (Southeast, Southcentral, Interior, All regions)
   - Three different site pages, including Hatcher Pass and one marked Confidential
   - Three different operator pages, including the ferry system
   - Trips, and Qualifications under it
   - Saved
   - Send feedback
4. On a site page, tap the star (**Add to Saved**), then open Saved and check the site is listed. Remove it again.
5. On a site page, tap **Open in maps**. Offline, the maps app may not load tiles; pass if it opens with the pin's coordinates.

Pass if every screen opens offline and the star works.

## 3. Trips work offline (slice 3)

Stay offline.

1. Open the Coldfoot site page and tap **Plan a trip**.
2. On the dates screen, use + to make it three days, then tap **Start trip**.
3. Check the trip page shows the site, a route for it, a Qualifications list and the checklists. Some lists may start skipped with a note saying when they're needed.
4. Tick two items on a checklist. Skip one whole checklist, then **Include** it again.
5. Go back to another site page (for example Hatcher Pass), and tap **Add to this trip**. Check the trip now lists both sites.
6. Change the route for one site by hand.
7. Open Qualifications and mark one the trip needs as **I hold this**, with last month as its expiry month. Go back to the trip and check that qualification is flagged as expired. (Expiring in the trip's last month counts as valid, so this month won't show a flag.)
8. Close the app fully and reopen it, still offline. Check the trip, the ticks and the qualification record are all still there.
9. On the trip, tap **Share trip plan**. Pass if the share sheet opens with the plan as text (you can cancel it). If one of the sites is confidential, the text should start with "Confidential — share inside the crew only".

## 4. Feedback written offline sends later (slice 2)

1. Still offline, on the Hatcher Pass site page, tap **Send feedback**.
2. Write "Phone test, iPhone, offline note" (or Android), with the time, and send it.
3. Check it says **Saved on this phone. It will send when you have signal.**
4. Close the app fully.
5. Turn airplane mode off and wait for signal. Open the app.
6. On the PC, run `bun run notes`.

Pass if the note shows up within a minute, tied to the Hatcher Pass site. If it doesn't, try once more by switching away from the app and back to it, then run `bun run notes` again.

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

- Delete the test trip (it takes a second tap to confirm) and clear the qualification record if you want the phone clean.
- Update [roadmap.md](../roadmap.md): replace each "Not yet checked on a real phone" with which phones passed, and when.
- Turn each failure into a roadmap item or a fix.
