// chromaの値が大きい方から最大6個取得する版
let audioContext, analyzer, source, audio;
let bpm = 0;
let timeOld = -100.0;
let timeNow = 0;
let musicSheet = [];
const threshold = 0.9; // 音楽に合わせて調整

function startAnalysis() {
    const fileInput = document.getElementById('mp3File');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select an MP3 file.');
        return;
    }

    // 既存のオーディオ要素があれば一旦削除し、新しいファイルで再生成
    if (audio) {
        audio.pause();
        audio = null;
    }
    audio = new Audio(URL.createObjectURL(file));
    audio.id = "audio";
    audio.controls = true; // ユーザーが再生・停止できるようにコントロールを表示
    document.body.appendChild(audio);

    if (!audioContext) {
        setupAudioContext();
    }

    // bmp detection
    {
        const objectURL = window.URL.createObjectURL(fileInput.files[0]);
        const fileName = fileInput.files[0].name;
        // Instanciation of BeatDetect with all its provided options
        const bt = new BeatDetect({
            sampleRate: sampleRate,
            log: false, // Debug BeatDetect execution with logs
            perf: false, // Attach elapsed time to result object
            round: false, // To have an integer result for the BPM
            float: 4, // The floating precision in [1, Infinity]
            lowPassFreq: 150, // Low pass filter cut frequency
            highPassFreq: 100, // High pass filter cut frequency
            bpmRange: [120, 500], // The BPM range to output
            timeSignature: 4 // The number of beat in a measure
        });
        bt.getBeatInfo({
            url: objectURL,
            name: fileName
        }).then(info => {
            console.log(info);
            bpm = info.bpm;
        }).catch(error => {
            console.error(error);
        });
    }

    // chroma feature extraction
    timeOld = -100.0;
    timeNow = 0;
    musicSheet = [];
    audio.oncanplaythrough = () => {
        audio.play();

        // Meydaの設定と解析開始
        analyzer = Meyda.createMeydaAnalyzer({
            'audioContext': audioContext,
            'source': source,
            'bufferSize': 512,
            'hopSize': 512,
            'sampleRate': sampleRate,
            'startImmediately': true,
            'featureExtractors': ['chroma'],
            'callback': features => {
                const chroma = features.chroma;
                let chromaArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                if (timeNow - timeOld >= 60 / bpm) {
                    for (let ii = 0; ii < chroma.length; ii++) {
                        if (chroma[ii] > threshold) {
                            chromaArray[ii] = chroma[ii];
                        }
                    }

                    // 配列のインデックスと値をセットで保持
                    let indexedArray = chromaArray.map((value, index) => ({ value, index }));

                    // 値を降順にソート
                    indexedArray.sort((a, b) => b.value - a.value);

                    // 上位6個のインデックスを取得
                    let top6Indexes = indexedArray.slice(0, 6);

                    // 元の配列を更新し、上位6個の位置に1から6の値をセットし、それ以外は0にする
                    chromaArray = chromaArray.map((value, index) => {
                        // 上位6個のインデックスの位置に1から6を割り当てる
                        let topIndex = top6Indexes.findIndex(item => item.index === index);
                        return topIndex !== -1 && value !== 0 ? topIndex + 1 : 0;
                    });

                    // 一つでも0以外の数字があればmusicSheetに出力する
                    if (chromaArray.some(val => val != 0)) {
                        let tmp = { time: timeNow * 1000, lane: chromaArray };
                        musicSheet.push(tmp);
                    }
                    timeOld = timeNow;
                }
                timeNow += 512 / sampleRate;
            }
        });

        analyzer.start();
    };

    // 音楽が終わったら解析も止める
    audio.addEventListener('ended', () => {
        if (analyzer) analyzer.stop();

        var tmp = {
            "version": "1.0",
            "song":
            {
                "title": file.name,
                "artist": "Auto Generated",
                "bpm": bpm,
                "duration": audio.duration,
            },
            "notes": musicSheet
        };
        // 譜面データをダウンロード
        // JSON形式に変換
        //        const json = JSON.stringify(musicSheet);
        const json = JSON.stringify(tmp);

        // Blobオブジェクトを作成
        const blob = new Blob([json], { type: 'application/json' });

        // ダウンロードリンクを作成
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'nc_' + file.name.split(".")[0]; + '.json';

        // リンクをクリックしてダウンロードを開始
        link.click();

        // 後片付け
        URL.revokeObjectURL(link.href);
    });
}

function setupAudioContext() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    source = audioContext.createMediaElementSource(document.getElementById('audio'));
    source.connect(audioContext.destination);
    sampleRate = audioContext.sampleRate;
    console.log("sampleRate: " + sampleRate);
}
