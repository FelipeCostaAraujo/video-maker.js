'use strict'
const google = require('googleapis').google;
const customSearch = google.customsearch('v1');
const googleSearchCredentials = require('./credentials/google-search.json');
const imageDownloader = require('image-downloader');
const state = require('./state.js');

async function robot() {
    const content = state.load();
    await fetchImagesOfAllSentences(content);

    await downloadAllImages(content);

    //state.save(content);

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
}

module.exports = robot;