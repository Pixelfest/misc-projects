extends Node2D
## Procedural "riding on a bumpy road" wobble for the bike itself.
## Rider and crates don't read this directly — they track the bike's
## actual position/rotation each frame and add their own lag on top,
## so nothing needs to be wired together by hand.

@export var bob_amplitude: float = 2.0
@export var bob_speed: float = 3.4
@export var tilt_amplitude_deg: float = 2.5
@export var tilt_speed: float = 2.1
@export var noise_strength_px: float = 1.2
@export var noise_strength_deg: float = 1.0

var _time: float = randf() * TAU
var _noise := FastNoiseLite.new()
var _base_position: Vector2

func _ready() -> void:
	_base_position = position
	_noise.seed = randi()
	_noise.frequency = 1.0

func _process(delta: float) -> void:
	_time += delta
	var bob := sin(_time * bob_speed) * bob_amplitude
	var bob_noise := _noise.get_noise_1d(_time * 6.0) * noise_strength_px
	var tilt := sin(_time * tilt_speed) * tilt_amplitude_deg
	var tilt_noise := _noise.get_noise_1d(_time * 4.0 + 500.0) * noise_strength_deg

	position = _base_position + Vector2(0, bob + bob_noise)
	rotation_degrees = tilt + tilt_noise
