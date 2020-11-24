import GameCore = require("./GameCore");

function main(param: g.GameMainParameterObject): void {
	const scene = new g.Scene({
		game: g.game,
		assetIds: ["se", "do", "re", "mi", "fa", "so", "ra", "si", "button_answer"]
	});

	scene.loaded.add(() => {
		new GameCore(scene);
	});

	g.game.pushScene(scene);
}

export = main;
