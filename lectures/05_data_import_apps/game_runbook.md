# Class 05 game runbook: Find Your Seat and the Import Heist

Wed Sep 9, 2026. Both games report to one projector board. The seat a student
taps in the opener is their identity for the whole class; no names anywhere.

## Addresses and keys

| What | Address |
|---|---|
| Board (projector, with admin controls) | `https://isa401-find-your-seat.vercel.app/board?section=A&mode=opener&key=fall2026` |
| Students, opener | `https://isa401-find-your-seat.vercel.app/?section=A` (linked on the Game 1 slide; `section=B` for B) |
| Students, Heist ticket | `https://isa401-import-heist.vercel.app/?section=A` |
| Monday's data | `readr::read_csv("https://isa401-find-your-seat.vercel.app/api/export?section=A")` |

Board keys: **S** sound, **F** fullscreen, **T** show or hide the code chain
(hidden by default; open it in the debrief), **R** replay the run at 30x,
**C** finish sequence, **Esc** closes it. The Section and Mode chips are at
the top left. The reset button only appears when the address carries the key.

## The night before (five minutes)

1. Open the board address above in Chrome. Confirm "Run" shows a number and
   the plan is empty with the Section A address and QR code covering it (attract mode).
2. Click the **B** chip, confirm the same. Click back to **A**.
3. Open `https://isa401-import-heist.vercel.app/api/stage1` in a tab and
   confirm the CSV appears. Close it.
4. Charge nothing, install nothing. There are no dependencies.

## Twenty minutes before each section

1. On the classroom PC, open the board with the key, pick the section chip.
2. Click **Start a new run for this section** twice (second click confirms).
   The run number goes up by one and every seat is dark. This is the only
   step that matters: an unreset section shows the other section's seats.
3. Click **Sound on**. Browsers refuse audio until someone clicks once.
4. Press **F** for fullscreen and drag the window to the projector.
5. Leave it. The section's address, a QR code for anyone on a phone, and
   the `fromJSON()` line are on screen while students settle, and the first
   tap dissolves them.

Do not open the board with the key on the projector if you can avoid showing
the address bar; the key is harmless (it only enables reset) but tidy.

## Part 1: Find Your Seat (slide "Game 1: Find Your Seat", 5:00 countdown)

**0:00.** Advance to the slide with the two section links. Say only: "Open
your section's link on this computer, tap the seat you are in, then answer three questions in
`class05.Rmd`. Every answer is one line of subsetting. Five minutes. Look up
now and then." Start the countdown.

**0:00 to 0:45, seats tap in.** Yellow circles appear as students tap. The
goal card reads "0 of N arrived" and N is the only headcount you will ever
need. Watch for a student whose seat lights up on the wrong side of the
aisle; tell them to tap again (a second tap moves the seat).

**0:45 to 2:00, level 1.** Yellow circles gain a red ring as students find
the business school's `code`. When the room's median clears level 1, the
projector cuts to the FSB facade for four seconds with
`campus[["Farmer"]]` on it. Say nothing; let them see it. The chain under the
plan now shows `"Farmer"` filled in and the next fragment still a yellow `?`.

**2:00 to 3:30, level 2, the trap.** Seats go solid red as they clear the
floor. Two things to watch:

- The **needs-a-hand halo**: an amber glow on a seat stuck on a level for
  75 seconds or more. Walk to that seat. Nine times in ten it is
  `floors[[2]]` (position, which is floor "1"); the phone already told them.
- The cut to the atrium photo with `campus$Farmer$floors[["2"]]` marks the
  moment more than half the room used the name, not the position. That is
  the sentence for the next slide.

**3:30 to 5:00, arrivals.** Seats turn black with a rank. Each arrival
chimes and toasts at the bottom of the plan; tables glow yellow when everyone
present at them has arrived. The finisher's own phone now shows the room live
("23 of 31 seats have arrived. Help a neighbor."), so early finishers have
something to do. Point at the halos and say "if you are done, the amber seats
need you."

**When every present seat has arrived**, or at 5:00, the finish sequence
fires on its own (confetti, first and median arrival, the level the room
spent longest on, the full chain). If it has not fired by the end of the
countdown, press **C**. Read the "spent longest on" stat out loud: it is
almost always level 2, and that is the bracket lesson in one number.

**Debrief (next slide, "One Table for Three Brackets").** Press **Esc** to
close the overlay, **T** to reveal the four lines of code under the plan,
then **R**: the five minutes replay in ten seconds while
you read the table's middle column. Then advance the deck.

Early finishers: "find your own class in
`campus$Farmer$floors[["2"]]$classes`."

## Between the games

Leave the board window open. Do not reset. The Heist counts over the seats
that tapped in this morning, and a reset would clear them.

## Part 2: the Import Heist (slide "Data Import for Cybersecurity Game", 6:00)

**Before advancing to the slide**, click the **Heist** chip on the board.
The stage goes dark, the strip reads Stage 1, Stage 2, Cleared, and every
seat from the opener shows as a dashed "here, not started" circle. The
chain shows the three calls with `ACCOUNT` and `NUMBER` in yellow; the
answers are never on the projector.

**0:00.** Advance to the Case tab. Say: "Same seat as this morning. Open the
ticket page, tap your seat, and copy the three calls; the highlighted parts
are what you find." Start the countdown. Put the ticket page on the other
half of the screen if you have room; otherwise the board alone is enough.

**0:00 to 2:00, stage 1.** Dashed circles turn yellow-ringed as students run
`read_csv()` with their seat in the address. Resist helping for three
minutes; the rule of engagement is "browser first, R second" and the
seven-row CSV answers itself. A seat still dashed at 2:00 has not run the
line; usually they forgot to tap the seat on the ticket page, so the address
they copied has no `seat=`.

**2:00 to 4:00, stage 2.** Red seats have the right key. The cut to
"Account identified" means half the room found `smithj31`. Halos work here
too: a yellow seat with a halo has the wrong key, and the JSON they got back
already contains the alibi and the recipe.

**4:00 to 6:00, cleared.** Black seats with ranks. Each clear toasts. The
finish sequence fires when everyone present has cleared, which will not
happen in six minutes; press **C** at the end regardless.

**Debrief (Answer tab).** **Esc**, then read the "spent longest on" stat.
Then the point: the query parameter is FRED's `id` mechanic, and both stages
were Part 2 brackets on imported data. The replay of the incident is on
their phones; do not play it on the projector.

## After class (two minutes)

1. Do **not** reset. Monday's warm-up imports this run.
2. Save a copy anyway, in case a reset happens by accident:
   open `https://isa401-find-your-seat.vercel.app/api/export?section=A` and
   `...section=B` in a browser and save each as CSV into `data/`.
3. Note the run numbers shown on the board; `run=9` in the export address
   recovers a run after a reset.

## If something goes wrong

| Symptom | Cause | Fix |
|---|---|---|
| Board says "Board offline" | Network on the classroom PC | Reload. The phones report independently; nothing is lost. |
| A seat lights in the wrong section | Student opened the other section's link | Have them tap the section button on their phone; their seat moves. |
| Student's phone is stuck on an old level | Their browser kept last week's state | The "Start over on this device" link in the How-this-works card. |
| Sound does nothing | The click came before the tab had focus | Click **Sound on** twice. |
| Half the room halos at once | Threshold is 75 seconds and the room is slow | Ignore the halos; the level colors still tell the story. |
| Stage 1 CSV looks old in a tab | Five-minute cache on that endpoint | Nothing to do; the file has not changed since Sep 2. |
| A Heist seat never lights | Address copied without `seat=`; they tapped no seat on the ticket page | Tap the seat, copy the call again. The game itself still works. |
| The reset button is missing | Address without `&key=fall2026` | Add it. |
| A student finished early and is bored | | "Find the amber seats. They need you." |

## What the board never shows

The answers (`MUFSB`, the counts, `smithj31`, `6`), any name, any count
over 42 or over 7 per table. Only seats that tapped in count.
