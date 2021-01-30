"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const splunkParser_1 = require("./splunkParser");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    console.log('Congratulations, your extension "vscode-splunk-search-linter" is now active!');
    // Define document selector
    let splunkSelector = {
        scheme: 'file',
        language: 'splunk'
    };
    const mainFunctions = splunkParser_1.returnCompletionItemfromJSON(context, 'Command_description_Related_table');
    const evalFunctions = splunkParser_1.returnCompletionItemfromJSON(context, 'eval_functions-syntax_description_type');
    const statsFunctions = splunkParser_1.returnCompletionItemfromJSON(context, 'stats_functions-syntax_description_type');
    console.log("Start providing completion items");
    // Here we will start our Completion provider
    let splunkProvider = vscode.languages.registerCompletionItemProvider(splunkSelector, {
        provideCompletionItems(document, position, token, context) {
            console.log("Providing base completion items");
            return mainFunctions.concat(evalFunctions, statsFunctions);
        }
    });
    // Here we suggest new commands after eval functions
    let evalSplunkProvider = vscode.languages.registerCompletionItemProvider(splunkSelector, {
        provideCompletionItems(document, position) {
            console.log("Providing eval completion items");
            // matches: pipe followed by 0 or more space followed by "eval" 0 or more space
            // followed by 1 or more word-types followed by 0 or more space followed by "="
            // followed by 0 or more space
            let regexp = new RegExp('eval[\\s]+[\\w\\-\\_]+[\\s]*=[\\s]*');
            let linePrefix = document.lineAt(position).text.substr(0, position.character);
            console.log(linePrefix.match(regexp));
            if (!(linePrefix.match(regexp))) {
                return undefined;
            }
            return evalFunctions;
        }
    }, ' ', '=');
    // Here we try and suggest new commands after stats functions
    let statsSplunkProvider = vscode.languages.registerCompletionItemProvider(splunkSelector, {
        provideCompletionItems(document, position) {
            console.log("Providing stats completion items");
            let regexp = new RegExp('[a-z]*stats[\\s]+');
            let linePrefix = document.lineAt(position).text.substr(0, position.character);
            if (!linePrefix.match(regexp)) {
                return undefined;
            }
            return statsFunctions;
        }
    }, ' ');
    // Here we try and suggest new commands after pipe
    let pipeSplunkProvider = vscode.languages.registerCompletionItemProvider(splunkSelector, {
        provideCompletionItems(document, position) {
            console.log("Providing stats completion items");
            let regexp = new RegExp('\\\\|[\\s]*');
            let linePrefix = document.lineAt(position).text.substr(0, position.character);
            if (!linePrefix.match(regexp)) {
                return undefined;
            }
            return mainFunctions;
        }
    }, ' ', '|');
    context.subscriptions.push(splunkProvider, evalSplunkProvider, statsSplunkProvider, pipeSplunkProvider);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map