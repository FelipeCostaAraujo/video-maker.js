const readline = require('readline-sync');
const robots = {text: require('./robots/text.js')};

async function start() {
    const content = {};

    content.searchTerm = askAndReturnSearchTerm();
    content.prefix = askAndReturnPrefix();
    await robots.text(content);

    function askAndReturnSearchTerm() {
        return readline.question('Termo de busca para o Wikipedia: ');
    }

    function askAndReturnPrefix(){
        const prefixes = ['Quem e','O que e','A historia de'];
        const selectedPrefixIndex = readline.keyInSelect(prefixes,'Choose one option: ');
        const selectedPrefixText = prefixes[selectedPrefixIndex];
        return selectedPrefixText;
    }

    console.log(content);
}
start();