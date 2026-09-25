extends Node2D
## Makes this node trail a target's world transform with a slight delay
## ("follow-through"), plus a small independent secondary wobble of its own.
## Used by the rider (following the bike) and by mounted crates.

@export var target_path: NodePath
@export var mount_offset: Vector2 = Vector2.ZERO
@export var follow_speed: float = 8.0
@export var extra_wobble_amplitude_deg: float = 1.5
@export var extra_wobble_speed: float = 4.7

var _target: Node2D
var _time: float = randf() * TAU
var _smoothed_position: Vector2
var _smoothed_rotation: float = 0.0
var _active: bool = true

func _ready() -> void:
	if target_path != NodePath(""):
		_target = get_node(target_path)
		_smoothed_position = _target.global_position
		_smoothed_rotation = _target.global_rotation

func set_target(target: Node2D, offset: Vector2 = Vector2.ZERO) -> void:
	_target = target
	mount_offset = offset
	_smoothed_position = target.global_position
	_smoothed_rotation = target.global_rotation

func set_active(active: bool) -> void:
	_active = active

func _process(delta: float) -> void:
	if not _active or _target == null:
		return
	_time += delta
	var w: float = 1.0 - exp(-follow_speed * delta)
	_smoothed_position = _smoothed_position.lerp(_target.global_position, w)
	_smoothed_rotation = lerp_angle(_smoothed_rotation, _target.global_rotation, w)

	var own_wobble := sin(_time * extra_wobble_speed) * deg_to_rad(extra_wobble_amplitude_deg)
	global_position = _smoothed_position + mount_offset.rotated(_smoothed_rotation)
	global_rotation = _smoothed_rotation + own_wobble
