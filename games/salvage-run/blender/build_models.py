"""Salvage Run art: procedural low-poly ships, a station and asteroids.

Renders the registry thumbnails (img/<class>.jpg), the console backdrop
(img/hero.jpg), the site background (img/starfield.jpg) and exports every model
to models/salvage.glb for the Three.js board.

Run from games/salvage-run:
  "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b -P blender/build_models.py
Optional: -- --only dreadnought   (render one class)   -- --fast   (low samples)
"""
import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector, Euler

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "img"
MODELS = ROOT / "models"
IMG.mkdir(exist_ok=True)
MODELS.mkdir(exist_ok=True)
ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
FAST = "--fast" in ARGS
ONLY = ARGS[ARGS.index("--only") + 1] if "--only" in ARGS else None

rng = random.Random(401)

# ---------------------------------------------------------------- scene reset
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def set_nodes(idblock):
    try:
        idblock.use_nodes = True
    except Exception:
        pass


# ---------------------------------------------------------------- materials
def mat(name, color, metal=0.6, rough=0.5, emit=None, strength=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    set_nodes(m)
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = strength
    return m


M = {
    "hull": mat("Hull", (0.30, 0.32, 0.36), 0.75, 0.42),
    "dark": mat("HullDark", (0.09, 0.10, 0.12), 0.6, 0.55),
    "plate": mat("Plate", (0.45, 0.44, 0.42), 0.55, 0.5),
    "rust": mat("Rust", (0.32, 0.14, 0.06), 0.2, 0.85),
    "red": mat("Stripe", (0.55, 0.04, 0.07), 0.3, 0.45),
    "amber": mat("Window", (0.1, 0.06, 0.02), 0.0, 0.4, (1.0, 0.55, 0.15), 6.0),
    "off": mat("WindowOff", (0.03, 0.03, 0.04), 0.0, 0.3),
    "engine": mat("EngineDead", (0.05, 0.06, 0.07), 0.3, 0.4, (0.15, 0.5, 0.6), 0.6),
    "thrust": mat("Thruster", (0.05, 0.2, 0.2), 0.0, 0.3, (0.25, 0.95, 0.9), 14.0),
    "core": mat("Core", (0.05, 0.25, 0.25), 0.0, 0.2, (0.25, 1.0, 0.9), 3.0),
    "ring": mat("CoreRing", (0.6, 0.55, 0.45), 0.9, 0.3),
    "c_orange": mat("CargoOrange", (0.75, 0.28, 0.05), 0.3, 0.6),
    "c_blue": mat("CargoBlue", (0.07, 0.2, 0.5), 0.3, 0.6),
    "c_grey": mat("CargoGrey", (0.55, 0.56, 0.58), 0.3, 0.6),
    "solar": mat("Solar", (0.02, 0.05, 0.16), 0.9, 0.2),
    "rock": mat("Rock", (0.2, 0.18, 0.16), 0.0, 0.95),
    "light": mat("StationLight", (0.1, 0.1, 0.1), 0.0, 0.4, (1.0, 0.85, 0.6), 8.0),
}


# ---------------------------------------------------------------- primitives
def _finish(o, m, bevel):
    o.data.materials.append(m)
    if bevel:
        md = o.modifiers.new("bevel", "BEVEL")
        md.width = bevel
        md.segments = 1
        md.limit_method = "ANGLE"
    return o


def box(loc, dims, m="hull", rot=(0, 0, 0), bevel=0.03):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = dims
    bpy.ops.object.transform_apply(scale=True)
    return _finish(o, M[m], bevel)


def cyl(loc, r, depth, m="hull", rot=(0, math.pi / 2, 0), verts=16, r2=None, bevel=0.0):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=depth, location=loc, rotation=rot)
    return _finish(bpy.context.active_object, M[m], bevel)


def sphere(loc, r, m="hull", sub=2):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc)
    return _finish(bpy.context.active_object, M[m], 0)


def torus(loc, R, r, m="hull", rot=(0, 0, 0), maj=48, mino=10):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, rotation=rot, major_segments=maj, minor_segments=mino)
    return _finish(bpy.context.active_object, M[m], 0)


def cut(target, cutter):
    md = target.modifiers.new("cut", "BOOLEAN")
    md.operation = "DIFFERENCE"
    md.object = cutter
    apply_all(target)
    bpy.data.objects.remove(cutter, do_unlink=True)


def apply_all(o):
    for md in list(o.modifiers):
        with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o]):
            bpy.ops.object.modifier_apply(modifier=md.name)


def join(parts, name):
    for p in parts:
        apply_all(p)
    bpy.ops.object.select_all(action="DESELECT")
    for p in parts:
        p.select_set(True)
    # bake each part's rotation and scale into its mesh; otherwise the joined object
    # inherits the first part's rotation and resetting it later spins the whole ship
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    o = bpy.context.active_object
    o.name = name
    o.data.name = name
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    o["offset"] = tuple(o.location)   # where the bounds centre was, to place attachments
    o.location = (0, 0, 0)
    return o


def greebles(parts, n, xr, yr, z, size=0.18, m="plate"):
    for _ in range(n):
        s = size * rng.uniform(0.5, 1.4)
        parts.append(box((rng.uniform(*xr), rng.uniform(*yr), z), (s * rng.uniform(1, 2.5), s, s * 0.5), m, bevel=0))


def windows(parts, x0, x1, y, z, step=0.35, lit=0.15, face=1):
    x = x0
    while x < x1:
        on = rng.random() < lit
        parts.append(box((x, y, z), (0.16, 0.02, 0.09), "amber" if on else "off", bevel=0))
        x += step


# ---------------------------------------------------------------- ships
def make_dreadnought():
    P = []
    hull = box((0, 0, 0), (12, 2.2, 1.6), "hull", bevel=0.06)
    # the breach: a wedge torn out of the flank, exposing the core bay
    c = box((0.6, 1.2, 0.2), (2.6, 1.6, 2.0), "hull", rot=(0.3, 0.2, 0.5), bevel=0)
    cut(hull, c)
    P.append(hull)
    P.append(cyl((7.2, 0, 0), 1.15, 2.4, "dark", verts=4, r2=0.12, rot=(math.pi / 4, math.pi / 2, 0)))  # prow
    P.append(box((-3.8, 0, 1.25), (2.2, 1.3, 1.0), "hull", bevel=0.05))      # bridge base
    P.append(box((-4.0, 0, 1.95), (1.2, 0.9, 0.5), "dark", bevel=0.04))      # bridge
    P.append(box((-4.0, 0, 2.3), (0.08, 0.08, 0.6), "plate", bevel=0))       # mast
    P.append(box((0.5, 0, 0.95), (9, 0.5, 0.35), "plate", bevel=0.03))        # dorsal spine
    P.append(box((-0.8, 0, 0.9), (6.5, 1.7, 0.3), "hull", bevel=0.05))        # upper deck
    P.append(box((-1.6, 0, 1.15), (3.5, 1.2, 0.3), "dark", bevel=0.04))       # second tier
    for x in [-5.0 + 0.9 * k for k in range(12)]:
        P.append(box((x, 0, -0.81), (0.04, 2.0, 0.02), "dark", bevel=0))      # keel panel lines
    for sx in (-1, 1):
        for k in range(5):
            P.append(box((-4.2 + 2.0 * k, sx * 1.62, 0.25), (1.7, 0.12, 0.55), "plate" if k % 2 else "hull", rot=(sx * 0.25, 0, 0), bevel=0.02))
    for sx in (-1, 1):
        P.append(box((-1.5, sx * 1.35, -0.2), (6.5, 0.5, 0.9), "hull", bevel=0.04))   # sponsons
        P.append(box((2.5, sx * 1.12, -0.5), (5.0, 0.08, 0.1), "red", bevel=0))        # stripe
        windows(P, -4.5, 5.5, sx * 1.11, 0.25, lit=0.08)
    for x in (-6.4,):
        for y, z in ((0.55, 0.3), (-0.55, 0.3), (0, -0.35)):
            P.append(cyl((x, y, z), 0.42, 1.0, "dark", verts=12))
            P.append(cyl((x - 0.52, y, z), 0.32, 0.06, "engine", verts=12))
    for x in (4.0, 2.4, -1.4):
        P.append(cyl((x, 0, 1.25), 0.32, 0.25, "dark", rot=(0, 0, 0), verts=10))
        P.append(box((x + 0.45, 0, 1.3), (0.8, 0.07, 0.07), "dark", bevel=0))
    P.append(torus((0.6, 0.35, 0.1), 0.55, 0.12, "ring", rot=(math.pi / 2, 0, 0)))    # core housing
    greebles(P, 36, (-5.5, 5.5), (-0.9, 0.9), 0.82)
    greebles(P, 14, (-5.5, 5.5), (-0.9, 0.9), -0.82)
    for p in P[6:]:
        if rng.random() < 0.05:
            p.data.materials[0] = M["rust"]
    ship = join(P, "Dreadnought")
    core = sphere((0, 0, 0), 0.38, "core", sub=2)
    core.name = "Core"
    core.parent = ship   # exported as a child node: the board lights it on the hero ship
    core.location = Vector((0.6, 0.35, 0.1)) - Vector(ship["offset"])
    return ship, core


def make_freighter():
    P = [cyl((0, 0, 0), 0.25, 9, "dark", verts=8)]
    P.append(box((4.8, 0, 0.1), (1.4, 1.4, 1.1), "hull", bevel=0.08))
    windows(P, 4.4, 5.4, 0.71, 0.3, step=0.25, lit=0.2)
    P.append(box((-4.6, 0, 0), (1.2, 1.8, 1.0), "hull", bevel=0.06))
    for y in (-0.5, 0.5):
        P.append(cyl((-5.4, y, 0), 0.3, 0.5, "engine", verts=10))
    cols = ["c_orange", "c_blue", "c_grey"]
    for i, x in enumerate([-3.2, -1.9, -0.6, 0.7, 2.0, 3.3]):
        for k, (y, z) in enumerate(((0.5, 0.5), (-0.5, 0.5), (0.5, -0.5), (-0.5, -0.5))):
            if rng.random() < 0.18:
                continue   # lost containers
            P.append(box((x, y, z), (1.15, 0.9, 0.9), rng.choice(cols), bevel=0.02))
    return join(P, "Freighter")


def make_hauler():
    P = [box((0, 0, 0), (5.0, 2.4, 1.8), "hull", bevel=0.15)]
    P.append(box((2.9, 0, 0.35), (1.2, 1.4, 0.9), "dark", bevel=0.1))
    P.append(box((3.45, 0, 0.45), (0.1, 1.0, 0.35), "amber", bevel=0))
    for y in (-1.55, 1.55):
        P.append(cyl((-0.3, y, -0.2), 0.55, 3.8, "c_grey", verts=14))
        P.append(cyl((1.7, y, -0.2), 0.55, 0.3, "rust", verts=14, r2=0.3))
    for y in (-0.6, 0.6):
        P.append(cyl((-2.8, y, 0), 0.45, 0.8, "dark", verts=12))
        P.append(cyl((-3.25, y, 0), 0.35, 0.05, "engine", verts=12))
    P.append(box((0, 1.21, 0.2), (4.0, 0.04, 0.12), "red", bevel=0))
    greebles(P, 12, (-2.0, 2.0), (-0.9, 0.9), 0.92)
    return join(P, "Hauler")


def make_corvette():
    P = [box((0, 0, 0), (4.2, 1.3, 0.6), "hull", bevel=0.06)]
    P.append(cyl((2.9, 0, 0), 0.75, 1.8, "hull", verts=4, r2=0.06, rot=(math.pi / 4, math.pi / 2, 0)))   # prow
    P[-1].scale = (0.55, 1.0, 1.0)
    P.append(box((-0.6, 0, 0.45), (1.8, 0.8, 0.35), "dark", bevel=0.05))      # bridge
    P.append(box((0.3, 0, 0.55), (0.35, 0.6, 0.05), "amber", bevel=0))
    for sx in (-1, 1):
        P.append(box((-1.0, sx * 1.35, -0.05), (2.2, 1.4, 0.1), "hull", rot=(sx * 0.2, 0, sx * -0.25), bevel=0.02))   # swept wings
        P.append(box((-1.6, sx * 2.0, 0.15), (0.9, 0.08, 0.5), "dark", rot=(0, 0.3, 0), bevel=0.02))                  # wingtip fins
        P.append(cyl((-2.4, sx * 0.4, 0), 0.3, 0.9, "dark", verts=10))
        P.append(cyl((-2.87, sx * 0.4, 0), 0.22, 0.05, "engine", verts=10))
        P.append(box((0.6, sx * 0.66, 0.0), (3.2, 0.04, 0.08), "red", bevel=0))
    greebles(P, 10, (-1.5, 1.5), (-0.5, 0.5), 0.32, size=0.1)
    return join(P, "Corvette")


def make_tug():
    P = [box((0, 0, 0), (2.0, 1.5, 1.2), "c_orange", bevel=0.1)]
    P.append(box((0.7, 0, 0.55), (0.7, 0.9, 0.5), "dark", bevel=0.06))
    P.append(box((1.06, 0, 0.6), (0.04, 0.7, 0.25), "amber", bevel=0))
    P.append(cyl((-1.3, 0, 0), 0.5, 0.7, "dark", verts=12))
    P.append(cyl((-1.68, 0, 0), 0.4, 0.05, "engine", verts=12))
    for y in (-0.55, 0.55):
        P.append(box((1.6, y, -0.3), (1.4, 0.14, 0.14), "plate", bevel=0))
        P.append(box((2.3, y * 0.8, -0.3), (0.14, 0.3, 0.3), "plate", rot=(0, 0, y), bevel=0))
    P.append(box((0, 0.76, -0.2), (1.9, 0.03, 0.18), "hull", bevel=0))
    return join(P, "Tug")


def make_probe():
    P = [sphere((0, 0, 0), 0.6, "plate", sub=1)]
    P.append(cyl((0.75, 0, 0), 0.9, 0.35, "hull", verts=20, r2=0.15, rot=(0, -math.pi / 2, 0)))  # dish
    P.append(cyl((1.2, 0, 0), 0.03, 0.8, "plate", verts=6))
    for sy in (-1, 1):
        P.append(box((0, sy * 1.2, 0), (0.05, 0.1, 0.1), "plate", bevel=0))
        P.append(box((0, sy * 2.0, 0), (0.7, 1.4, 0.03), "solar", rot=(0.25 * sy, 0, 0), bevel=0))
    P.append(cyl((-0.1, 0, 0.9), 0.02, 1.2, "plate", rot=(0, 0.3, 0), verts=6))
    P.append(cyl((-0.65, 0, 0), 0.22, 0.3, "engine", verts=10))
    return join(P, "Probe")


def make_drone():
    P = [box((0, 0, 0), (1.2, 0.9, 0.55), "c_orange", bevel=0.1)]
    P.append(box((0.45, 0, 0.3), (0.4, 0.55, 0.25), "dark", bevel=0.05))
    P.append(box((0.66, 0, 0.32), (0.02, 0.45, 0.12), "amber", bevel=0))
    P.append(cyl((-0.75, 0, 0), 0.28, 0.4, "dark", verts=10))
    P.append(cyl((-0.97, 0, 0), 0.22, 0.05, "thrust", verts=10))
    for y in (-0.35, 0.35):
        P.append(box((0.95, y, -0.15), (0.8, 0.08, 0.08), "plate", bevel=0))
    return join(P, "Drone")


def make_station():
    P = [torus((0, 0, 0), 6.0, 0.55, "hull", maj=64, mino=12)]
    P.append(torus((0, 0, 0), 6.0, 0.57, "light", maj=64, mino=4))
    P[-1].scale = (1, 1, 0.12)
    P.append(cyl((0, 0, 0), 1.3, 3.2, "hull", rot=(0, 0, 0), verts=12))
    P.append(cyl((0, 0, 1.9), 0.9, 0.6, "dark", rot=(0, 0, 0), verts=12))
    P.append(cyl((0, 0, -1.9), 0.9, 0.6, "dark", rot=(0, 0, 0), verts=12))
    P.append(cyl((0, 0, 2.6), 0.08, 1.4, "plate", rot=(0, 0, 0), verts=6))
    for k in range(4):
        a = k * math.pi / 2
        P.append(cyl((3.2 * math.cos(a), 3.2 * math.sin(a), 0), 0.22, 4.2, "plate", rot=(0, math.pi / 2, a), verts=8))
    for k in range(2):
        a = math.pi / 4 + k * math.pi
        P.append(box((9.0 * math.cos(a), 9.0 * math.sin(a), 0), (4.0, 1.8, 0.05), "solar", rot=(0, 0, a + math.pi / 2), bevel=0))
        P.append(cyl((7.0 * math.cos(a), 7.0 * math.sin(a), 0), 0.1, 2.0, "plate", rot=(0, math.pi / 2, a), verts=6))
    for k in range(24):
        a = k * 2 * math.pi / 24
        P.append(box((6.0 * math.cos(a), 6.0 * math.sin(a), 0.5), (0.3, 0.15, 0.08), "light" if k % 3 else "dark", rot=(0, 0, a), bevel=0))
    greebles(P, 20, (-0.8, 0.8), (-0.8, 0.8), 1.62, size=0.12)
    return join(P, "Station")


def make_asteroid(i):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0)
    o = bpy.context.active_object
    for v in o.data.vertices:
        v.co *= rng.uniform(0.72, 1.18)
    o.scale = (rng.uniform(0.9, 1.5), rng.uniform(0.7, 1.1), rng.uniform(0.6, 1.0))
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(M["rock"])
    o.name = f"Asteroid{i}"
    return o


# ---------------------------------------------------------------- world, lights, camera
def make_world():
    w = bpy.data.worlds.new("Space")
    set_nodes(w)
    nt = w.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputWorld")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    vor = nt.nodes.new("ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = 260
    lt = nt.nodes.new("ShaderNodeMath")
    lt.operation = "LESS_THAN"
    lt.inputs[1].default_value = 0.05
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 1.6
    noise.inputs["Detail"].default_value = 9
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.45
    ramp.color_ramp.elements[0].color = (0.0, 0.0, 0.004, 1)
    ramp.color_ramp.elements[1].position = 0.8
    ramp.color_ramp.elements[1].color = (0.05, 0.02, 0.09, 1)
    e = ramp.color_ramp.elements.new(0.64)
    e.color = (0.01, 0.03, 0.06, 1)
    add = nt.nodes.new("ShaderNodeMixRGB")
    add.blend_type = "ADD"
    add.inputs[0].default_value = 1.0
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Strength"].default_value = 1.0
    nt.links.new(tc.outputs["Generated"], vor.inputs["Vector"])
    nt.links.new(vor.outputs["Distance"], lt.inputs[0])
    nt.links.new(tc.outputs["Generated"], noise.inputs["Vector"])
    nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], add.inputs[1])
    boost = nt.nodes.new("ShaderNodeMath")
    boost.operation = "MULTIPLY"
    boost.inputs[1].default_value = 4.0
    nt.links.new(lt.outputs[0], boost.inputs[0])
    nt.links.new(boost.outputs[0], add.inputs[2])
    nt.links.new(add.outputs[0], bg.inputs["Color"])
    nt.links.new(bg.outputs[0], out.inputs["Surface"])
    scene.world = w


def light(name, kind, loc, rot, energy, color, size=1.0):
    d = bpy.data.lights.new(name, kind)
    d.energy = energy
    d.color = color
    if kind == "AREA":
        d.size = size
    if kind == "SUN":
        d.angle = 0.02
    o = bpy.data.objects.new(name, d)
    scene.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = rot
    return o


def setup_render(w, h, samples):
    scene.render.engine = "CYCLES"
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        for kind in ("OPTIX", "CUDA"):
            try:
                prefs.compute_device_type = kind
                prefs.get_devices()
                for d in prefs.devices:
                    d.use = True
                scene.cycles.device = "GPU"
                break
            except Exception:
                continue
    except Exception:
        pass
    scene.cycles.samples = 16 if FAST else samples
    scene.cycles.use_denoising = True
    scene.render.resolution_x = w
    scene.render.resolution_y = h
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Punchy"


def camera():
    c = bpy.data.cameras.new("Cam")
    c.lens = 50
    o = bpy.data.objects.new("Cam", c)
    scene.collection.objects.link(o)
    scene.camera = o
    return o


def aim(cam, target, direction, dist):
    cam.location = Vector(target) + Vector(direction).normalized() * dist
    cam.rotation_euler = (Vector(target) - cam.location).to_track_quat("-Z", "Y").to_euler()


def render(path):
    scene.render.filepath = str(path)
    scene.render.image_settings.file_format = "JPEG" if str(path).endswith(".jpg") else "PNG"
    if scene.render.image_settings.file_format == "JPEG":
        scene.render.image_settings.quality = 88
    bpy.ops.render.render(write_still=True)
    print("rendered", path)


# ---------------------------------------------------------------- build everything
make_world()
dread, core = make_dreadnought()
ships = {
    "dreadnought": dread,
    "freighter": make_freighter(),
    "hauler": make_hauler(),
    "corvette": make_corvette(),
    "tug": make_tug(),
    "probe": make_probe(),
}
drone = make_drone()
station = make_station()
rocks = [make_asteroid(i) for i in range(5)]
everything = list(ships.values()) + [core, drone, station] + rocks

# export: every object at the origin (the core rides on its Dreadnought), one GLB, names are the API
for o in everything:
    if o is core:
        continue
    o.location = (0, 0, 0)
    o.rotation_euler = (0, 0, 0)
bpy.ops.object.select_all(action="DESELECT")
for o in everything:
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(MODELS / "salvage.glb"), export_format="GLB", use_selection=True, export_apply=True)
print("exported", MODELS / "salvage.glb")

# ---- renders
key = light("Key", "SUN", (0, 0, 0), (0.9, 0.2, 0.8), 3.2, (1.0, 0.86, 0.7))
rim = light("Rim", "AREA", (-6, 8, 4), (0, 0, 0), 900, (0.35, 0.9, 1.0), size=6)
fill = light("Fill", "AREA", (6, -8, -3), (0, 0, 0), 120, (0.6, 0.5, 1.0), size=8)
cam = camera()


def only(*objs):
    for o in everything:
        o.hide_render = o not in objs
        o.hide_viewport = False


def point_rim(target):
    rim.rotation_euler = (Vector(target) - rim.location).to_track_quat("-Z", "Y").to_euler()
    fill.rotation_euler = (Vector(target) - fill.location).to_track_quat("-Z", "Y").to_euler()


# registry thumbnails, 16:10
setup_render(800, 500, 96)
FRAMING = {  # direction from the ship to the camera, distance, roll of the derelict
    "dreadnought": ((0.75, 1.0, 0.5), 21.0, (0.12, -0.06, -0.2)),
    "freighter": ((0.7, -1.0, 0.5), 13.5, (0.2, 0.05, 0.3)),
    "hauler": ((1.0, -1.0, 0.6), 10.5, (-0.15, 0.08, 0.4)),
    "corvette": ((1.0, -0.9, 0.5), 9.0, (0.25, -0.1, 0.2)),
    "tug": ((1.0, -1.0, 0.6), 5.8, (0.3, 0.2, 0.6)),
    "probe": ((1.0, -1.2, 0.5), 7.0, (0.4, 0.1, 0.2)),
}
for name, obj in ships.items():
    if ONLY and name != ONLY:
        continue
    d, dist, roll = FRAMING[name]
    obj.rotation_euler = roll
    only(obj, *([core] if name == "dreadnought" else []))
    rim.location = (-8, 9, 5)
    point_rim((0, 0, 0))
    aim(cam, (0, 0, 0), d, dist)
    render(IMG / f"{name}.jpg")
    obj.rotation_euler = (0, 0, 0)

if not ONLY:
    # site background: empty space
    only()
    setup_render(1920, 1200, 64)
    aim(cam, (0, 0, 0), (0.3, -1.0, 0.8), 30)
    cam.data.lens = 35
    render(IMG / "starfield.jpg")

    # console backdrop: the hero Dreadnought with a live core, the station far off, two tugs on approach
    setup_render(1920, 1080, 128)
    cam.data.lens = 40
    dread.rotation_euler = (0.1, -0.05, 0.35)
    M["core"].node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 40.0
    station.location = (-60, -95, -14)
    station.rotation_euler = (0.9, 0.35, 0.5)
    d1 = drone.copy(); d1.data = drone.data; scene.collection.objects.link(d1)
    drone.location = (2.4, 3.6, 2.4); drone.rotation_euler = (0.1, 0.05, -1.9)     # tug nosing into the breach
    d1.location = (-1.5, 6.5, 2.6); d1.rotation_euler = (0.0, 0.15, -1.2)
    everything.append(d1)
    for i, r in enumerate(rocks):
        r.location = (rng.uniform(-30, 20), rng.uniform(-60, -20), rng.uniform(-10, 8))
        r.scale = (s := rng.uniform(0.8, 2.6), s, s)
    core_light = light("CoreLight", "POINT", (0, 0, 0), (0, 0, 0), 1500, (0.3, 1.0, 0.9))
    core_light.parent = core
    only(dread, core, station, drone, d1, *rocks)
    key.rotation_euler = Vector((-0.5, -1.0, -0.55)).to_track_quat("-Z", "Y").to_euler()   # light the breach side
    rim.location = (-12, -10, 7)
    point_rim((0, 0, 0))
    aim(cam, (0.5, 0.8, 0.4), (0.55, 1.0, 0.28), 19)
    render(IMG / "hero.jpg")

    # favicon: the tug, tight
    only(ships["tug"])
    setup_render(128, 128, 32)
    cam.data.lens = 50
    ships["tug"].rotation_euler = (0.3, 0.2, 0.6)
    aim(cam, (0, 0, 0), (1.0, -1.0, 0.6), 4.2)
    render(ROOT / "favicon.png")

print("done")
