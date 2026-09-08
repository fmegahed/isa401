"""Draw plan.svg: a flat top-down plan of FSB 2050 with 42 seats.

Layout (from Fadel, Sep 2026): front of the room at the top with a door in
each front corner, two screens mounted on the front wall, and the podium at
the left end of the left screen, near the left door. Six long tables in three rows and two columns, split by the centre aisle;
every table seats seven, all facing the front: 3 x 2 x 7 = 42. Windows run
along the back wall on both sides.

Seat id = side + row + "-" + position: L2-3 is the left table in row 2, third
seat counting 1 to 7 from left to right as you face the front (both sides).
Fill colours are Miami's: white empty, cornhusker yellow picked, yellow with a
red ring for level 1, Miami red for level 2, black for arrived.

Every seat is <g class="seat" data-seat="L2-3"> and every table is
<rect class="table" data-table="L2"> so the pages can restyle them by state. Usage: python make_plan.py  (writes plan.svg next to this file)
"""
from pathlib import Path

W, H = 900, 640
ROWS = (1, 2, 3)
ROW_Y = {1: 225, 2: 370, 3: 515}                  # chair centre lines
LEFT_X = [88 + 52 * k for k in range(7)]          # 88 .. 400
RIGHT_X = [500 + 52 * k for k in range(7)]        # 500 .. 812
DESK_H = 24

out = []
out.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" class="plan" role="img" aria-label="Plan of FSB 2050: six tables of seven seats in three rows">')
out.append('''<style>
  .plan .wall { fill: none; stroke: #4b5563; stroke-width: 4; }
  .plan .table { fill: #f3f4f6; stroke: #9ca3af; stroke-width: 1.5; }
  .plan .label { font: 600 13px "Segoe UI", Helvetica, Arial, sans-serif; fill: #6b7280; letter-spacing: .06em; text-transform: uppercase; }
  .plan .rowlabel { font: 600 12px "Segoe UI", Helvetica, Arial, sans-serif; fill: #9ca3af; text-anchor: middle; }
  .plan .fixture { fill: #e5e7eb; stroke: #9ca3af; stroke-width: 1.5; }
  .plan .seat .chair { fill: #FFFFFF; stroke: #9ca3af; stroke-width: 1.5; }
  .plan .seat .screen { fill: #d1d5db; stroke: #9ca3af; stroke-width: 1; }
  .plan .seat .id { font: 700 12.5px "Segoe UI", Helvetica, Arial, sans-serif; fill: #444; text-anchor: middle; pointer-events: none; }
  .plan .seat { cursor: pointer; }
  .plan .seat:hover .chair { stroke: #C41230; stroke-width: 2.5; }
  .plan .seat.picked .chair { fill: #EFDB72; stroke: #b9a53d; }
  .plan .seat.l1 .chair { fill: #EFDB72; stroke: #C41230; stroke-width: 3; }
  .plan .seat.l2 .chair { fill: #C41230; stroke: #8B0E20; }
  .plan .seat.l2 .id { fill: #fff; }
  .plan .seat.l3 .chair { fill: #C41230; stroke: #000000; stroke-width: 3; }
  .plan .seat.l3 .id { fill: #fff; }
  .plan .seat.done .chair { fill: #000000; stroke: #000000; }
  .plan .seat.done .id { fill: #fff; }
  .plan .seat.mine .chair { stroke-dasharray: 4 3; }
  .plan .table.lit { fill: #EFDB72; stroke: #C41230; stroke-width: 2.5; }
  .plan .seat.here .chair { fill: #f3f4f6; stroke: #9ca3af; stroke-dasharray: 4 3; }
  .plan .rank { font: 700 13px "Segoe UI", Helvetica, Arial, sans-serif; fill: #fff; text-anchor: middle; pointer-events: none; }
</style>''')

# room shell
out.append(f'<rect class="wall" x="40" y="40" width="{W-80}" height="{H-80}" rx="6"/>')
# two front doors, one in each front corner
out.append('<line x1="70" y1="40" x2="120" y2="40" stroke="#ffffff" stroke-width="6"/>')
out.append('<path d="M70 40 a50 50 0 0 1 50 50" fill="none" stroke="#4b5563" stroke-width="2"/>')
out.append('<text class="label" x="95" y="112" text-anchor="middle">Door</text>')
out.append(f'<line x1="{W-120}" y1="40" x2="{W-70}" y2="40" stroke="#ffffff" stroke-width="6"/>')
out.append(f'<path d="M{W-70} 40 a50 50 0 0 0 -50 50" fill="none" stroke="#4b5563" stroke-width="2"/>')
out.append(f'<text class="label" x="{W-95}" y="112" text-anchor="middle">Door</text>')
# two screens mounted on the front wall
out.append('<rect class="fixture" x="215" y="34" width="210" height="12" rx="3"/>')
out.append('<rect class="fixture" x="520" y="34" width="210" height="12" rx="3"/>')
out.append('<text class="label" x="320" y="70" text-anchor="middle">Screen</text>')
out.append('<text class="label" x="625" y="70" text-anchor="middle">Screen</text>')
# podium at the left end of the left screen, near the left door
out.append('<rect class="fixture" x="196" y="82" width="56" height="34" rx="4"/>')
out.append('<text class="label" x="224" y="136" text-anchor="middle">Podium</text>')
# windows along the back wall, both sides of the room
for x0 in (80, 570):
    out.append(f'<rect x="{x0}" y="{H-46}" width="250" height="12" fill="#dbeafe" stroke="#60a5fa" stroke-width="1.5"/>')
    out.append(f'<text class="label" x="{x0+125}" y="{H-54}" text-anchor="middle">Windows</text>')

# six tables: three rows, left and right of the aisle, seven seats each
n = 0
for r in ROWS:
    cy = ROW_Y[r]
    out.append(f'<text class="rowlabel" x="{W//2}" y="{cy+4}">{r}</text>')
    for side, xs in (("L", LEFT_X), ("R", RIGHT_X)):
        out.append(f'<rect class="table" data-table="{side}{r}" x="{xs[0]-24}" y="{cy-DESK_H-16}" width="{xs[-1]-xs[0]+48}" height="{DESK_H}" rx="4"/>')
        for k, cx in enumerate(xs, start=1):
            sid = f"{side}{r}-{k}"
            out.append(f'<g class="seat" data-seat="{sid}">'
                       f'<rect class="screen" x="{cx-11}" y="{cy-DESK_H-13}" width="22" height="10" rx="2"/>'
                       f'<circle class="chair" cx="{cx}" cy="{cy+10}" r="21"/>'
                       f'<text class="id" x="{cx}" y="{cy+14.5}">{sid}</text>'
                       f'</g>')
            n += 1

out.append(f'<text class="label" x="{W//2}" y="{H-8}" text-anchor="middle" style="text-transform:none; letter-spacing:0;">Plan of FSB 2050. Front of the room at the top; seats count 1 to 7 from left to right. Not to scale.</text>')
out.append('</svg>')
Path(__file__).with_name("plan.svg").write_text("\n".join(out), encoding="utf-8")
print("wrote plan.svg with", n, "seats:", len(ROWS), "rows x 2 tables x 7")
