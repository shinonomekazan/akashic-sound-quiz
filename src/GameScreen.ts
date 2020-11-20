import { Label } from "@akashic-extension/akashic-label";
import BottomPopup = require("./BottomPopup");
import Button = require("./button/Button");
import ImageTextButton = require("./button/ImageTextButton");
import TextButton = require("./button/TextButton");
import turn = require("./enum/Turn");
import GameCore = require("./GameCore");
import Player = require("./Player");

class GameScreen extends g.E {

	gameCore: GameCore;

	statusTextLayout: g.E;
	phaseTextLayout: g.E;
	phaseScreenLayout: g.E;

	gameStatusLabel: Label;
	userStatusLabel: Label;
	questionLabel: Label;
	answerLabel: Label;

	resetButton: Button;
	questionButton: Button;
	stopButton: Button;
	nextButton: Button;
	finishButton: Button;

	popup: BottomPopup;

	currentTurn: turn;

	question: string;
	answer: string;

	quizNum: number;

	constructor(params: g.EParameterObject, gameCore: GameCore) {
		super(params);

		this.gameCore = gameCore;

		this.quizNum = 0;

		// background
		new g.FilledRect({
			scene: this.scene,
			cssColor: "Indigo",
			width: this.width,
			height: this.height,
			local: true,
			parent: this
		});

		this.scene.message.add(ev => {
			if (!ev.data) return;

			if (ev.data.message === "Answer") {
				this.onReceiveAnswer(ev);
			}

			if (ev.data.message === "Failed") {
				if (ev.player.id !== g.game.selfId && g.game.age - ev.data.age < g.game.fps * 3)
				    this.showPopup("Player" + ev.player.id + " Failed !");
			}

			if (ev.data.message === "Clear") {
				if (ev.player.id !== g.game.selfId && g.game.age - ev.data.age < g.game.fps * 3)
				    this.showPopup("Player" + ev.player.id + " Clear !");
			}

			if (ev.data.message === "ClosePopup") {
				if (ev.player.id === g.game.selfId)
					this.closePopup();
			}
		});

		this.createLayout();
		this.createTop();
		this.createAnswerButtons();
		this.createMasterButtons();

		this.onQuestionTurn();
	}

	createLayout(): void {
		this.statusTextLayout = new g.E({
			scene: this.scene,
			// cssColor: "black",
			width: Math.round((this.width - 16) / 2),
			height: 100,
			x: 0,
			y: 0,
			local: true,
			parent: this
		});

		this.phaseTextLayout = new g.E({
			scene: this.scene,
			// cssColor: "black",
			width: Math.round((this.width - 16) / 2),
			height: 100,
			x: Math.round((this.width - 16) / 2) + 16,
			y: 0,
			local: true,
			parent: this
		});

		this.phaseScreenLayout = new g.E({
			scene: this.scene,
			// cssColor: "black",
			width: this.width,
			height: this.width,
			anchorX: .5,
			anchorY: .5,
			x: this.width / 2,
			y: this.height / 2,
			local: true,
			parent: this
		});
	}

	createTop(): void {
		this.gameStatusLabel = new Label({
			scene: this.scene,
			width: this.statusTextLayout.width - 24,
			font: this.gameCore.font,
			fontSize: 18,
			text: "gameStatusLabel",
			textColor: "white",
			x: 12,
			y: 8,
			local: true,
			parent: this.statusTextLayout
		});

		this.userStatusLabel = new Label({
			scene: this.scene,
			width: this.statusTextLayout.width - 24,
			font: this.gameCore.font,
			fontSize: 18,
			text: "userStatusLabel",
			textColor: "white",
			x: 12,
			y: 40,
			hidden: this.gameCore.myPlayer.isMaster(),
			local: true,
			parent: this.statusTextLayout
		});

		this.questionLabel = new Label({
			scene: this.scene,
			width: this.phaseTextLayout.width - 24,
			font: this.gameCore.font,
			fontSize: 18,
			text: "questionLabel",
			textColor: "white",
			x: 12,
			y: 8,
			hidden: !this.gameCore.myPlayer.isMaster(),
			local: true,
			parent: this.phaseTextLayout
		});

		this.answerLabel = new Label({
			scene: this.scene,
			width: this.phaseTextLayout.width - 24,
			font: this.gameCore.font,
			fontSize: 18,
			text: "answerLabel",
			textColor: "white",
			x: 12,
			y: 8,
			hidden: this.gameCore.myPlayer.isMaster(),
			local: true,
			parent: this.phaseTextLayout
		});
	}

	createAnswerButtons(): void {
		let buttons = ["C", "D", "E", "F", "G", "A", "B"];

		let parent = this.phaseScreenLayout;
		let width = Math.round(parent.width / 6);
		let height = width;
		let spaceX = (parent.width - width * 4) / 5;
		let spaceY = spaceX;
		let startX = spaceX + (width / 2);
		let stratY = spaceY * 2 + (height / 2);

		let image = parent.scene.assets.button_answer as g.ImageAsset;

		for (let i = 0; i < buttons.length; i++) {
			new ImageTextButton({
				scene: parent.scene,
				src: image,
				srcWidth: image.width,
				srcHeight: image.height,
				text: buttons[i],
				fontSize: Math.round(width / 2),
				width: width,
				height: height,
				x: startX + (i % 4) * (width + spaceX),
				y: stratY + Math.floor(i / 4) * (height + spaceY),
				isCercle: true,
				local: true,
				parent: parent
			})
				.onClick.add(this.onAnswer, this);
		}
	}

	createMasterButtons(): void {
		let parent = this.phaseScreenLayout;

		let width = Math.round((parent.width - 40) / 2);
		let height = Math.round(width / 3);

		this.resetButton = new TextButton({
			scene: parent.scene,
			width: width,
			height: height,
			text: "Reset",
			fontSize: Math.round(height / 2),
			x: width / 2 + 16,
			y: parent.height - height / 2 - 32
		});

		this.questionButton = new TextButton({
			scene: parent.scene,
			width: width,
			height: height,
			text: "Question!",
			fontSize: Math.round(height / 2),
			x: width * 3 / 2 + 24,
			y: parent.height - height / 2 - 32
		});

		this.stopButton = new TextButton({
			scene: parent.scene,
			width: width,
			height: height,
			text: "Stop",
			fontSize: Math.round(height / 2),
			x: parent.width / 2,
			y: parent.height - height / 2 - 32
		});

		this.nextButton = new TextButton({
			scene: parent.scene,
			width: width,
			height: height,
			text: "Next",
			fontSize: Math.round(height / 2),
			x: parent.width / 2,
			y: parent.height - height / 2 - 32
		});

		this.finishButton = new TextButton({
			scene: parent.scene,
			width: width,
			height: height,
			text: "Finish",
			fontSize: Math.round(height / 2),
			x: parent.width / 2,
			y: parent.height + height / 2 - 16
		});

		this.resetButton.onClick.add(this.onReset, this);
		this.questionButton.onClick.add(this.onQuestion, this);
		this.stopButton.onClick.add(this.onStop, this);
		this.nextButton.onClick.add(this.onNext, this);
		this.finishButton.onClick.add(this.onFinish, this);

		if (this.gameCore.myPlayer.isMaster()) {
			parent.append(this.resetButton);
			parent.append(this.questionButton);
			parent.append(this.stopButton);
			parent.append(this.nextButton);
			parent.append(this.finishButton);
		}
	}

	showPopup(text: string): void {
		if (this.popup && !this.popup.destroyed()) {
			this.popup.label.text = text;
			this.popup.label.invalidate();
			return;
		}

		// this.popup = new Popup({
		//     scene: this.scene,
		//     text: text,
		//     font: this.gameCore.font,
		//     width: this.width * .8,
		//     x: g.game.width / 2,
		//     y: g.game.height / 2,
		//     anchorX: .5,
		//     anchorY: .5,
		//     local: true,
		//     parent: this.scene
		// });

		this.popup = new BottomPopup({
			scene: this.scene,
			text: text,
			font: this.gameCore.font,
			width: this.width,
			x: g.game.width / 2,
			y: g.game.height,
			anchorX: .5,
			anchorY: 1,
			local: true,
			parent: this.scene
		});

		this.popup.closeButton.onClick.add(() => {
			g.game.raiseEvent(new g.MessageEvent({ message: "ClosePopup" }));
		});
	}

	closePopup(): void {
		if (this.popup && !this.popup.destroyed()) {
			this.popup.destroy();
		}
	}

	onQuestionTurn(): void {
		console.log("onQuestionTurn");
		this.currentTurn = turn.question;

		this.resetButton.show();
		this.questionButton.show();
		this.stopButton.hide();
		this.nextButton.hide();
		this.finishButton.hide();

		this.question = "";
		this.answer = "";

		this.quizNum++;

		this.gameStatusLabel.text = "Quiz: " + this.quizNum;
		this.gameStatusLabel.invalidate();

		this.userStatusLabel.text = "";
		this.userStatusLabel.invalidate();

		this.questionLabel.text = "Question: ";
		this.questionLabel.invalidate();

		this.answerLabel.text = "";
		this.answerLabel.invalidate();
	}

	onAnswerTurn(): void {
		console.log("onAnswerTurn");
		this.currentTurn = turn.answer;

		this.resetButton.hide();
		this.questionButton.hide();
		this.stopButton.show();
		this.nextButton.hide();
		this.finishButton.hide();

		this.answerLabel.text = "Answer: ";
		this.answerLabel.invalidate();
	}

	onResult(): void {
		console.log("onResult");
		this.currentTurn = -1;

		this.resetButton.hide();
		this.questionButton.hide();
		this.stopButton.hide();
		this.nextButton.show();
		this.finishButton.show();

		if (!this.gameCore.myPlayer.isMaster()) {
			if (this.checkWin()) this.onWin();
			else this.onLose();
		}

		this.closePopup();
	}

	onLose(): void {
		console.log("onLose");
		this.currentTurn = -1;

		this.userStatusLabel.text = "You Lose";
		this.userStatusLabel.invalidate();
	}

	onWin(): void {
		console.log("onWin");
		this.currentTurn = -1;

		this.userStatusLabel.text = "You Win";
		this.userStatusLabel.invalidate();
	}

	checkLose(): boolean {
		return this.question.indexOf(this.answer) !== 0;
	}

	checkWin(): boolean {
		return this.question === this.answer;
	}

	emitAnswer(text: string): void {
		g.game.raiseEvent(new g.MessageEvent({ message: "Answer", text: text }));
	}

	onReceiveAnswer(ev: g.MessageEvent): void {
		let text = ev.data.text;

		if (this.currentTurn === turn.question && ev.player.id === Player.masterId) {
			if (this.question.length >= 20) {
				console.log("Question is limited !");
				return;
			}

			this.question += text;
			this.questionLabel.text += this.gameCore.myPlayer.isMaster() ? text : "*";
			this.questionLabel.invalidate();

			(this.scene.assets.sound2 as g.AudioAsset).play();
		} else if (this.currentTurn === turn.answer && ev.player.id !== Player.masterId) {
			if (ev.player.id !== g.game.selfId) return;

			this.answer += text;
			this.answerLabel.text += text;
			this.answerLabel.invalidate();

			(this.scene.assets.sound2 as g.AudioAsset).play();

			if (this.checkLose()) {
				this.onLose();
				g.game.raiseEvent(new g.MessageEvent({ message: "Failed", age: g.game.age }));
			} else if (this.checkWin()) {
				this.onWin();
				g.game.raiseEvent(new g.MessageEvent({ message: "Clear", age: g.game.age }));
			}
		}
	}

	onAnswer(ev: g.PointEvent): void {
		let text = (ev.target.parent as TextButton).text.text;

		if (this.currentTurn === turn.question && ev.player.id === Player.masterId) {
			if (this.question.length >= 20) {
				console.log("Question is limited !");
				return;
			}
			this.emitAnswer(text);
		} else if (this.currentTurn === turn.answer && ev.player.id !== Player.masterId) {
			if (ev.player.id !== g.game.selfId) return;
			this.emitAnswer(text);
		}
	}

	onReset(ev: g.PointEvent): void {
		if (ev.player.id !== Player.masterId) return;
		if (this.question === "") return;
		console.log("onReset");

		this.question = "";
		this.questionLabel.text = "Question: ";
		this.questionLabel.invalidate();

		(this.scene.assets.se as g.AudioAsset).play();
	}

	onQuestion(ev: g.PointEvent): void {
		if (ev.player.id !== Player.masterId) return;
		if (this.question.length === 0) {
			console.log("Question is empty !");
			return;
		}
		this.onAnswerTurn();
	}

	onStop(ev: g.PointEvent): void {
		if (ev.player.id !== Player.masterId) return;
		this.onResult();
	}

	onNext(ev: g.PointEvent): void {
		if (ev.player.id !== Player.masterId) return;
		this.onQuestionTurn();
	}

	onFinish(ev: g.PointEvent): void {
		if (ev.player.id !== Player.masterId) return;
		console.log("onFinish");
	}

}

export = GameScreen;
