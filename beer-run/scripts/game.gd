extends Node2D
## Test harness for the base scene: wires the bike, rider and three crates
## together, scrolls the road backdrop, and lets you press Space to knock a
## crate off (simulating hitting an obstacle) so the fall/topple/spill
## animation can be checked without real obstacle/dodge gameplay yet.

@onready var bike: Node2D = $Bike
@onready var rider: Node2D = $Rider
@onready var crates: Array = [$Crate1, $Crate2, $Crate3]
@onready var crates_label: Label = $HUD/CratesLabel
@onready var game_over_label: Label = $HUD/GameOverLabel
@onready var hint_label: Label = $HUD/HintLabel

var _crates_remaining: int = 3

func _ready() -> void:
	game_over_label.visible = false
	_update_hud()

	rider.set_target(bike, Vector2(-2, -16))

	var offsets := [Vector2(-14, -8), Vector2(-2, -9), Vector2(10, -8)]
	for i in crates.size():
		crates[i].setup(bike, offsets[i])
		crates[i].fallen.connect(_on_crate_fallen)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_SPACE:
			_knock_off_next_crate()
		elif event.keycode == KEY_R and game_over_label.visible:
			get_tree().reload_current_scene()

func _knock_off_next_crate() -> void:
	for c in crates:
		if c.is_mounted():
			c.knock_off()
			return

func _on_crate_fallen() -> void:
	_crates_remaining -= 1
	_update_hud()
	if _crates_remaining <= 0:
		game_over_label.visible = true
		hint_label.text = "Press R to restart"

func _update_hud() -> void:
	crates_label.text = "Beer crates: %d / 3" % _crates_remaining
