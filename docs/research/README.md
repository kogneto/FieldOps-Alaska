# Research: operators for real trips

Notes gathered for [slice 5](../../roadmap.md) (real operators). Each operator note cites every fact to the operator's own page; a name found only on a third-party page is a lead, not a record. A fact goes into the app only once it has been re-read on the operator's page. The 18 operators below became the app's records on 25 Nov 2026, in `src/lib/operators.ts`.

## Which hubs

The ten busiest hubs a technician can't drive to from Anchorage, by passenger boardings in 2025.

Source: FAA, "Final CY2025 Enplanements at All Airports by State and Airport", dated 24 Sep 2026, Alaska rows on page 1. https://www.faa.gov/airports/planning_capacity/passenger_allcargo_stats/passenger/arp-cy2025-all-enplanements.pdf (linked from https://www.faa.gov/airports/planning_capacity/passenger_allcargo_stats/passenger)

| #   | Hub                | Airport | 2025 boardings | Region (DOT&PF plan)  | Note                                                           |
| --- | ------------------ | ------- | -------------- | --------------------- | -------------------------------------------------------------- |
| 1   | Juneau             | JNU     | 369,999        | Southeast             | [southeast-hubs-operators.md](southeast-hubs-operators.md)     |
| 2   | Bethel             | BET     | 169,624        | Yukon-Kuskokwim Delta | [anchorage-bethel-operators.md](anchorage-bethel-operators.md) |
| 3   | Ketchikan          | KTN     | 147,342        | Southeast             | [southeast-hubs-operators.md](southeast-hubs-operators.md)     |
| 4   | Sitka              | SIT     | 94,471         | Southeast             | [southeast-hubs-operators.md](southeast-hubs-operators.md)     |
| 5   | Kodiak             | ADQ     | 84,831         | Southwest             | [southwest-hubs-operators.md](southwest-hubs-operators.md)     |
| 6   | Nome               | OME     | 72,120         | Northwest             | [arctic-hubs-operators.md](arctic-hubs-operators.md)           |
| 7   | Kotzebue           | OTZ     | 57,929         | Northwest             | [arctic-hubs-operators.md](arctic-hubs-operators.md)           |
| 8   | Utqiaġvik (Barrow) | BRW     | 43,574         | Northwest             | [arctic-hubs-operators.md](arctic-hubs-operators.md)           |
| 9   | King Salmon        | AKN     | 37,302         | Southwest             | [southwest-hubs-operators.md](southwest-hubs-operators.md)     |
| 10  | Dillingham         | DLG     | 33,595         | Southwest             | [southwest-hubs-operators.md](southwest-hubs-operators.md)     |

Left out because they're on the road system from Anchorage: Fairbanks (563,672), Deadhorse (106,752, by the Dalton Highway), Kenai (64,627) and Homer (22,117), plus Anchorage's own Merrill Field. Red Dog Mine (15,766) is a private mine strip. Next after Dillingham: Petersburg (24,579), Unalaska (20,507), Cordova (18,124).

## The list: operators by hub

Every operator below was confirmed on its own site, or on the State's site for the ferry. Details and sources are in each hub's note, and each note's "Checked by hand" section lists exactly what was re-read in a browser on 24 Nov 2026. Most hub phone numbers and addresses were re-read then, and the rest of what went into the records on 25 Nov (see below). Taquan Air's terminal address was not found on re-reading, so it is left out. "Via" means the operator's hub office is run by another company.

| Hub         | Anchorage to the hub                                                                                                     | Hub to villages                                                                                          | By sea                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Juneau      | Alaska Airlines (people); Alaska Air Cargo                                                                               | Alaska Seaplanes                                                                                         | Alaska Marine Highway ferry; Alaska Marine Lines barge (year-round); Samson Tug and Barge |
| Bethel      | Alaska Airlines; Alaska Air Cargo; Northern Air Cargo; Lynden Air Cargo; Everts Air Cargo (via Dependable Freight)       | Grant Aviation; Ryan Air; Yute Commuter Service                                                          | Alaska Marine Lines (April to October)                                                    |
| Ketchikan   | Alaska Airlines; Alaska Air Cargo                                                                                        | Taquan Air                                                                                               | Alaska Marine Highway; Alaska Marine Lines; Samson                                        |
| Sitka       | Alaska Airlines; Alaska Air Cargo                                                                                        | Alaska Seaplanes                                                                                         | Alaska Marine Highway; Alaska Marine Lines; Samson                                        |
| Kodiak      | Alaska Airlines; Alaska Air Cargo                                                                                        | Island Air Service                                                                                       | Alaska Marine Highway; Alaska Marine Lines; Samson                                        |
| Nome        | Alaska Airlines; Alaska Air Cargo; Northern Air Cargo; Lynden Air Cargo; Everts (via Ryan Air)                           | Bering Air; Ryan Air                                                                                     | Alaska Marine Lines (April to October)                                                    |
| Kotzebue    | Alaska Airlines; Alaska Air Cargo; Northern Air Cargo; Lynden Air Cargo; Everts (via FBX)                                | Bering Air; Ryan Air                                                                                     | Alaska Marine Lines (April to October)                                                    |
| Utqiaġvik   | Alaska Airlines; Alaska Air Cargo; Northern Air Cargo                                                                    | Wright Air Service (lists North Slope villages; which it flies from Utqiaġvik is in an unread timetable) | Alaska Marine Lines (April to October)                                                    |
| King Salmon | Alaska Airlines; Alaska Air Cargo; Northern Air Cargo; Everts (via King Salmon Ground); Katmai Air (seat fares, charter) | Grant Aviation                                                                                           | Alaska Marine Lines via Naknek (mid-April to mid-October)                                 |
| Dillingham  | Alaska Airlines; Alaska Air Cargo; Northern Air Cargo; Everts (via E-Z Freight)                                          | Grant Aviation; Antler Aviation (charter)                                                                | Alaska Marine Lines (seasonal)                                                            |

That is 18 operators: 15 air and 3 sea.

**Getting a loadout to a village:** Grant Aviation (from Bethel, Dillingham and King Salmon) and Bering Air (from Nome and Kotzebue) both say to tell the Anchorage operator that the shipment continues from the hub via them. Everts lists "downline carriers" from its hub offices. Alaska Seaplanes charges $25 to take freight over from Alaska Airlines or ACE Air Cargo.

**Still open:**

- Ravn Alaska's site is down (Cloudflare error), and news reports say it left several of these hubs.
- Alaska Airlines' baggage limits weren't confirmed. Its route pages (fares only) show Anchorage–Barrow fares for December 2026 and May 2027, Anchorage–Dillingham fares for every month November 2026 to April 2027, and Anchorage–King Salmon fares in December 2026. So none looks summer-only, but no schedule or nonstop status was read.
- Bethel by barge: Alaska Marine Lines names Bethel among its "major hub ports", April to October (https://www.lynden.com/aml/solutions/western-alaska/), and its locations page lists a seasonal Bethel service center (see below).
- Schedules, dangerous-goods rules and per-piece limits were read only by the research agents, so re-read each one before it goes in a record.
- Two numbers conflict on the operators' own pages: the Alaska Marine Highway Ketchikan terminal (907-228-6886 vs 907-225-6886), and Everts' Dillingham email link (exfreightak vs the ezfreightak shown).

## Region names

The State's transportation department (DOT&PF) splits rural Alaska into these area plans, which cover all ten hubs. https://dot.alaska.gov/stwdplng/areaplans/area_regional/

- **Southeast Alaska** (SEATP): Juneau, Ketchikan, Sitka, going by the area map on that page; the plan's own site wasn't read.
- **Southwest** (SWATP): Lake and Peninsula, Kodiak Island, Aleutians East, Aleutians West and Bristol Bay boroughs, the Dillingham Census Area, Adak and the Pribilofs. So Kodiak, King Salmon and Dillingham. https://dot.alaska.gov/stwdplng/areaplans/area_regional/sw.shtml
- **Northwest Alaska** (NWATP): the North Slope Borough, Northwest Arctic Borough, Norton Sound/Seward Peninsula and the Middle Yukon River Basin. So Nome, Kotzebue and Utqiaġvik. https://dot.alaska.gov/stwdplng/areaplans/area_regional/nw.shtml
- **Yukon-Kuskokwim (Y-K) Delta**: Bethel. https://dot.alaska.gov/stwdplng/areaplans/area_regional/ykd.shtml
- Also: Prince William Sound, Interior Alaska, and the Anchorage and Fairbanks metropolitan plans.

The app's regions today are Southeast, Southcentral and Interior. The maintainer decides the new list.

## Operators that serve several hubs

Grant Aviation's site refuses automated fetches, so it was read by hand. Its section is in the [Bethel note](anchorage-bethel-operators.md#grant-aviation). Its routes page also lists, from https://www.flygrant.com/routes-and-destinations/ :

- From Dillingham: Togiak, Twin Hills, Manokotak (spelt "Manakotak" there), Clarks Point, King Salmon, Levelock, New Stuyahok, Ekwok, Koliganek.
- From King Salmon: Levelock, South Naknek, Egegik, Igiugig, Dillingham, Pilot Point, Ugashik, Port Heiden, Perryville, Chignik Bay, Chignik Lake, Chignik Lagoon.

## Checked by hand on 25 Nov 2026

Re-read in Chrome before the records were written, so every fact in `src/lib/operators.ts` has been read on the operator's own page by hand:

- Alaska Air Cargo, Anchorage station: 4100 Old International Airport Road, hours. https://public.alaskacargo.com/network-locations/anchorage
- Everts Air Cargo: Anchorage 6111 Lockheed Avenue and hours (https://evertsair.com/contact); every hub office block, its phone, email, hours and village list (https://evertsair.com/cargo/destinations-map).
- Alaska Seaplanes: 907-789-3331, info@ and charter@, phone hours. The cargo office's Sunday is "10:00am - 2:00pm" on this page but "Closed" on the cargo page, so the record gives both. https://www.flyalaskaseaplanes.com/about/get-in-touch.html
- Alaska Marine Highway: reservations (800) 642-0066, Mon–Fri 8:00am–3:30pm AST, and the terminal list (https://dot.alaska.gov/amhs/contact.shtml); Juneau, Sitka and Kodiak terminal pages.
- Northern Air Cargo: Anchorage hours Mon–Fri 6:00 a.m.–8:00 p.m., Sat 9:00 a.m.–5:00 p.m. https://nac.aero/contact/
- Yute Commuter Service: fly@yutebethel.com and 3551 Chief Eddie Hoffman (page footer), and the three route tabs (https://yutebethel.com/routes/). The contact page's hours sit under the Soldotna station, so they are left out.
- Katmai Air: Anchorage office and reservations (907) 243-5448, King Salmon office (907) 246-3079, reservations Mon–Fri 8:00 AM–5:00 PM year-round. https://katmaiair.com/contact-us/
- Antler Aviation: (907) 843-3136, antleraviationandwildlife@gmail.com, P.O. Box 798 Dillingham, "operates year-round, 7 days a week". https://www.antleraviation.com/contact-2
- Alaska Marine Lines: every Alaska service center on https://www.lynden.com/aml/about/locations/ , including a seasonal Bethel one at 110 Oscar Way, 907-543-4649, which the first research missed. Its Naknek entry there gives Mile 2 Alaska Peninsula Highway, where the Naknek page gives #1 Dock Street. Southeast "Year-round, twice-weekly service" (https://www.lynden.com/aml/solutions/southeast-alaska/) and the Arctic list including Utqiagvik (https://www.lynden.com/aml/solutions/western-alaska/).
- Ryan Air: the Bethel, Nome and Kotzebue village lists. https://ryanalaska.com/schedules/
- Wright Air Service: 3842 University Avenue South, Fairbanks, hours, numbers (https://www.wrightairservice.com/); destinations list with Utqiagvik, Atqasuk, Nuiqsut, Point Hope, Point Lay and Wainwright (https://www.wrightairservice.com/destinations). Its timetable is still unread.
- Island Air Service: hours, and the six Kodiak Island communities. https://flyadq.com/air-cargo , https://www.flyadq.com/flight-information/destinations/

Left out of the records because they weren't re-read: schedules, weight limits and dangerous-goods rules (except Alaska Seaplanes' cargo page, read on 24 Nov), Taquan Air's address, Island Air's float basin address, and individuals' names on village agent lists.
