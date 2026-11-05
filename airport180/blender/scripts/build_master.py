"""Build the uploaded airport-project.json without changing any plan geometry.
Source screen coordinates (x east, y south) -> Blender (x, -y, elevation).
All building styling is contained within the original plan footprints.
"""

import bpy, json, math, hashlib, sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "input/airport-project.json"
P = json.loads(PROJECT.read_text())
D = json.loads((ROOT / "config/visual-design.json").read_text())

bpy.ops.wm.read_factory_settings(use_empty=True)
s = bpy.context.scene
s.unit_settings.system = "METRIC"
s.unit_settings.scale_length = 1
s.unit_settings.length_unit = "METERS"
s.render.engine = "CYCLES"
s.cycles.device = "CPU"
s.cycles.samples = D["samples"]
s.cycles.use_denoising = False
s.cycles.max_bounces = 1
s.cycles.diffuse_bounces = 0
s.cycles.glossy_bounces = 0
s.render.threads_mode = "FIXED"
s.render.threads = D["threads"]
s.render.resolution_x, s.render.resolution_y = D["resolution"]
s.render.resolution_percentage = 100
s.render.use_persistent_data = True
s.render.image_settings.file_format = "PNG"
s.render.image_settings.color_mode = "RGB"
s.render.image_settings.compression = 40
s.render.fps = 30
s.frame_start = 0
s.frame_end = 450
s.view_settings.view_transform = "Standard"
s.view_settings.look = "Medium High Contrast"
s.world = bpy.data.worlds.new("Review background")
s.world.use_nodes = True
s.world.node_tree.nodes["Background"].inputs[0].default_value = (0.008, 0.02, 0.034, 1)
s.world.node_tree.nodes["Background"].inputs[1].default_value = 1
C = {}
M = {}
FAC = {}
PRIMARY = {}
ANCHORS = {}


def collection(name):
    if name not in C:
        C[name] = bpy.data.collections.new(name)
        s.collection.children.link(C[name])
    return C[name]


for name in sorted(
    {o["collection"] for o in P["objects"]}
    | {"SITE_TERRAIN", "REVIEW_CAMERAS", "REVIEW_LABELS", "REVIEW_STANDS"}
):
    collection(name)


def material(name, color):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    n = m.node_tree.nodes
    l = m.node_tree.links
    n.clear()
    geo = n.new("ShaderNodeNewGeometry")
    dot = n.new("ShaderNodeVectorMath")
    dot.operation = "DOT_PRODUCT"
    dot.inputs[1].default_value = (0.3, 0.5, 0.8124)
    l.new(geo.outputs["Normal"], dot.inputs[0])
    cl = n.new("ShaderNodeMath")
    cl.operation = "MAXIMUM"
    cl.inputs[1].default_value = 0
    l.new(dot.outputs["Value"], cl.inputs[0])
    brightness = n.new("ShaderNodeMath")
    brightness.operation = "MULTIPLY_ADD"
    brightness.inputs[1].default_value = 0.62
    brightness.inputs[2].default_value = 0.38
    l.new(cl.outputs[0], brightness.inputs[0])
    col = n.new("ShaderNodeMixRGB")
    col.blend_type = "MULTIPLY"
    col.inputs[0].default_value = 1
    col.inputs[1].default_value = (*color, 1)
    l.new(brightness.outputs[0], col.inputs[2])
    em = n.new("ShaderNodeEmission")
    l.new(col.outputs[0], em.inputs[0])
    out = n.new("ShaderNodeOutputMaterial")
    l.new(em.outputs[0], out.inputs[0])
    m.cycles.emission_sampling = "NONE"
    M[name] = m


for name, color in {
    "ground": (0.18, 0.29, 0.25),
    "runway": (0.035, 0.055, 0.075),
    "taxiway": (0.13, 0.23, 0.29),
    "apron": (0.36, 0.47, 0.52),
    "terminal": (0.72, 0.84, 0.88),
    "roof": (0.035, 0.63, 0.7),
    "glass": (0.025, 0.16, 0.24),
    "tower": (0.9, 0.42, 0.12),
    "parking": (0.13, 0.23, 0.36),
    "gtc": (0.08, 0.42, 0.33),
    "white": (0.87, 0.96, 0.99),
    "yellow": (0.95, 0.65, 0.17),
    "reserve": (0.43, 0.37, 0.15),
    "flightpath": (0.15, 0.29, 0.36),
}.items():
    material(name, color)


def attach(o, col, mat, source=None, primary=False):
    for old in list(o.users_collection):
        old.objects.unlink(o)
    collection(col).objects.link(o)
    if mat:
        o.data.materials.append(M[mat])
    if source:
        o["source_id"] = source["id"]
        o["source_kind"] = source["kind"]
        o["source_phase"] = source.get("phase", "")
        o["source_geometry"] = json.dumps(source["geometry"])
        FAC.setdefault(source["id"], []).append(o)
        if primary:
            PRIMARY[source["id"]] = o
            o["primary_footprint"] = True
    return o


def box(name, x, y, w, d, h, col, mat, z=0, source=None, primary=False):
    bpy.ops.mesh.primitive_cube_add(
        size=1, location=(x + w / 2, -(y + d / 2), z + h / 2)
    )
    o = bpy.context.object
    o.name = name
    o.dimensions = (w, d, h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return attach(o, col, mat, source, primary)


def cylinder(
    name, cx, cy, r, h, col, mat, z=0, source=None, primary=False, vertices=64
):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices, radius=r, depth=h, location=(cx, -cy, z + h / 2)
    )
    o = bpy.context.object
    o.name = name
    return attach(o, col, mat, source, primary)


def polygon(name, points, col, mat, z=0, source=None, primary=False):
    mesh = bpy.data.meshes.new(name + " mesh")
    mesh.from_pydata(
        [(x, -y, z) for x, y in reversed(points)], [], [list(range(len(points)))]
    )
    mesh.update()
    o = bpy.data.objects.new(name, mesh)
    return attach(o, col, mat, source, primary)


def strip(
    name, points, width, col, mat, z=0, source=None, primary=False, round_caps=False
):
    # Flat ribbon mesh: XY vertices preserve the source centerline and stroke width.
    verts = []
    faces = []
    for i, (a, b) in enumerate(zip(points, points[1:])):
        dx, dy = b[0] - a[0], b[1] - a[1]
        length = math.hypot(dx, dy)
        nx, ny = -dy / length * width / 2, dx / length * width / 2
        k = len(verts)
        verts.extend(
            [
                (a[0] + nx, -(a[1] + ny), z),
                (a[0] - nx, -(a[1] - ny), z),
                (b[0] - nx, -(b[1] - ny), z),
                (b[0] + nx, -(b[1] + ny), z),
            ]
        )
        faces.append((k, k + 1, k + 2, k + 3))
    mesh = bpy.data.meshes.new(name + " mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    o = bpy.data.objects.new(name, mesh)
    attach(o, col, mat, source, primary)
    o["centerline_source_json"] = json.dumps(points)
    o["stroke_width_m"] = width
    if round_caps:
        for j, (x, y) in enumerate([points[0], points[-1]]):
            cylinder(
                name + f" cap {j}",
                x,
                y,
                width / 2,
                0.02,
                col,
                mat,
                z=z - 0.01,
                source=source,
            )
    return o


font = bpy.data.fonts.load(str(ROOT / "assets/DejaVuSans.ttf"))


def text(
    name,
    body,
    x,
    y,
    size,
    col="REVIEW_LABELS",
    mat="white",
    z=1,
    source=None,
    rotation=0,
):
    c = bpy.data.curves.new(name, "FONT")
    c.body = body
    c.size = size
    c.align_x = "CENTER"
    c.align_y = "CENTER"
    c.font = font
    c.extrude = 0
    o = bpy.data.objects.new(name, c)
    o.location = (x, -y, z)
    o.rotation_euler.z = rotation
    attach(o, col, mat, source)
    return o


bounds = P["coordinate_system"]["scene_bounds"]
xmin, ymin, xmax, ymax = bounds
box(
    "Site extent: JSON scene_bounds",
    xmin,
    ymin,
    xmax - xmin,
    ymax - ymin,
    6,
    "SITE_TERRAIN",
    "ground",
    z=-6,
)
# Reference geometry is deliberately displayed and separated from physical facilities.
for rule in P["no_build_rules"]:
    polygon(
        rule["id"] + " educational no-build fill",
        rule["polygon"],
        "REFERENCE_ONLY",
        "reserve" if rule["id"] == "NB1" else "flightpath",
        z=0.025,
    )
    pts = rule["polygon"] + [rule["polygon"][0]]
    for j, (a, b) in enumerate(zip(pts, pts[1:])):
        # Dashed contour avoids suggesting a statutory airport safety boundary.
        length = math.dist(a, b)
        count = max(1, int(length / 55))
        for k in range(count):
            t0 = k / count
            t1 = min(1, (k + 0.55) / count)
            u = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0]
            v = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1]
            strip(
                rule["id"] + " dashed boundary",
                [u, v],
                3,
                "REFERENCE_ONLY",
                "yellow",
                z=0.04,
            )

for src in P["objects"]:
    ident = src["id"]
    kind = src["kind"]
    g = src["geometry"]
    col = src["collection"]
    if kind == "illustrative_clearance":
        # Primary rect is an invisible source witness; NB1 reference polygon is the visible exact outline.
        o = box(
            ident,
            g["x"],
            g["y"],
            g["width"],
            g["height"],
            0.001,
            col,
            "reserve",
            z=-0.1,
            source=src,
            primary=True,
        )
        o["reference_only"] = True
        continue
    if g["type"] == "rect":
        x, y, w, d = g["x"], g["y"], g["width"], g["height"]
        h = 0.3
        mat = "taxiway"
        if kind == "runway":
            mat = "runway"
        elif kind == "apron":
            mat = "apron"
        elif kind == "terminal":
            h = D["building_heights_m"]["terminal"]
            mat = "terminal"
        elif kind == "parking":
            h = D["building_heights_m"]["parking"]
            mat = "parking"
        elif kind == "transport_hub":
            h = D["building_heights_m"]["ground_transport"]
            mat = "gtc"
        o = box(ident, x, y, w, d, h, col, mat, z=0.08, source=src, primary=True)
        ANCHORS[ident] = (x + w / 2, y + d / 2)
        if kind == "runway":
            for sx in range(int(x) + 120, int(x + w) - 120, 140):
                box(
                    "Runway centerline",
                    sx,
                    y + d / 2 - 2,
                    65,
                    4,
                    0.025,
                    col,
                    "white",
                    z=0.41,
                    source=src,
                )
            for end in [x + 25, x + w - 50]:
                for j in range(6):
                    box(
                        "Threshold bar",
                        end,
                        y + 3 + j * 6.5,
                        25,
                        2,
                        0.02,
                        col,
                        "white",
                        z=0.41,
                        source=src,
                    )
            text(
                "Runway length label",
                "RUNWAY  /  3200 m",
                x + w / 2,
                y - 62,
                39,
                z=0.15,
                source=src,
            )
        elif kind == "taxiway":
            if w > d:
                strip(
                    "Taxiway centerline",
                    [(x + 3, y + d / 2), (x + w - 3, y + d / 2)],
                    2,
                    col,
                    "yellow",
                    z=0.42,
                    source=src,
                )
            else:
                strip(
                    "Connector centerline",
                    [(x + w / 2, y + 3), (x + w / 2, y + d - 3)],
                    2,
                    col,
                    "yellow",
                    z=0.42,
                    source=src,
                )
        elif kind == "taxilane":
            strip(
                "Apron taxilane center",
                [(x + 5, y + d / 2), (x + w - 5, y + d / 2)],
                2,
                col,
                "yellow",
                z=0.43,
                source=src,
            )
        elif kind == "terminal":
            # Roof and facade remain INSIDE the supplied rectangle; no footprint overhang.
            seg = 84
            verts = []
            faces = []
            for i in range(seg + 1):
                px = x + w * i / seg
                rz = (
                    0.08
                    + h
                    + D["terminal_roof_rise_m"]
                    * (0.5 + 0.5 * math.cos(8 * math.pi * i / seg))
                )
                verts.extend([(px, -y, rz), (px, -(y + d), rz)])
            for i in range(seg):
                faces.append((2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2))
            mesh = bpy.data.meshes.new("Terminal wave roof mesh")
            mesh.from_pydata(verts, [], faces)
            mesh.update()
            roof = bpy.data.objects.new("Terminal roof - bounded by JSON", mesh)
            attach(roof, col, "roof", src)
            for sy in [y + 0.15, y + d - 1.15]:
                box(
                    "Terminal facade glass",
                    x + 2,
                    sy,
                    w - 4,
                    1,
                    h - 8,
                    col,
                    "glass",
                    z=4.08,
                    source=src,
                )
                for px in range(int(x) + 10, int(x + w) - 10, 50):
                    box(
                        "Terminal facade mullion",
                        px,
                        sy - 0.02,
                        1,
                        1.05,
                        h - 6,
                        col,
                        "white",
                        z=3.08,
                        source=src,
                    )
            text(
                "Terminal roof label",
                "TERMINAL  T1",
                x + w / 2,
                y + d / 2,
                67,
                z=h + D["terminal_roof_rise_m"] + 1,
                source=src,
            )
        elif kind == "parking":
            for k in [1, 2, 3]:
                for sy in [y + 0.1, y + d - 0.9]:
                    box(
                        "Parking facade band",
                        x + 0.5,
                        sy,
                        w - 1,
                        0.7,
                        2,
                        col,
                        "white",
                        z=k * 6,
                        source=src,
                    )
            for j in range(4):
                for k in range(16):
                    px = x + 15 + k * 31
                    py = y + 15 + j * 70
                    strip(
                        "Parking roof bay",
                        [(px, py), (px, py + 43), (px + 25, py + 43)],
                        1,
                        col,
                        "white",
                        z=h + 0.4,
                        source=src,
                    )
            text(
                "Parking roof label",
                "PARKING",
                x + w / 2,
                y + d / 2,
                48,
                z=h + 1,
                source=src,
            )
        elif kind == "transport_hub":
            for k in range(1, 9):
                box(
                    "GTC roof rib",
                    x + 5,
                    y + k * d / 10,
                    w - 10,
                    2,
                    1.2,
                    col,
                    "white",
                    z=h + 0.3,
                    source=src,
                )
            text("GTC roof label", "GTC", x + w / 2, y + d / 2, 65, z=h + 2, source=src)
    elif g["type"] == "circle":
        cx, cy, r = g["cx"], g["cy"], g["r"]
        h = D["building_heights_m"]["tower"]
        cylinder(ident, cx, cy, r, 8, col, "tower", z=0.08, source=src, primary=True)
        cylinder(
            "Tower shaft", cx, cy, r * 0.27, h - 20, col, "terminal", z=8.08, source=src
        )
        cylinder(
            "Tower cab",
            cx,
            cy,
            r * 0.7,
            12,
            col,
            "glass",
            z=h - 12,
            source=src,
            vertices=16,
        )
        cylinder(
            "Tower crown",
            cx,
            cy,
            r * 0.78,
            2,
            col,
            "tower",
            z=h,
            source=src,
            vertices=16,
        )
        text("Tower label", "ATC TOWER", cx, cy + r + 65, 35, z=0.2, source=src)
        ANCHORS[ident] = (cx, cy)
    elif g["type"] == "polyline":
        strip(
            ident,
            g["points"],
            g["stroke_width"],
            col,
            "parking",
            z=0.22,
            source=src,
            primary=True,
            round_caps=True,
        )
        for a, b in zip(g["points"], g["points"][1:]):
            length = math.dist(a, b)
            for k in range(int(length / 80)):
                t0 = (k * 80 + 8) / length
                t1 = min(1, (k * 80 + 44) / length)
                u = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0]
                v = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1]
                strip("Road dashed center", [u, v], 2, col, "white", z=0.25, source=src)
        text(
            "Landside road label",
            "LANDSIDE ROAD",
            2700,
            g["points"][0][1] - 95,
            38,
            z=0.25,
            source=src,
        )
    else:
        raise ValueError("Unsupported geometry " + g["type"])
# Exact stand reference points, no aircraft or proposed route are imported.
apron_src = next(o for o in P["objects"] if o["id"] == "apron")
for stand in P["parking_stands"]:
    x, y = stand["x"], stand["y"]
    o = strip(
        "Stand " + stand["id"],
        [(x, y - 90), (x, y + 90)],
        2,
        "REVIEW_STANDS",
        "white",
        z=0.45,
        source=apron_src,
    )
    o["stand_id"] = stand["id"]
    o["stand_source_xy"] = [x, y]
    o["orientation_deg"] = stand["orientation_deg"]
    strip(
        "Stand crossbar",
        [(x - 30, y), (x + 30, y)],
        2,
        "REVIEW_STANDS",
        "white",
        z=0.46,
        source=apron_src,
    )
    text(
        stand["id"] + " label",
        stand["id"],
        x,
        y + 110,
        25,
        col="REVIEW_STANDS",
        z=0.45,
        source=apron_src,
    )
# Plan metadata text, outside facility footprints. English text avoids external font dependencies.
text(
    "Review heading",
    "NEW HORIZON AIRPORT  |  COORDINATE BASELINE V1",
    2800,
    210,
    65,
    z=0.1,
)
text(
    "Review scope",
    "STAGE 1 - SPATIAL VALIDATION / NO AIRCRAFT MOTION",
    2800,
    325,
    37,
    z=0.1,
)
text(
    "Envelope caveat",
    "NB1 / ILLUSTRATIVE NO-BUILD RESERVATION",
    2650,
    855,
    30,
    mat="yellow",
    z=0.1,
)
text(
    "Footer caveat",
    "EDUCATIONAL GEOMETRY - NOT FOR ENGINEERING / REGULATORY USE",
    2800,
    3210,
    37,
    z=0.1,
)
text(
    "Axis convention",
    "SOURCE: X EAST, Y SOUTH (m)  |  BLENDER: X=x, Y=-y, Z=UP",
    2800,
    3300,
    29,
    z=0.1,
)
strip("North arrow", [(5100, 500), (5100, 220)], 7, "REVIEW_LABELS", "white", z=0.2)
polygon(
    "North arrow head",
    [(5100, 180), (5055, 270), (5145, 270)],
    "REVIEW_LABELS",
    "white",
    z=0.21,
)
text("North", "N", 5100, 580, 65, z=0.1)
# The director package is the only execution source. Model is built once and reused.
for o in bpy.data.objects:
    if o.type == "FONT" or any(
        c.name in ["REFERENCE_ONLY", "REVIEW_LABELS"] for c in o.users_collection
    ):
        o.hide_render = True
s["source_json_text"] = PROJECT.read_text()
s["project_json_sha256"] = hashlib.sha256(PROJECT.read_bytes()).hexdigest()
s["coordinate_transform"] = (
    "(x_source,y_source,z)->(x,-y,z), no translation or rescaling"
)
# Controlled placeholder BIM anchored to the existing terminal footprint.
exec(
    compile(
        (ROOT / "scripts/bim_asset.py").read_text(),
        str(ROOT / "scripts/bim_asset.py"),
        "exec",
    )
)
s.frame_start = 0
s.frame_end = 5399
s.render.fps = 30
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / "blender/director-master.blend"))
print("DIRECTOR_MASTER_SAVED")
