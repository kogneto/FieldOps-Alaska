# FieldOps Alaska

A field companion for telecom technicians who travel to remote sites in Alaska. This glossary fixes the words the app and its docs use for the people, places and paperwork involved.

## Language

### Places

**Site**:
A place with telecom equipment that technicians travel to and work at, such as a repeater, a fiber hut, a cell tower or an earth station. A site is in exactly one region.
_Avoid_: Location, facility

**Region**:
A named part of Alaska used to group sites and operators. A site is in exactly one region; an operator serves one or more.
_Avoid_: Area, district

### People and organizations

**Operator**:
A business that moves crew or freight by air, sea or land.
_Avoid_: Carrier, transport provider, charter (as a name for the business)

**Client**:
The organization the work is done for. It sets a site's confidentiality and holds its access secrets.
_Avoid_: Operator, network operator, carrier, customer

**Maintainer**:
The one named person who keeps the real records current and decides each record's confidence.
_Avoid_: Admin, dispatcher, editor

**Crew**:
The group of technicians who use FieldOps for real work, on real records.
_Avoid_: Team, users

**Tester**:
Someone who tries the public demo on sample data, without signing in.
_Avoid_: User, beta user

### Travel

**Trip**:
One outing by a technician: a date range, one or more sites, the operators chosen to reach them, and its own copy of the checklists.
_Avoid_: Visit, job, run

**Checklist**:
A named list of things to arrange, pack or carry before a trip, written by the maintainer. Each trip carries its own copy of every checklist.
_Avoid_: Prep list, kit list

**Route**:
One way of reaching a site: an operator, or driving yourself, with a mode and the months it works. A site has one or more; a trip uses one per site.
_Avoid_: Way in, access method, reach-by

### Getting into a site

**Qualification**:
Something a technician must hold to work at a site: a certification, a training record, a medical clearance or an issued badge.
_Avoid_: Credential, cert (as the general term)

**Qualification record**:
A technician's own list of the qualifications they hold and the month each expires, kept only on their phone.
_Avoid_: Profile, credentials, cert list

**Access secret**:
A gate code, key or lock combination that lets someone into a site. It is held by the client and never recorded in FieldOps.
_Avoid_: Credential, gate code (as the general term)

**Confidentiality**:
The client's instruction for how a site's record may be shared. An **Open** record may be shared freely. A **Confidential** record stays inside the crew, except that an operator may be told the place and date needed to get there, never what the site is or who the client is.
_Avoid_: Public, restricted, client-confidential, classification

### Trusting a record

**Confidence**:
The maintainer's judgment of how far a record can be relied on. High means act on it; medium means confirm by phone before committing travel or money; low means treat it as a lead only.
_Avoid_: Reliability, trust level

**Verified date**:
The date the maintainer last confirmed a whole record against its source.
_Avoid_: Last updated, last checked

**Stale**:
Said of a record whose verified date is older than the freshness cutoff, currently 60 days.
_Avoid_: Outdated, expired

### In the app

**Saved list**:
The sites and operators a technician has starred for quick access. It has no bearing on what is available offline.
_Avoid_: Offline pack, offline list, favorites

**Feedback note**:
A short anonymous message a tester sends from the app, optionally tied to one site or operator.
_Avoid_: Report, ticket, change request
