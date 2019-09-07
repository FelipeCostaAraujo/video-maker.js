'use strict'
const google = require('googleapis').google;
const gm = require('gm').subClass({ imageMagick: true });
const customSearch = google.customsearch('v1');
const googleSearchCredentials = require('./credentials/google-search.json');
const imageDownloader = require('image-downloader');
const state = require('./state.js');

async function robot() {
    const content = state.load();
    await fetchImagesOfAllSentences(content);
    await downloadAllImages(content);
    await convertAllImages(content);
    await createAllSentenceImages(content);
    await createYoutubeThumbnail();
    state.save(content);

    async function fetchImagesOfAllSentences(content) {
        for (const sentence of content.sentences) {
            const query = `${content.searchTerm} ${sentence.keywords[0]}`;
            sentence.images = await fetchGoogleAndReturnImagesLinks(query);
            sentence.googleSearchQuery = query;
        }
    }

    async function fetchGoogleAndReturnImagesLinks(query) {
        const response = await customSearch.cse.list({
            auth: googleSearchCredentials.apiKey,
            cx: googleSearchCredentials.searchEngineId,
            q: query,
            searchType: 'image',
            num: 2,
            //imgSize: 'huge'
        });

        const imagesUrl = response.data.items.map((item) => {
            return item.link;
        });

        return imagesUrl;
    }

    async function downloadAllImages(content) {
        content.downloadedImages = [];

        for (let index in content.sentences) {
            const images = content.sentences[index].images;
            for (let ImageIndex in images) {
                const imageUrl = images[ImageIndex];
                try {
                    if (content.downloadedImages.includes(imageUrl)) {
                        throw new Error("Imagem ja foi baixada");
                    }
                    await downloadAndSaveImage(imageUrl, `${index}-original.png`);
                    content.downloadedImages.push(imageUrl);
                    console.log(`>${index} ${ImageIndex} Baixou imagem : ${imageUrl}`);
                    break;
                } catch (error) {
                    console.log(`>${index} ${ImageIndex} Erro na imagem : ${imageUrl} `);
                }
            }
        }
    }
    async function downloadAndSaveImage(url, fileName) {
        return imageDownloader.image({
            url: url,
            dest: `./content/${fileName}`
        });
    }

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
}

module.exports = robot;