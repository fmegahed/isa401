"""Natural Earth 110m land (world-atlas TopoJSON, public domain) -> cropped SVG path.
Equirectangular, lon [-100, 35] x lat [22, 62], x-scale 3.7 (cos of the mid latitude), y-scale 5.
"""
import json, sys
topo = json.load(open(sys.argv[1], encoding="utf-8"))
sc, tr = topo["transform"]["scale"], topo["transform"]["translate"]

def decode(arc):
    x = y = 0; pts = []
    for dx, dy in arc:
        x += dx; y += dy
        pts.append((x * sc[0] + tr[0], y * sc[1] + tr[1]))
    return pts
arcs = [decode(a) for a in topo["arcs"]]

def ring(idxs):
    pts = []
    for i in idxs:
        a = arcs[i] if i >= 0 else list(reversed(arcs[~i]))
        pts.extend(a if not pts else a[1:])
    return pts

LON0, LON1, LAT0, LAT1 = -100, 35, 22, 62
def proj(lon, lat):
    return ((lon - LON0) * 3.7, (LAT1 - lat) * 5)

land = topo["objects"]["land"]
polys = land["geometries"][0]["arcs"] if land["geometries"][0]["type"] == "MultiPolygon" else [land["geometries"][0]["arcs"]]
d = []
for poly in polys:
    for r in poly:
        pts = ring(r)
        if not any(LON0 - 5 <= lon <= LON1 + 5 and LAT0 - 5 <= lat <= LAT1 + 5 for lon, lat in pts):
            continue
        seg = ["%.1f,%.1f" % proj(lon, lat) for lon, lat in pts]
        d.append("M" + "L".join(seg) + "Z")
path = "".join(d)
print(len(path), "chars", file=sys.stderr)
open(sys.argv[2], "w", encoding="utf-8").write(path)
print("Oxford", proj(-84.745, 39.507), "Bucharest", proj(26.10, 44.43), file=sys.stderr)
