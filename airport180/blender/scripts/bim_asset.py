# Executed inside build_master.py; all placeholder coordinates are fixed, never random.
terminal_source = next(src for src in P["objects"] if src["id"] == "terminal")
g = terminal_source["geometry"]
tx = g["x"]
ty = g["y"]
tw = g["width"]
td = g["height"]
cx = tx + tw / 2
cy = ty + td / 2
BIM = {}
ROOTS = {}


def bim_attach(o, layer):
    col = collection("BIM_" + layer)
    world = o.matrix_world.copy()
    for old in list(o.users_collection):
        if old.name != "BUILDING_TERMINAL":
            old.objects.unlink(o)
    col.objects.link(o)
    o.parent = ROOTS[layer]
    o.matrix_world = world
    o["bim_layer"] = layer
    o["placeholder_only"] = True
    BIM.setdefault(layer, []).append(o)
    return o


for layer in ["STRUCTURE", "ARCHITECTURE", "HVAC", "ELECTRICAL", "ELV"]:
    root = bpy.data.objects.new("BIM_ROOT_" + layer, None)
    collection("BIM_" + layer).objects.link(root)
    ROOTS[layer] = root
    root["visualization_offset_only"] = True
# Architecture uses the SAME terminal meshes, not a newly generated layout.
for o in list(bpy.data.objects):
    if (
        o.get("source_id") == "terminal"
        and o.type == "MESH"
        and not o.get("primary_footprint")
    ):
        bim_attach(o, "ARCHITECTURE")
material("bim_structure", (0.35, 0.5, 0.66))
material("bim_hvac", (0.03, 0.7, 0.76))
material("bim_electrical", (0.98, 0.62, 0.12))
material("bim_elv", (0.65, 0.35, 0.94))
material("bim_red", (0.95, 0.06, 0.06))


def b_box(name, x, y, w, d, h, z, layer, mat):
    return bim_attach(box(name, x, y, w, d, h, "BIM_" + layer, mat, z=z), layer)


for z in [2, 32, 62]:
    b_box(
        "BIM floor slab",
        tx + 8,
        ty + 8,
        tw - 16,
        td - 16,
        2,
        z,
        "STRUCTURE",
        "bim_structure",
    )
for x in [tx + 30, tx + 300, tx + 570, tx + 850, tx + 1120, tx + 1390]:
    for y in [ty + 25, ty + td - 35]:
        b_box("BIM structural column", x, y, 6, 6, 85, 0, "STRUCTURE", "bim_structure")
# Representative trunk routes; these are symbolic, not issued-for-construction services.
for x in [tx + 150, tx + 420, tx + 690, tx + 960, tx + 1230]:
    b_box(
        "HVAC distribution branch",
        x,
        ty + 25,
        3,
        td - 50,
        2.5,
        68.75,
        "HVAC",
        "bim_hvac",
    )
for y in [ty + 65, ty + td - 65]:
    b_box("HVAC trunk", tx + 50, y, tw - 100, 3, 2.5, 68.75, "HVAC", "bim_hvac")
for y in [ty + 95, ty + td - 95]:
    b_box(
        "Electrical main tray",
        tx + 50,
        y,
        tw - 100,
        1.5,
        0.5,
        74,
        "ELECTRICAL",
        "bim_electrical",
    )
for y in [ty + 120, ty + td - 120]:
    b_box("ELV tray", tx + 50, y, tw - 100, 0.8, 0.3, 78, "ELV", "bim_elv")
# Camera-targeted clash near (2610,2225,70), with plausible schematic duct/tray sizes.
duct = b_box(
    "DEMO_DUCT_FIXED", cx - 45, cy - 1.5, 90, 3, 2.5, 68.75, "HVAC", "bim_hvac"
)
initial = [(-30, 70), (-12, 70), (-8, 70), (8, 70), (12, 70), (30, 70)]
approved = [(-30, 70), (-12, 70), (-8, 75), (8, 75), (12, 70), (30, 70)]


def tray_vertices(route):
    vs = []
    fs = []
    for i, (a, b) in enumerate(zip(route, route[1:])):
        k = len(vs)
        for y, z in [a, b]:
            vs.extend(
                [
                    (cx - 0.75, -(cy + y), z - 0.25),
                    (cx + 0.75, -(cy + y), z - 0.25),
                    (cx + 0.75, -(cy + y), z + 0.25),
                    (cx - 0.75, -(cy + y), z + 0.25),
                ]
            )
        fs.extend(
            [
                (k, k + 1, k + 2, k + 3),
                (k + 4, k + 7, k + 6, k + 5),
                (k, k + 4, k + 5, k + 1),
                (k + 1, k + 5, k + 6, k + 2),
                (k + 2, k + 6, k + 7, k + 3),
                (k + 3, k + 7, k + 4, k),
            ]
        )
    return vs, fs


vs, fs = tray_vertices(initial)
mesh = bpy.data.meshes.new("Demo tray controlled mesh")
mesh.from_pydata(vs, [], fs)
mesh.update()
tray = bpy.data.objects.new("DEMO_TRAY_ROUTING", mesh)
attach(tray, "BIM_ELECTRICAL", "bim_electrical")
bim_attach(tray, "ELECTRICAL")
tray.shape_key_add(name="Uncoordinated")
key = tray.shape_key_add(name="ApprovedRouting")
for v, co in zip(key.data, tray_vertices(approved)[0]):
    v.co = co
tray["routing_change_only"] = (
    "Only the central predesigned segment rises to z75. Endpoints remain z70."
)
marker = b_box("CLASH_HIGHLIGHT", cx - 2.5, cy - 4, 5, 8, 4, 68, "HVAC", "bim_red")
marker.display_type = "WIRE"
mod = marker.modifiers.new("Clash wireframe", "WIREFRAME")
mod.thickness = 0.18
marker["highlight_only_not_physical"] = True
for objs in BIM.values():
    for o in objs:
        o.hide_render = True
s["BIM_placeholder_notice"] = (
    "Controlled illustrative BIM, not real airport construction drawings; terminal envelope height selected to contain the director z70 demonstration."
)
s["BIM_reference_terminal_xy"] = [cx, cy]
# Colored guide perimeters make sparse MEP layers legible; not physical slabs.
for layer, z, material_name in [
    ("HVAC", 70, "bim_hvac"),
    ("ELECTRICAL", 75, "bim_electrical"),
    ("ELV", 78, "bim_elv"),
]:
    for y in [ty + 14, ty + td - 18]:
        guide = b_box(
            "GUIDE " + layer, tx + 14, y, tw - 28, 4, 0.4, z, layer, material_name
        )
        guide["visualization_guide_only"] = True
    for x in [tx + 14, tx + tw - 18]:
        guide = b_box(
            "GUIDE " + layer, x, ty + 14, 4, td - 28, 0.4, z, layer, material_name
        )
        guide["visualization_guide_only"] = True
    for o in BIM[layer]:
        o.hide_render = True
