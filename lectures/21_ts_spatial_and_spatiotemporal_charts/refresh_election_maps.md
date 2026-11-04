# Election maps for Class 21

Part 2 of the deck shows four 2026 election maps:

| Slide | What it shows | How |
|---|---|---|
| Last Night: A Choropleth of House Districts | ABC News live House map | **Live embed**, nothing to do |
| Ohio Last Night: What Does Color Mean? | ABC News live Ohio governor widget | **Live embed**, nothing to do |
| Cartograms (second slide) | The Guardian's House cartogram (by The Downballot) | **Snapshot** taken 5:40 AM ET, Nov 4 |
| Proportional Symbols Map (first slide) | NYT "Shift from 2024" arrows if saved, else the 2004 Bush vs. Kerry map | **Snapshot** (optional, below) |

Every map has a **Source:** line with a link under it. A snapshot's line also gives the time it was taken (the
file's time stamp).

## Why some maps are live and some are snapshots

A page can only be embedded if it allows framing. ABC News does. The NYT sends `X-Frame-Options: DENY`, which
gift links do not change, and also blocks automated browsers. The Guardian sends `SAMEORIGIN`, and its
embeddable results module leaves the maps on "Loading map..." inside a frame. So the NYT and Guardian maps are
snapshots.

The live embeds load only when their slide is shown: a frame on a hidden slide loads at 0x0, and some pages
(Gapminder, for one) never redraw. The script that does this sits on the "Live Demo: Creating Bubble Charts in
Power BI" slide. If ABC moves its map (an ad slot sits above it), change `off` in that slide's `live_frame()`
call. The map tolerates about 100 px of drift either way.

## Optional: snip the NYT proportional-symbol map (about 2 minutes)

1. Open the gift link in Chrome:
   <https://www.nytimes.com/interactive/2026/11/03/us/elections/results-house.html?unlocked_article_code=1.N1E.s7BX.kaG3TDRQxVFD&smid=url-share>
   and pick the **Shift from 2024** view (arrows).
2. Press **Win+Shift+S**, choose Rectangle, and drag around the map and its legend.
3. From this folder (R 4.6.1):

   ```
   "C:\Program Files\R\R-4.6.1\bin\x64\Rscript.exe" tidy_election_maps.R house_shift
   ```

   It copies the newest PNG from `Pictures\Screenshots` to `figures/ts_spatial/nyt_2026_house_shift.png`, trims
   it, and keeps the screenshot's time stamp. The slide then uses it with the NYT gift link as its Source.
4. Re-knit:

   ```
   "C:\Program Files\R\R-4.6.1\bin\x64\Rscript.exe" -e "rmarkdown::render('21_ts_spatial_and_spatiotemporal_charts.Rmd')"
   ```

To retake the Guardian cartogram, snip it from the House results section of
<https://www.theguardian.com/us-news/ng-interactive/2026/nov/03/midterm-elections-full-results-senate-house-governor-races>
and run the script with `house_cartogram`.

The screenshots are news content: they are in the deck for class discussion with a source line. Keep them out of
anything other than the course slides.
