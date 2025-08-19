phina.globalize();

console.log = function () { };  // ログを出す時にはコメントアウトする

const FPS = 60;  // 60フレ

const SCREEN_WIDTH = 1080;              // スクリーン幅
const SCREEN_HEIGHT = 1920;              // スクリーン高さ
const SCREEN_CENTER_X = SCREEN_WIDTH / 2;   // スクリーン幅の半分
const SCREEN_CENTER_Y = SCREEN_HEIGHT / 2;  // スクリーン高さの半分

const FONT_FAMILY = "'Press Start 2P','Meiryo',sans-serif";
const ASSETS = {
    image: {
        "note": "./resource/hiroki_128.png",
        "koriki_anim": "./resource/koriki_anim.png",
        "referee_anim": "./resource/referee_anim.png",
    },
    spritesheet: {
        "koriki_ss":
        {
            frame: {
                "width": 128,
                "height": 128,
                "cols": 16, // フレーム数（横）
                "rows": 1, // フレーム数（縦）
            },
            animations: {
                "wait": {
                    "frames": [0, 1, 2, 3],
                    "next": "wait",
                    "frequency": 10,
                },
                "nof": {
                    "frames": [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                    "next": "nof",
                    "frequency": 10,
                },
            }
        },
        "referee_ss":
        {
            frame: {
                "width": 128,
                "height": 128,
                "cols": 14, // フレーム数（横）
                "rows": 1, // フレーム数（縦）
            },
            animations: {
                "count": {
                    "frames": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                    "next": "count",
                    "frequency": 10,
                },
                "bomaye": {
                    "frames": [13],
                    "next": "bomaye",
                    "frequency": 10,
                },
            }
        },
    },
    sound: {
        "fall_se": 'https://iwasaku.github.io/test7/NEMLESSSTER/resource/fall.mp3?20200708',
        "song_01": './resource/Satellaview.mp3',
    },
    json: {
        "ms_01": "./resource/nc_Satellaview.json"
    }
};

// 定義
const GAME_LEVEL = defineEnum({
    EASY: {
        //113
        text: "EASY",
        intensity: [5, 6],
        interval: 1000,
        gaugeInit: 100,
        gaugeLoss: 0.0,
    },
    NORMAL: {
        //208
        text: "NORMAL",
        intensity: [4, 5],
        interval: 1000,
        gaugeInit: 100,
        init: 10,
        gaugeLoss: 0.025,
    },
    HARD: {
        // 330
        text: "HARD",
        intensity: [3, 4],
        interval: 1500,
        gaugeInit: 75,
        gaugeLoss: 0.05,
    },
    EXTREME: {
        // 516
        text: "EXTREME",
        intensity: [1, 3],
        interval: 2700,
        gaugeInit: 50,
        gaugeLoss: 0.1,
    },
});
const GAME_MODE = defineEnum({
    START_INIT: {
        value: 0,
    },
    START: {
        value: 1,
    },
    GOAL_INIT: {
        value: 2,
    },
    GOAL: {
        value: 3,
    },
    END_INIT: {
        value: 4,
    },
    END: {
        value: 5,
    },
});

const KORIKI_MODE = defineEnum({
    WAIT: {
        idx: 0,
    },
    NIGHT_OF_FIRE: {
        idx: 1,
    },
});

const REFEREE_MODE = defineEnum({
    COUNT: {
        idx: 0,
    },
    BOMAYE: {
        idx: 1,
    },
});

const JUDGE = defineEnum({
    PERFECT: {
        idx: 0,
        text: "PERFECT",
        fill: "#7FFF00",
        stroke: "#000000",
        score: [3, 500], // WAIT中、NIGHT_OF_FIRE中
        combo: true,
        gauge: [30, 100], // WAIT中、NIGHT_OF_FIRE中
    },
    GREAT: {
        idx: 1,
        text: "GREAT",
        fill: "#FFFF00",
        stroke: "#000000",
        score: [2, 300],
        combo: true,
        gauge: [20, 20],
    },
    GOOD: {
        idx: 2,
        text: "GOOD",
        fill: "#FFA500",
        stroke: "#000000",
        score: [1, 100],
        combo: true,
        gauge: [10, 10],
    },
    BAD: {
        // 早すぎor遅すぎ
        idx: 3,
        text: "BAD",
        fill: "#FF0000",
        stroke: "#000000",
        score: [0, 0],
        combo: false,
        gauge: [-5, -5],
    },
    MISS: {
        // 押さなかった
        idx: 4,
        text: "MISS",
        fill: "#770000",
        stroke: "#000000",
        score: [0, 0],
        combo: false,
        gauge: [-10, -10],
    },
    NONE: {
        idx: 5,
        text: "NONE",
        fill: "#FFFFFF",
        stroke: "#000000",
        score: [0, 0],
        combo: true,
        gauge: [0, 0],
    },
});

const DELAY = 2 * FPS;
const TAP_SPR_NUM = 12; // タップスプライトの数
const TAP_SPR_INTERVAL_DEGREE = 360 / (TAP_SPR_NUM); // タップスプライト間の角度
const TAP_SPR_ARRANGE_RADIUS = (SCREEN_WIDTH / 2) - 96; // 中心からタップスプライトまでの距離
const KORIKI_GAUGE_MAX = 936; // 小力ゲージの最大値

let group0 = null;  // 
let group1 = null;  // ステージ
let group2 = null;  // BG小力、ノーツ
let group3 = null;  // タップスプライトの下地、タップエフェクト
let group4 = null;  // タップスプライト
let group5 = null;  // ステータス系
let notesArray = [];     // 管理用
let laneLastTimeArray = Array(12).fill(Number.MIN_SAFE_INTEGER);
let noteChart = null;
let judgeArray = [0, 0, 0, 0, 0];
let nowComboCount = 0;
let maxComboCount = 0;
let score = 0;
let korikiGaugeNow = 1;
let korikiMode = KORIKI_MODE.WAIT;
let isKorikiModeChange = false;
let korikiSpriteCurrentFrame = 0;
let refereeMode = REFEREE_MODE.COUNT;
let gameMode = GAME_MODE.START_INIT;
let gameLevel = GAME_LEVEL.EASY;

const stageColorsNormal = [
    170 / 2,
    212.5 / 2,
    255 / 2,
    212.5 / 2,
    170 / 2,
    127.5 / 2,
    85 / 2,
    42.5 / 2,
    0 / 2,
    42.5 / 2,
    85 / 2,
    127.5 / 2,
];
const stageColorsBomaye = [];
const channelKeys = ['r', 'g', 'b'];
for (const key of channelKeys) {
    for (const value of stageColorsNormal) {
        const color = { r: 0, g: 0, b: 0 };
        color[key] = value;
        stageColorsBomaye.push(color);
    }
}

phina.main(function () {
    let app = GameApp({
        startLabel: 'logo',
        backgroundColor: 'black',
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        assets: ASSETS,
        fps: FPS,

        // シーンのリストを引数で渡す
        scenes: [
            {
                className: 'LogoScene',
                label: 'logo',
                nextLabel: 'title',
            },
            {
                className: 'TitleScene',
                label: 'title',
                nextLabel: 'game',
            },
            {
                className: 'GameScene',
                label: 'game',
                nextLabel: 'game',
            },
        ]
    });

    // iOSなどでユーザー操作がないと音がならない仕様対策
    // 起動後初めて画面をタッチした時に『無音』を鳴らす
    app.domElement.addEventListener('touchend', function dummy() {
        var s = phina.asset.Sound();
        s.loadFromBuffer();
        s.play().stop();
        app.domElement.removeEventListener('touchend', dummy);
    });

    // fps表示
    //app.enableStats();

    // 実行
    app.run();
});

/*
*/
phina.define('LoadingScene', {
    superClass: 'DisplayScene',

    init: function (options) {
        this.superInit(options);
        var self = this;
        var loader = phina.asset.AssetLoader();

        // 明滅するラベル
        let label = phina.display.Label({
            text: "",
            fontSize: 64,
            fill: 'white',
        }).addChildTo(this).setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y);

        // ロードが進行したときの処理
        loader.onprogress = function (e) {
            // 進捗具合を％で表示する
            label.text = "{0}%".format((e.progress * 100).toFixed(0));
        };

        // ローダーによるロード完了ハンドラ
        loader.onload = function () {
            // Appコアにロード完了を伝える（==次のSceneへ移行）
            self.flare('loaded');
        };

        // ロード開始
        loader.load(options.assets);
    },

});

/*
 * ロゴ
 */
phina.define("LogoScene", {
    superClass: 'DisplayScene',

    init: function (option) {
        this.superInit(option);
        var self = this;
        // Promise.allでフォントのロードを待ち受ける
        Promise.all([
            document.fonts.load('10pt "Press Start 2P"'),
            document.fonts.load('10pt "icomoon"')
        ]).then(function () {
            // ロードが完了したら次のシーンへ
            self.exit();
        });
    },

    update: function (app) {
        // initで非同期的にシーン遷移するため、updateは空で良い
    }
});

/*
 * タイトル
 */
phina.define("TitleScene", {
    superClass: 'DisplayScene',

    init: function (option) {
        this.superInit(option);

        Label({
            text: "KV",
            fontSize: 512,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#fff",
            x: SCREEN_CENTER_X + 32,
            y: SCREEN_CENTER_Y - 256,
        }).addChildTo(this);

        this.easyButton = Button({
            text: "EASY",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            fill: "#444",
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y + 256 - 128,
            width: 256,
            cornerRadius: 8,
        }).addChildTo(this);
        this.normalButton = Button({
            text: "NORMAL",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            fill: "#444",
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y + 256 + 128 - 128,
            width: 256,
            cornerRadius: 8,
        }).addChildTo(this);
        this.hardButton = Button({
            text: "HARD",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            fill: "#444",
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y + 256 + 128 + 128 - 128,
            width: 256,
            cornerRadius: 8,
        }).addChildTo(this);
        this.extremeButton = Button({
            text: "EXTREME",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            fill: "#444",
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y + 256 + 128 + 128 + 128 - 128,
            width: 256,
            cornerRadius: 8,
        }).addChildTo(this);

        this.storybyLabel = Label({
            text: "Story\nby",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#fff",
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y + 256 + 128 + 128 + 128 + 48,
        }).addChildTo(this);
        this.hirokiosakaButton = Button({
            text: "@HIROKI_OSAKA_BG",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            fill: "#000",
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y + 256 + 128 + 128 + 128 + 128,
            width: 512,
            height: 48,
        }).addChildTo(this);
        this.localTimer = 0;

        let self = this;
        this.easyButton.onpointstart = function () {
            gameLevel = GAME_LEVEL.EASY;
            self.exit();
        };
        this.normalButton.onpointstart = function () {
            gameLevel = GAME_LEVEL.NORMAL;
            self.exit();
        };
        this.hardButton.onpointstart = function () {
            gameLevel = GAME_LEVEL.HARD;
            self.exit();
        };
        this.extremeButton.onpointstart = function () {
            gameLevel = GAME_LEVEL.EXTREME;
            self.exit();
        };
        this.hirokiosakaButton.onclick = function () {
            window.open('https://x.com/HIROKI_OSAKA_BG/status/1810602761849102464');
        };
    },

    update: function (app) {
    }
});

/*
 * ゲーム
 */
phina.define("GameScene", {
    superClass: 'DisplayScene',

    init: function (option) {
        this.superInit(option);
        noteChart = AssetManager.get('json', 'ms_01').data.notes;
        console.log(noteChart);

        clearArrays();

        group0 = DisplayElement().addChildTo(this);
        group1 = DisplayElement().addChildTo(this);
        group2 = DisplayElement().addChildTo(this);
        group3 = DisplayElement().addChildTo(this);
        group4 = DisplayElement().addChildTo(this);
        group5 = DisplayElement().addChildTo(this);

        // 小力アイコン
        for (let idx = 0; idx < TAP_SPR_NUM; idx++) {
            let tmp = KorikiSprite(idx).addChildTo(group4);
            //CircleShape({
            //    radius: 64,
            //    padding: 10,
            //    backgroundColor: "transparent",
            //    fill: "transparent",
            //    stroke: "#FFFFFF",
            //    strokeWidth: 5
            //}).addChildTo(group3).setPosition(tmp.x, tmp.y);
        }
        korikiSpriteCurrentFrame = 0;

        // ステージ
        // 円の半径
        const radius = (SCREEN_WIDTH / 2) - 10;
        // 正12角形の頂点を計算
        let vertices = [];
        for (let ii = 0; ii < 12; ii++) {
            let angle = (Math.PI * 2 * ii / 12) + (360 / 12 / 2 * Math.PI / 180); // 角度（ラジアン）
            let x = SCREEN_CENTER_X + radius * Math.cos(angle);
            let y = SCREEN_CENTER_Y + radius * Math.sin(angle);
            vertices.push({ x: x, y: y });
        }
        // 三角形を描画
        this.stageShapes = [];
        for (let ii = 0; ii < 12; ii++) {
            let nextIndex = (ii + 1) % 12; // 次の頂点（12番目は0番目に戻る）
            this.stageShapes[ii] = PathShape({
                paths: [
                    Vector2(SCREEN_CENTER_X, SCREEN_CENTER_Y),
                    Vector2(vertices[ii].x, vertices[ii].y),
                    Vector2(vertices[nextIndex].x, vertices[nextIndex].y)
                ],
                stroke: "transparent",
                strokeWidth: 0,
            }).addChildTo(group1);
            this.stageShapes[ii].r = stageColorsNormal[ii];
            this.stageShapes[ii].g = stageColorsNormal[ii];
            this.stageShapes[ii].b = stageColorsNormal[ii];
            this.stageShapes[ii].update = function () {
            };

            this.stageShapes[ii].draw = function (canvas) {
                var ctx = canvas.context;

                ctx.save();

                // パスを構築
                ctx.beginPath();
                this.paths.forEach((vertex, i) => {
                    if (i === 0) {
                        ctx.moveTo(vertex.x, vertex.y);
                    } else {
                        ctx.lineTo(vertex.x, vertex.y);
                    }
                });
                ctx.closePath();

                // グラデーションを作成
                const midX = (this.paths[1].x + this.paths[2].x) / 2;
                const midY = (this.paths[1].y + this.paths[2].y) / 2;
                let gradient = ctx.createLinearGradient(SCREEN_CENTER_X, SCREEN_CENTER_Y, midX, midY);
                gradient.addColorStop(0, 'rgb({0}, {1}, {2})'.format(this.r / 8, this.g / 8, this.b / 8));
                gradient.addColorStop(1, 'rgb({0}, {1}, {2})'.format(this.r, this.g, this.b));

                // 塗りつぶし
                ctx.fillStyle = gradient;
                ctx.fill();

                // ストローク（必要に応じて）
                if (this.stroke) {
                    ctx.strokeStyle = this.stroke;
                    ctx.lineWidth = this.strokeWidth || 1;
                    ctx.stroke();
                }

                ctx.restore();
            };

        }

        // 奥の正12角形
        PolygonShape({
            radius: SCREEN_WIDTH / 32,
            padding: 0,
            backgroundColor: "transparent",
            fill: "black",
            stroke: "transparent",
            strokeWidth: 0,
            sides: 12
        }).addChildTo(group1).setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y).setRotation(15);

        // 小力ゲージ
        this.korikiGaugeBg = RectangleShape({
            width: SCREEN_WIDTH - 128,
            height: 64,
            padding: 0,
            cornerRadius: 16,
            fill: "white",
        }).addChildTo(group5).setPosition(SCREEN_CENTER_X, 64);
        this.korikiGauge = KorikiGauge({
            paths: [
                Vector2(0, - 24),  // 左上
                Vector2(0, + 24),  // 左下
                Vector2(1, + 24),  // 右下
                Vector2(1, - 24),  // 右上
            ],
            padding: 0,
            stroke: "#fff",
            fill: "red",
        }).addChildTo(group5).setPosition(SCREEN_CENTER_X - (SCREEN_WIDTH - 128) / 2 + 8, 64);

        // レフリースプライト
        this.refereeSprite = RefereeSprite().addChildTo(group5);

        // BG小力
        this.bgKorikiSprite = BgKorikiSprite().addChildTo(group1);

        this.gameOverLabel = Label({
            text: "GAME OVER",
            fontSize: 112,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#FF0000",
            stroke: "#0000FF",
            strokeWidth: 10,
            shadow: "#FFFF00",
            shadowBlur: 50,
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y - 256,
        }).addChildTo(group5);

        this.scoreLabel = Label({
            text: "SCORE:     0",
            fontSize: 88,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#00FFFF",
            shadow: "#000",
            shadowBlur: 10,
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y - (SCREEN_CENTER_Y / 3) * 2,
        }).addChildTo(group5);
        this.perfectLabel = Label({
            text: "PERFECT:9999",
            fontSize: 48,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: JUDGE.PERFECT.fill,
            stroke: JUDGE.PERFECT.stroke,
            shadow: "#000",
            shadowBlur: 10,
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y - 64 * 2,
        }).addChildTo(group5);
        this.greatLabel = Label({
            text: "GREAT  :9999",
            fontSize: 48,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: JUDGE.GREAT.fill,
            stroke: JUDGE.GREAT.stroke,
            shadow: "#000",
            shadowBlur: 10,
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y - 64 * 1,
        }).addChildTo(group5);
        this.googLabel = Label({
            text: "GOOD   :9999",
            fontSize: 48,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: JUDGE.GOOD.fill,
            stroke: JUDGE.GOOD.stroke,
            shadow: "#000",
            shadowBlur: 10,
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y + 64 * 0,
        }).addChildTo(group5);
        this.badLabel = Label({
            text: "BAD    :9999",
            fontSize: 48,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: JUDGE.BAD.fill,
            stroke: JUDGE.BAD.stroke,
            shadow: "#000",
            shadowBlur: 10,
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y + 64 * 1,
        }).addChildTo(group5);
        this.missLabel = Label({
            text: "MISS   :9999",
            fontSize: 48,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: JUDGE.MISS.fill,
            stroke: JUDGE.MISS.stroke,
            shadow: "#000",
            shadowBlur: 10,
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y + 64 * 2,
        }).addChildTo(group5);
        this.comboLabel = Label({
            text: "COMBO:     0",
            fontSize: 88,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#FFFFFF",
            shadow: "#000",
            shadowBlur: 10,
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y + (SCREEN_CENTER_Y / 3) * 2,
        }).addChildTo(group5);

        this.xtwButton = Button({
            text: String.fromCharCode(0xe902),
            fontSize: 32,
            fontFamily: "icomoon",
            fill: "#7575EF",
            x: SCREEN_CENTER_X - 160 - 80,
            y: SCREEN_CENTER_Y + 256,
            cornerRadius: 8,
            width: 60,
            height: 60,
        }).addChildTo(group5);
        this.bskyButton = Button({
            text: String.fromCharCode(0xe900),
            fontSize: 32,
            fontFamily: "icomoon",
            fill: "#7575EF",
            x: SCREEN_CENTER_X - 160 + 80,
            y: SCREEN_CENTER_Y + 256,
            cornerRadius: 8,
            width: 60,
            height: 60,
        }).addChildTo(group5);
        this.threadsButton = Button({
            text: String.fromCharCode(0xe901),
            fontSize: 32,
            fontFamily: "icomoon",
            fill: "#7575EF",
            x: SCREEN_CENTER_X - 160,
            y: SCREEN_CENTER_Y + 256,
            cornerRadius: 8,
            width: 60,
            height: 60,
        }).addChildTo(group5);
        this.restartButton = Button({
            text: "RESTART",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            fill: "#B2B2B2",
            x: SCREEN_CENTER_X + 160,
            y: SCREEN_CENTER_Y + 256,
            cornerRadius: 8,
            width: 240,
            height: 60,
        }).addChildTo(group5);

        this.gameOverLabel.alpha = 0.0;
        this.scoreLabel.alpha = 1.0;
        this.perfectLabel.alpha = 0.0;
        this.greatLabel.alpha = 0.0;
        this.googLabel.alpha = 0.0;
        this.badLabel.alpha = 0.0;
        this.missLabel.alpha = 0.0;
        this.comboLabel.alpha = 1.0;
        this.xtwButton.alpha = 0.0;
        this.bskyButton.alpha = 0.0;
        this.threadsButton.alpha = 0.0;
        this.restartButton.alpha = 0.0;
        this.xtwButton.sleep();
        this.bskyButton.sleep();
        this.threadsButton.sleep();
        this.restartButton.sleep();

        var self = this;
        this.restartButton.onpointstart = function () {
            stageTimer = 0;
            self.exit();
        };

        this.buttonAlpha = 0.0;

        this.totalFrame = 0;    // STARTからの総フレーム数
        this.startTime = new Date();
        this.gameTime = 0.0;    // STARTからの経過時間（ミリ秒）
        this.introDelay = 0;    // STARTからサウンド再生するまでの時間（ミリ秒）
        this.outroDelay = 0;    // 最後のノーツを配置後から画面外まで移動し終わるまでの時間（ミリ秒）
        this.noteChartCounter = 0; // 譜面カウンター
        this.isSongPlay = false;    // 0:未再生 1:再生中

        judgeArray = [0, 0, 0, 0, 0];
        nowComboCount = 0;
        maxComboCount = 0;
        score = 0;
        korikiGaugeNow = gameLevel.gaugeInit;
        korikiMode = KORIKI_MODE.WAIT;
        isKorikiModeChange = false;
        refereeMode = REFEREE_MODE.COUNT;

        gameMode = GAME_MODE.START_INIT;
    },

    update: function (app) {
        switch (gameMode) {
            case GAME_MODE.START_INIT:
                gameMode = GAME_MODE.START;
            // FALLTHRU
            case GAME_MODE.START:
                this.totalFrame++;

                if (this.isSongPlay === false) {
                    if (DELAY <= ++this.introDelay) {
                        SoundManager.playMusic('song_01', 0, false);
                        this.isSongPlay = true;
                    }
                }
                const now = new Date();
                this.gameTime = now - this.startTime;

                if (korikiMode === KORIKI_MODE.NIGHT_OF_FIRE) {
                    korikiGaugeNow -= 1;
                    if (korikiGaugeNow <= 1) {
                        korikiGaugeNow = gameLevel.gaugeInit;
                        korikiMode = KORIKI_MODE.WAIT;
                        isKorikiModeChange = true;
                        refereeMode = REFEREE_MODE.COUNT;
                    }
                } else {
                    korikiGaugeNow -= gameLevel.gaugeLoss;
                    if (korikiGaugeNow <= 1) {
                        korikiGaugeNow = 1;
                        gameMode = GAME_MODE.GOAL_INIT;
                        SoundManager.play('fall_se');
                    }
                }

                if (isKorikiModeChange) {
                    if (korikiMode == KORIKI_MODE.NIGHT_OF_FIRE) {
                        for (let ii = 0; ii < 12; ii++) {
                            const twnr = this.stageShapes[ii].tweener.clear();
                            const startIndex = ii % stageColorsBomaye.length;

                            // 開始インデックスに基づいて色のシーケンスを適用
                            for (let jj = 0; jj < stageColorsBomaye.length; jj++) {
                                const colorIndex = (startIndex + jj) % stageColorsBomaye.length;
                                twnr.to({ r: stageColorsBomaye[colorIndex].r, g: stageColorsBomaye[colorIndex].g, b: stageColorsBomaye[colorIndex].b }, 100)
                            }
                            twnr.setLoop(true).play();
                        }
                        this.bgKorikiSprite.tweener
                            .clear()
                            .to({ alpha: 1.0 }, 1000)
                            .setLoop(false);
                    } else {
                        for (let ii = 0; ii < 12; ii++) {
                            this.stageShapes[ii].tweener
                                .clear()
                                .to({ r: stageColorsNormal[ii], g: stageColorsNormal[ii], b: stageColorsNormal[ii] }, 1000)
                                .setLoop(false)
                                .play();
                        }
                        this.bgKorikiSprite.tweener
                            .clear()
                            .to({ alpha: 0.0 }, 1000)
                            .setLoop(false);
                    }
                    isKorikiModeChange = false;
                }

                if (this.noteChartCounter < noteChart.length) {
                    let tmpMS = noteChart[this.noteChartCounter];
                    if (tmpMS.time <= this.gameTime) {
                        let notesCount = 0;
                        for (let idx = 0; idx < tmpMS.lane.length; idx++) {
                            if (notesCount >= 1) break;
                            if (tmpMS.lane[idx] >= gameLevel.intensity[0] && tmpMS.lane[idx] <= gameLevel.intensity[1]) {    // ゲームレベルにあった強度のレーンを選択
                                if (laneLastTimeArray[idx] + gameLevel.interval <= this.gameTime) {  // ゲームレベルにあった出現間隔
                                    laneLastTimeArray[idx] = this.gameTime;
                                    notesArray.push(NoteSprite("note", idx).addChildTo(group2));
                                    notesCount++;
                                }
                            }
                        }
                        this.noteChartCounter++;
                    }
                } else {
                    // outroはノーツが消えるまで待つ必要があるので１秒追加
                    if (DELAY + 1 * FPS <= ++this.outroDelay) {
                        gameMode = GAME_MODE.GOAL_INIT;
                    }
                }
                this.scoreLabel.text = "SCORE:" + paddingSpc(score, 6);
                this.comboLabel.text = "COMBO:" + paddingSpc(nowComboCount, 6);
                break;
            case GAME_MODE.GOAL_INIT:
                gameMode = GAME_MODE.GOAL;
                for (const shape of this.stageShapes) {
                    shape.tweener.pause();
                }
                SoundManager.stopMusic();
                this.isSongPlay = false;
                this.gameOverLabel.alpha = 1.0;
                this.perfectLabel.text = "PERFECT:" + paddingSpc(judgeArray[JUDGE.PERFECT.idx], 4);
                this.greatLabel.text = "GREAT  :" + paddingSpc(judgeArray[JUDGE.GREAT.idx], 4);
                this.googLabel.text = "GOOD   :" + paddingSpc(judgeArray[JUDGE.GOOD.idx], 4);
                this.badLabel.text = "BAD    :" + paddingSpc(judgeArray[JUDGE.BAD.idx], 4);
                this.missLabel.text = "MISS   :" + paddingSpc(judgeArray[JUDGE.MISS.idx], 4);
                this.comboLabel.text = "COMBO:" + paddingSpc(maxComboCount, 6);
                this.scoreLabel.alpha = 1.0;
                this.perfectLabel.alpha = 1.0;
                this.greatLabel.alpha = 1.0;
                this.googLabel.alpha = 1.0;
                this.badLabel.alpha = 1.0;
                this.missLabel.alpha = 1.0;
                this.comboLabel.alpha = 1.0;
            // FALLTHRU
            case GAME_MODE.GOAL:
                gameMode = GAME_MODE.END_INIT;
            // FALLTHRU
            case GAME_MODE.END_INIT:
                {
                    let postText = ("KV \n"
                        + "LEVEL:" + gameLevel.text + "\n"
                        + this.scoreLabel.text.replace(/\s+/g, '') + "\n"
                        + this.perfectLabel.text.replace(/\s+/g, '') + "\n"
                        + this.greatLabel.text.replace(/\s+/g, '') + "\n"
                        + this.googLabel.text.replace(/\s+/g, '') + "\n"
                        + this.badLabel.text.replace(/\s+/g, '') + "\n"
                        + this.missLabel.text.replace(/\s+/g, '') + "\n"
                        + this.comboLabel.text.replace(/\s+/g, ''));//.replace(/\s+/g, '');
                    let postURL = "https://iwasaku.github.io/test17/KV/";
                    let postTags = "#ネムレス #NEMLESSS #小力ビューの復権はあるか";
                    this.xtwButton.onclick = function () {
                        // https://developer.x.com/en/docs/twitter-for-websites/tweet-button/guides/web-intent
                        var shareURL = "https://x.com/intent/tweet?text=" + encodeURIComponent(postText + "\n" + postTags + "\n") + "&url=" + encodeURIComponent(postURL);
                        window.open(shareURL);
                    };
                    this.bskyButton.onclick = function () {
                        // https://docs.bsky.app/docs/advanced-guides/intent-links
                        var shareURL = "https://bsky.app/intent/compose?text=" + encodeURIComponent(postText + "\n" + postTags + "\n" + postURL);
                        window.open(shareURL);
                    };
                    this.threadsButton.onclick = function () {
                        // https://developers.facebook.com/docs/threads/threads-web-intents/
                        var shareURL = "https://www.threads.net/intent/post?text=" + encodeURIComponent(postText + "\n" + postTags + "\n") + "&url=" + encodeURIComponent(postURL);
                        window.open(shareURL);
                    };

                }
                gameMode = GAME_MODE.END;
            // FALLTHRU
            case GAME_MODE.END:
                this.buttonAlpha += 0.05;
                if (this.buttonAlpha > 1.0) {
                    this.buttonAlpha = 1.0;
                }
                this.xtwButton.alpha = this.buttonAlpha;
                this.bskyButton.alpha = this.buttonAlpha;
                this.threadsButton.alpha = this.buttonAlpha;
                this.restartButton.alpha = this.buttonAlpha;
                if (this.buttonAlpha > 0.7) {
                    this.xtwButton.wakeUp();
                    this.bskyButton.wakeUp();
                    this.threadsButton.wakeUp();
                    this.restartButton.wakeUp();
                }
        }
    }
});

/*
*/
phina.define("NoteSprite", {
    superClass: "Sprite",

    init: function (kind, idx) {
        this.sprName = kind;
        this.sprSize = 128;
        this.superInit(this.sprName, 128, 128);
        this.setInteractive(false);
        const rad = (idx * TAP_SPR_INTERVAL_DEGREE).toRadian(); // 度数をラジアン変換
        const delta = TAP_SPR_ARRANGE_RADIUS / DELAY;    // DELAYフレームでタップスプライトの位置まで移動する
        this.spd = phina.geom.Vector2(Math.cos(rad) * delta, Math.sin(rad) * delta);
        this.dist = 0;
        this.idx = idx;
        this.setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y).setScale(0.0).setRotation(idx * TAP_SPR_INTERVAL_DEGREE - 90);
    },

    update: function (app) {
        if ((gameMode != GAME_MODE.START_INIT) && (gameMode != GAME_MODE.START)) return;

        this.x += this.spd.x;
        this.y += this.spd.y;
        this.dist = calcDist(SCREEN_CENTER_X, SCREEN_CENTER_Y, this.x, this.y);
        this.setScale(calcScale(this.dist));

        // スケールが1.0以上になったらフェードアウトする
        if (this.scale.x >= 1.0) {
            // ※画面上から消える時のスケールは約1.3倍
            this.alpha = (1.3 - this.scale.x) * 1.0 / 0.3;
        }

        // 画面上から消えた
        if ((this.scale.x >= 1.0) && (this.dist >= TAP_SPR_ARRANGE_RADIUS + 128)) {
            updateStatus(-1, -1, JUDGE.MISS);
            // findIndexとspliceを使って安全に要素を削除する
            const index = notesArray.findIndex(note => note && note.id === this.id);
            if (index !== -1) {
                notesArray.splice(index, 1);
            }
            this.remove();
            // delete this; は不要です
        }
    },
});


/*
*/
phina.define("KorikiSprite", {
    superClass: "Sprite",

    init: function (idx) {
        const rad = (idx * TAP_SPR_INTERVAL_DEGREE).toRadian(); // 度数をラジアン変換
        const xx = SCREEN_CENTER_X + Math.cos(rad) * TAP_SPR_ARRANGE_RADIUS
        const yy = SCREEN_CENTER_Y + Math.sin(rad) * TAP_SPR_ARRANGE_RADIUS

        this.superInit("koriki_anim", 128, 128);
        this.anim = FrameAnimation('koriki_ss').attachTo(this);
        this.anim.fit = false;
        this.setPosition(xx, yy).setScale(1.0, 1.0).setRotation(idx * TAP_SPR_INTERVAL_DEGREE - 90);
        this.setInteractive(true);
        this.mode = KORIKI_MODE.WAIT;
        this.anim.gotoAndPlay("wait");
        this.idx = idx;
    },

    onpointstart: function () {
        let idxArray = [];
        // タップスプライトに対応したノーツのnotesArrayのidxを記録する
        for (let ii = 0; ii < notesArray.length; ii++) {
            if (notesArray[ii] === undefined) continue;
            if (notesArray[ii].idx == this.idx) {
                idxArray.push(ii);
            }
        }

        // タップスプライトに一番近いノーツを探す
        let nearNote = { idx: -1, y: 0, dist: 9999999 };
        for (let ii = 0; ii < idxArray.length; ii++) {
            let tmpNote = notesArray[idxArray[ii]];
            let tmpDist = calcDist(tmpNote.x, tmpNote.y, this.x, this.y);
            if (tmpDist <= 256) {
                if (tmpDist < nearNote.dist) {
                    nearNote.idx = idxArray[ii];
                    nearNote.dist = tmpDist;
                }
            }
        }

        // 一番近いノーツが見つかったら距離で判定を出す
        if (nearNote.idx >= 0) {
            let judge;
            if (nearNote.dist <= 16) {
                judge = JUDGE.PERFECT;
            } else if (nearNote.dist <= 32) {
                judge = JUDGE.GREAT;
            } else if (nearNote.dist <= 48) {
                judge = JUDGE.GOOD;
            } else if (nearNote.dist <= 64) {
                judge = JUDGE.BAD;
            } else if (nearNote.dist <= TAP_SPR_ARRANGE_RADIUS) {
                judge = JUDGE.MISS;
            } else {
                judge = JUDGE.NONE;
            }

            if (judge !== JUDGE.NONE) {
                updateStatus(this.x, this.y, judge);
                const noteToRemove = notesArray[nearNote.idx];
                if (noteToRemove) {
                    noteToRemove.remove();
                    notesArray.splice(nearNote.idx, 1);
                }
            }
        }
    },

    update: function (app) {
        // アニメーションの設定
        if (korikiMode !== this.mode) {
            if (korikiMode === KORIKI_MODE.WAIT) {
                this.mode = KORIKI_MODE.WAIT;
                this.anim.gotoAndPlay("wait");
            } else {
                this.mode = KORIKI_MODE.NIGHT_OF_FIRE;
                this.anim.gotoAndPlay("nof");
            }
        }
        if (this.idx === 0) {
            korikiSpriteCurrentFrame = this.anim.currentFrameIndex;
        }
    },
});

phina.define("BgKorikiSprite", {
    superClass: "Sprite",

    init: function () {
        this.superInit("koriki_anim", 128, 128);
        this.setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y).setScale(6.0, 6.0);
        this.setInteractive(false);
        this.alpha = 0.0;
        this.anim = FrameAnimation('koriki_ss').attachTo(this);
        this.anim.fit = false;
        this.anim.gotoAndPlay('nof');
    },

    // canvasのアンチエイリアスを無効にするためにdrawメソッドをオーバーライドする
    draw: function (canvas) {
        canvas.save();                          //canvasの状態をスタックに保存
        canvas.imageSmoothingEnabled = false;   //拡大時の補完を無効にする
        this.superMethod('draw', canvas);       //Spriteのdrawメソッド呼び出し
        canvas.restore();                       //他に影響が出ないように状態を戻す
    },
});

/*
*/
phina.define("KorikiGauge", {
    superClass: "PathShape",

    // 初期化
    init: function (options) {
        this.superInit(options);
    },

    update: function (app) {
        if (gameMode != GAME_MODE.START) return;

        this.changePath(2, korikiGaugeNow, +24);    // 右下
        this.changePath(3, korikiGaugeNow, -24);    // 右上
    },
});


phina.define("RefereeSprite", {
    superClass: "Sprite",

    init: function () {
        const xx = 0;
        const yy = 0;
        this.superInit("referee_anim", 128, 128);
        this.anim = FrameAnimation('referee_ss').attachTo(this);
        this.anim.fit = false;
        this.setPosition(xx, yy).setScale(1.0, 1.0);
        this.setInteractive(false);
        this.mode = REFEREE_MODE.COUNT;
        this.anim.gotoAndPlay("count");
    },

    update: function (app) {
        // korikiGaugeNowに基づいてx座標を計算
        // ゲージの幅は (SCREEN_WIDTH - 128) で、左端から8px離れた位置から始まる
        const gaugeWidth = SCREEN_WIDTH - 128 - 16; // 左右のマージンを考慮
        const gaugeStartX = SCREEN_CENTER_X - (SCREEN_WIDTH - 128) / 2 + 8;

        // korikiGaugeNowは1〜936の範囲なので、0〜1の範囲に正規化
        const normalizedGauge = (korikiGaugeNow - 1) / (KORIKI_GAUGE_MAX - 1);

        // ゲージの位置に応じてx座標を設定
        const xx = gaugeStartX + (gaugeWidth * normalizedGauge);
        const yy = 64; // ゲージと同じy座標

        this.setPosition(xx, yy);
        if (refereeMode !== this.mode) {
            if (refereeMode === REFEREE_MODE.COUNT) {
                this.mode = REFEREE_MODE.COUNT;
                this.anim.gotoAndPlay("count");
            } else {
                this.mode = REFEREE_MODE.BOMAYE;
                this.anim.gotoAndPlay("bomaye");
            }
        }
    },
});

// 判定を受けて各種ステータスを更新する
function updateStatus(xx, yy, judge) {
    judgeArray[judge.idx]++;
    if (judge.combo) {
        if (maxComboCount < ++nowComboCount) maxComboCount = nowComboCount;
    } else {
        nowComboCount = 0;
    }
    score += judge.score[korikiMode.idx];

    // 小力ゲージの値
    korikiGaugeNow += judge.gauge[korikiMode.idx];
    if (korikiGaugeNow >= KORIKI_GAUGE_MAX) {
        korikiGaugeNow = KORIKI_GAUGE_MAX;
        if (korikiMode === KORIKI_MODE.WAIT) {
            korikiMode = KORIKI_MODE.NIGHT_OF_FIRE;
            isKorikiModeChange = true;
            refereeMode = REFEREE_MODE.BOMAYE;
        }
    }
    if (korikiGaugeNow <= 1) {
        korikiGaugeNow = 1;
        if (judge.gauge[korikiMode.idx] < 0) {
            gameMode = GAME_MODE.GOAL_INIT;
            SoundManager.play('fall_se');
        }
    }

    // 判定表示
    if ((xx >= 0) && (yy >= 0)) {
        let tmpL = Label({
            text: judge.text,
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: judge.fill,
            stroke: judge.stroke,
            x: xx,
            y: yy - 48,   // タップアイコンの少し上に出す
        }).addChildTo(group5).tweener
            .clear()
            .to({ x: xx, y: yy - 200, scaleX: 2.0, scaleY: 2.0, alpha: 0 }, 500)
            .call(function () {
                tmpL.remove();
            })
            .setLoop(false)
            .play();

        let tmpC = CircleShape({
            radius: 64,
            padding: 10,
            backgroundColor: "transparent",
            fill: "transparent",
            stroke: judge.fill,
            strokeWidth: 5
        }).addChildTo(group3).setPosition(xx, yy).tweener
            .clear()
            .to({ scaleX: 2.0, scaleY: 2.0, alpha: 0 }, 500)
            .call(function () {
                tmpC.remove();
            })
            .setLoop(false)
            .play();

    }
}

// 配列クリア
function clearArrays() {
    notesArray = [];
    laneLastTimeArray.fill(Number.MIN_SAFE_INTEGER);
    if (group0 != null) group0.children.clear();
    if (group1 != null) group1.children.clear();
    if (group2 != null) group2.children.clear();
    if (group3 != null) group3.children.clear();
    if (group4 != null) group4.children.clear();
    if (group5 != null) group5.children.clear();
}

// ２点間の距離を求める
function calcDist(aX, aY, bX, bY) {
    return Math.sqrt(Math.pow(aX - bX, 2) + Math.pow(aY - bY, 2));
}

// 画面中心からの距離で表示倍率を求める
function calcScale(dist) {
    let scale = dist / TAP_SPR_ARRANGE_RADIUS;   // タップスプライトの位置で1.0になるように調整する
    if (scale <= 0.0) scale = 0.0;
    return scale;
}

// ゼロ埋め
function paddingSpc(val, digit) {
    var zeros = Array(digit + 1).join(" ");
    return (zeros + val).slice(-digit);
}
