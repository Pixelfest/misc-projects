extends RigidBody2D
## While mounted, the crate is frozen and trails the bike's transform
## (same lag-follow idea as the rider) so it wobbles on the rack.
## knock_off() unfreezes it: gravity + collision take over, it topples
## when it lands, and once it touches the ground it spills its bottles.

signal fallen
signal landed

@export var mount_offset: Vector2 = Vector2.ZERO
@export var follow_speed: float = 10.0
@export var wobble_amplitude_deg: float = 2.0
@export var wobble_speed: float = 5.0
@export var bottle_scene: PackedScene
@export var bottle_scatter_speed: float = 70.0

var _bike: Node2D
var _time: float = randf() * TAU
var _smoothed_position: Vector2
var _smoothed_rotation: float = 0.0
var _mounted: bool = true
var _has_spilled: bool = false

@onready var _bottle_slots: Array = get_node("BottleSlots").get_children()

func _ready() -> void:
	contact_monitor = true
	max_contacts_reported = 4
	freeze = true
	body_entered.connect(_on_body_entered)

func setup(bike: Node2D, offset: Vector2) -> void:
	_bike = bike
	mount_offset = offset
	_smoothed_position = bike.global_position
	_smoothed_rotation = bike.global_rotation
	global_position = _smoothed_position + mount_offset.rotated(_smoothed_rotation)
	global_rotation = _smoothed_rotation

func is_mounted() -> bool:
	return _mounted

func _process(delta: float) -> void:
	if not _mounted or _bike == null:
		return
	_time += delta
	var w: float = 1.0 - exp(-follow_speed * delta)
	_smoothed_position = _smoothed_position.lerp(_bike.global_position, w)
	_smoothed_rotation = lerp_angle(_smoothed_rotation, _bike.global_rotation, w)

	var own_wobble := sin(_time * wobble_speed) * deg_to_rad(wobble_amplitude_deg)
	global_position = _smoothed_position + mount_offset.rotated(_smoothed_rotation)
	global_rotation = _smoothed_rotation + own_wobble

func knock_off() -> void:
	if not _mounted:
		return
	_mounted = false
	freeze = false
	linear_velocity = Vector2(randf_range(-30, 30), randf_range(-90, -30))
	angular_velocity = randf_range(-6.0, 6.0)
	fallen.emit()

func _on_body_entered(body: Node) -> void:
	if _has_spilled or _mounted:
		return
	if body.is_in_group("ground"):
		_has_spilled = true
		landed.emit()
		# body_entered fires mid physics-step; adding new physics bodies
		# (the bottles) has to wait until the step finishes.
		_spill_bottles.call_deferred()

func _spill_bottles() -> void:
	if bottle_scene == null:
		return
	var world := get_parent()
	for slot in _bottle_slots:
		var bottle: RigidBody2D = bottle_scene.instantiate()
		world.add_child(bottle)
		bottle.global_position = slot.global_position
		bottle.linear_velocity = Vector2(
			randf_range(-bottle_scatter_speed, bottle_scatter_speed),
			randf_range(-bottle_scatter_speed * 1.4, -bottle_scatter_speed * 0.3)
		)
		bottle.angular_velocity = randf_range(-10.0, 10.0)
