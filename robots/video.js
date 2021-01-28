const gm = require('gm').subClass({ imageMagick: true });
const state = require('./state.js');
const spawn = require('child_process').spawn;
const path = require('path');
const rootPath = path.resolve(__dirname, '..');


async function robot() {
    console.log('> [video-robot] Starting...');
    const content = state.load();

    await convertAllImages(content);
    await createAllSentenceImages(content);
    await createYoutubeThumbnail();

    await createAfterEffectsScript(content);
    await renderVideoWithAfterEffects();

    state.save(content)

    async function convertAllImages(content) {
        for (let index in content.sentences) {
            await convertImage(index);
        }
    }


    async function convertImage(index) {
        return new Promise((resolve, reject) => {
            const inputFile = `./content/${index}-original.png[0]`;
            const outputFile = `./content/${index}-converted.png`;
            const width = 1920;
            const height = 1080;

            gm()
                .in(inputFile)
                .out('(')
                .out('-clone')
                .out('0')
                .out('-background', 'white')
                .out('-blur', '0x9')
                .out('-resize', `${width}x${height}^`)
                .out(')')
                .out('(')
                .out('-clone')
                .out('0')
                .out('-background', 'white')
                .out('-resize', `${width}x${height}`)
                .out(')')
                .out('-delete', '0')
                .out('-gravity', 'center')
                .out('-compose', 'over')
                .out('-composite')
                .out('-extent', `${width}x${height}`)
                .write(outputFile, (error) => {
                    if (error) {
                        return reject(error);
                    }

                    console.log(`> [video-robot] Image converted: ${outputFile}`);
                    resolve();
                });
        });
    }

    async function createAllSentenceImages(content) {
        for (let index in content.sentences) {
            await createSentenceImage(index, content.sentences[index].text);
        }
    }

    async function createSentenceImage(index, sentenceText) {
        return new Promise((resolve, reject) => {
            const outputFile = `./content/${index}-sentence.png`;

            const templateSettings = {
                0: {
                    size: '1920x400',
                    gravity: 'center'
                },
                1: {
                    size: '1920x1080',
                    gravity: 'center'
                },
                2: {
                    size: '800x1080',
                    gravity: 'west'
                },
                3: {
                    size: '1920x400',
                    gravity: 'center'
                },
                4: {
                    size: '1920x1080',
                    gravity: 'center'
                },
                5: {
                    size: '800x1080',
                    gravity: 'west'
                },
                6: {
                    size: '1920x400',
                    gravity: 'center'
                },
                7: {
                    size: '1920x400',
                    gravity: 'center'
                },
                8: {
                    size: '1920x400',
                    gravity: 'west'
                },
                9: {
                    size: '1920x400',
                    gravity: 'center'
                }
            };

            gm()
                .out('-size', templateSettings[index].size)
                .out('-gravity', templateSettings[index].gravity)
                .out('-background', 'transparent')
                .out('-fill', 'white')
                .out('-kerning', '-1')
                .out(`caption:${sentenceText}`)
                .write(outputFile, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    console.log(`> [video-robot] Sentence created: ${outputFile}`);
                    resolve();
                });
        });
    }

    async function createYoutubeThumbnail() {
        return new Promise((resolve, reject) => {
            gm()
                .in('./content/0-converted.png')
                .write('./content/youtube-thumbnail.jpg', (error) => {
                    if (error) {
                        return reject(error);
                    }
                    console.log('> Creating YouTube thumbnail');
                    resolve();
                });
        });
    }

    async function createAfterEffectsScript(content) {
        await state.saveScript(content);
    }

    async function renderVideoWithAfterEffects() {
        return new Promise((resolve, reject) => {
            const aerenderFilePath = '/Applications/Adobe After Effects CC 2019/aerender';
            const templateFilePath = `${rootPath}/templates/1/template.aep`;
            const destinationFilePath = `${rootPath}/content/output.mov`;

            console.log('> [video-robot] Starting After Effects');

            const aerender = spawn(aerenderFilePath, [
                '-comp', 'main',
                '-project', templateFilePath,
                '-output', destinationFilePath
            ]);

            aerender.stdout.on('data', (data) => {
                process.stdout.write(data);
            })

            aerender.on('close', () => {
                console.log('> [video-robot] After Effects closed');
                resolve();
            })
        });
    }

}

module.exports = robot