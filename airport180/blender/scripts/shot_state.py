"""Frame-exact director presets. No facility re-generation during any shot."""

import bpy, json, math
from pathlib import Path
from mathutils import Vector, Matrix, Quaternion
from bpy_extras.object_utils import world_to_camera_view

ROOT = Path(__file__).resolve().parents[1]
P = json.loads((ROOT / "input/airport-project.json").read_text())
SHOTS = json.loads((ROOT / "input/director-shots.json").read_text())["shots"]
CAMERAS = json.loads((ROOT / "input/camera-keyframes.json").read_text())["cameras"]
s = bpy.context.scene
SH = {d["shot_id"]: d for d in SHOTS}
LAYERS = ["STRUCTURE", "ARCHITECTURE", "HVAC", "ELECTRICAL", "ELV"]
OFFSETS = [0, 95, 190, 285, 380]
CLIPS = {
    "planning": {"global_start": 810, "frames": 270, "shots": ["S02-SH05"]},
    "bim": {"global_start": 3060, "frames": 540, "shots": ["S05-SH15", "S05-SH16"]},
    "reset": {"global_start": 3600, "frames": 150, "shots": ["S05-SH17"]},
}
CAM = bpy.data.objects.get("DIRECTOR_CAM")
if CAM is None:
    bpy.ops.object.camera_add()
    CAM = bpy.context.object
    CAM.name = "DIRECTOR_CAM"
    CAM.data.clip_end = 40000
    CAM.data.clip_start = 0.1
s.camera = CAM
FACTORS = {}


def clamp(t):
    return max(0, min(1, t))


def ease(t):
    t = clamp(t)
    return 4 * t * t * t if t < 0.5 else 1 - ((-2 * t + 2) ** 3) / 2


def mix(a, b, t):
    return a + (b - a) * t


def camera_state(shot_id, t, factor=1):
    spec = CAMERAS["S05-SH15"] if shot_id == "S05-SH17" else CAMERAS[shot_id]
    a, b = spec["start"], spec["end"]
    u = ease(t)
    target_src = [mix(x, y, u) for x, y in zip(a["target_xyz_m"], b["target_xyz_m"])]
    target = Vector((target_src[0], -target_src[1], target_src[2]))
    az = math.radians(mix(a["azimuth_deg"], b["azimuth_deg"], u))
    el = math.radians(mix(a["elevation_deg"], b["elevation_deg"], u))
    dist = mix(a.get("distance_m", 10000), b.get("distance_m", 10000), u)
    if spec["camera_type"] == "PERSPECTIVE":
        dist *= factor
        CAM.data.type = "PERSP"
        CAM.data.lens = spec["lens_mm"]
        CAM.data.sensor_width = 36
    else:
        CAM.data.type = "ORTHO"
        CAM.data.ortho_scale = mix(a["ortho_scale_m"], b["ortho_scale_m"], u) * factor
    offset = Vector(
        (
            dist * math.cos(el) * math.cos(az),
            -dist * math.cos(el) * math.sin(az),
            dist * math.sin(el),
        )
    )
    CAM.location = target + offset
    forward = (target - CAM.location).normalized()
    # Planning retains the map's projected north reference throughout the tilt.
    # BIM uses gravity-up. Reference never switches inside a shot, avoiding
    # gratuitous plan roll and the top-view up-vector singularity.
    up_reference = Vector((0, 1, 0)) if shot_id == "S02-SH05" else Vector((0, 0, 1))
    right = forward.cross(up_reference).normalized()
    up = right.cross(forward).normalized()
    CAM.rotation_euler = Matrix((right, up, -forward)).transposed().to_quaternion().to_euler()
    return {
        "target_source": target_src,
        "azimuth_deg": math.degrees(az),
        "elevation_deg": math.degrees(el),
        "distance_m": dist,
        "ortho_scale_m": CAM.data.ortho_scale if CAM.data.type == "ORTHO" else None,
        "lens_mm": CAM.data.lens if CAM.data.type == "PERSP" else None,
        "fit_factor": factor,
    }


def set_all_hidden():
    for o in bpy.data.objects:
        if o.type in ["MESH", "CURVE", "FONT"]:
            o.hide_render = True
    for layer in LAYERS:
        bpy.data.objects["BIM_ROOT_" + layer].location = (0, 0, 0)
    bpy.data.objects["DEMO_TRAY_ROUTING"].data.shape_keys.key_blocks[
        "ApprovedRouting"
    ].value = 0


def state(clip, f, fit=True):
    set_all_hidden()
    n = CLIPS[clip]["frames"]
    f = max(0, min(n - 1, int(f)))
    if clip == "planning":
        sid = "S02-SH05"
        u = f / (n - 1)
        # Strict order of existing object reveals: no position/scale animation.
        for o in bpy.data.objects:
            kind = o.get("source_kind")
            ident = o.get("source_id")
            start = 999
            if kind == "runway":
                start = 0
            elif ident == "parallel_taxiway":
                start = 36
            elif kind == "taxiway":
                start = 72
            elif kind in ["apron", "taxilane"]:
                start = 112
            elif kind == "terminal":
                start = 155
            elif kind in ["tower", "landside_road", "parking", "transport_hub"]:
                start = 202
            if (
                kind
                and kind != "illustrative_clearance"
                and o.type != "FONT"
                and f >= start
            ):
                o.hide_render = False
            if o.get("bim_layer") and not o.get("source_id"):
                o.hide_render = True
        # Site is fixed, visible throughout; reference envelopes and text are review layers.
        bpy.data.objects["Site extent: JSON scene_bounds"].hide_render = False
    elif clip == "bim" and f < 300:
        sid = "S05-SH15"
        u = f / 299
        for i, layer in enumerate(LAYERS):
            z = OFFSETS[i] * ease((f - i * 42) / 60)
            bpy.data.objects["BIM_ROOT_" + layer].location.z = z
            for o in bpy.data.objects:
                if (
                    o.get("bim_layer") == layer
                    and f >= i * 42
                    and o.name != "CLASH_HIGHLIGHT"
                ):
                    o.hide_render = False
        # Solid plan-mass witness never moves and is omitted from the cutaway view.
        bpy.data.objects["terminal"].hide_render = True
    elif clip == "bim":
        sid = "S05-SH16"
        local = f - 300
        u = local / 239
        for name in ["DEMO_DUCT_FIXED", "DEMO_TRAY_ROUTING"]:
            bpy.data.objects[name].hide_render = False
        routing = ease((local - 60) / 90)
        bpy.data.objects["DEMO_TRAY_ROUTING"].data.shape_keys.key_blocks[
            "ApprovedRouting"
        ].value = routing
        bpy.data.objects["CLASH_HIGHLIGHT"].hide_render = routing >= 0.301
    else:
        sid = "S05-SH17"
        u = f / 149
        for i, layer in enumerate(LAYERS):
            bpy.data.objects["BIM_ROOT_" + layer].location.z = OFFSETS[i] * (
                1 - ease(u)
            )
            for o in bpy.data.objects:
                if o.get("bim_layer") == layer and o.name != "CLASH_HIGHLIGHT":
                    o.hide_render = False
        bpy.data.objects["terminal"].hide_render = True
        bpy.data.objects["DEMO_TRAY_ROUTING"].data.shape_keys.key_blocks[
            "ApprovedRouting"
        ].value = 1
    factor = FACTORS.get(sid, 1) if fit else 1
    cam = camera_state(sid, u, factor)
    bpy.context.view_layer.update()
    return {
        "shot_id": sid,
        "local_frame": f,
        "camera": cam,
        "layer_z": {l: bpy.data.objects["BIM_ROOT_" + l].location.z for l in LAYERS},
        "routing": bpy.data.objects["DEMO_TRAY_ROUTING"]
        .data.shape_keys.key_blocks["ApprovedRouting"]
        .value,
    }


def subject_objects():
    return [
        o
        for o in bpy.data.objects
        if not o.hide_render
        and o.type == "MESH"
        and o.name != "Site extent: JSON scene_bounds"
        and o.name != "CLASH_HIGHLIGHT"
        and not any(c.name == "REFERENCE_ONLY" for c in o.users_collection)
    ]


def projected_bounds():
    ps = [
        world_to_camera_view(s, CAM, o.matrix_world @ Vector(v))
        for o in subject_objects()
        for v in o.bound_box
    ]
    if not ps:
        return [0.5, 0.5, 0.5, 0.5]
    return [
        min(p.x for p in ps),
        min(p.y for p in ps),
        max(p.x for p in ps),
        max(p.y for p in ps),
    ]


def calibrate():
    # Preserve numerical targets, angles, lens, easing. Only widen orthographic view or
    # increase perspective distance as allowed by the director's framing adjustment note.
    for clip in CLIPS:
        samples = range(0, CLIPS[clip]["frames"], 15)
        for f in list(samples) + [CLIPS[clip]["frames"] - 1]:
            info = state(clip, f, False)
            sid = info["shot_id"]
            bb = projected_bounds()
            need = (
                max(
                    1,
                    (0.5 - bb[0]) / 0.44,
                    (bb[2] - 0.5) / 0.26,
                    (0.5 - bb[1]) / 0.30,
                    (bb[3] - 0.5) / 0.34,
                )
                * 1.015
            )
            FACTORS[sid] = max(FACTORS.get(sid, 1), need)
    # Refine perspective framing after applying its distance correction.
    for clip in CLIPS:
        for f in range(0, CLIPS[clip]["frames"], 15):
            info = state(clip, f, True)
            bb = projected_bounds()
            need = max(
                1,
                (0.5 - bb[0]) / 0.44,
                (bb[2] - 0.5) / 0.26,
                (0.5 - bb[1]) / 0.30,
                (bb[3] - 0.5) / 0.34,
            )
            if need > 1.001:
                FACTORS[info["shot_id"]] *= need * 1.015
    (ROOT / "reports/camera-calibration.json").write_text(
        json.dumps(
            {
                "factors": FACTORS,
                "preserved": [
                    "target xyz",
                    "azimuth",
                    "elevation",
                    "focal length",
                    "cubic easing",
                ],
                "adjustments": "Constant per-shot orthographic view multiplier or perspective distance multiplier; protects title/subtitle/sidebar areas",
                "content_safe_normalized_bottom_up": [0.06, 0.20, 0.76, 0.84],
                "north_up_convention": "Projected north remains up-reference throughout planning; BIM uses world-Z-up. No reference switching within a shot; source y maps to -y",
            },
            indent=2,
        )
    )
