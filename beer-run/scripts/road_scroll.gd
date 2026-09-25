extends Node2D
## Infinite horizontal scroll for a row of equally-spaced tile children,
## purely cosmetic backdrop for "driving down a road" (no bump/hole
## gameplay logic here yet).

@export var speed: float = 70.0
@export var tile_width: float = 64.0

@onready var _tiles: Array = get_children()

func _process(delta: float) -> void:
	var dx := speed * delta
	var span := tile_width * _tiles.size()
	for t in _tiles:
		t.position.x -= dx
		if t.position.x <= -tile_width:
			t.position.x += span
