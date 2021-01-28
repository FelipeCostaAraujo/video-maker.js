'use strict'
const readline = require('readline-sync');
const state = require('./state.js');

function robot(){
    const content = {
        maximumSentences: 10
    };
    
    content.searchTerm = askAndReturnSearchTerm();
    content.prefix = askAndReturnPrefix();
    state.save(content);
    
    function askAndReturnSearchTerm() {
        return readline.question('Termo de busca para o Wikipedia: ');
    }
    
    function askAndReturnPrefix() {
        const prefixes = ['Quem e', 'O que e', 'A historia de'];
        const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Escolha uma opcao: ');
        const selectedPrefixText = prefixes[selectedPrefixIndex];
        return selectedPrefixText;
    }
}

module.exports = robot