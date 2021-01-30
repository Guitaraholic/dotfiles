"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const splunkParser_1 = require("./splunkParser");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Define document selector
    let splunkSelector = {
        scheme: 'file',
        language: 'splunk_search'
    };
    let mainFunctions = splunkParser_1.returnCompletionItemfromJSON(context, 'Command_description_Related_table3');
    const mainHovers = mainFunctions['hover'];
    const mainCompletions = mainFunctions['completion'];
    let evalFunctions = splunkParser_1.returnCompletionItemfromJSON(context, 'eval_functions-syntax_description_type');
    const evalHovers = evalFunctions['hover'];
    const evalCompletions = evalFunctions['completion'];
    let statsFunctions = splunkParser_1.returnCompletionItemfromJSON(context, 'stats_functions-syntax_description_type');
    const statsHovers = statsFunctions['hover'];
    const statsCompletions = statsFunctions['completion'];
    let operators = splunkParser_1.returnCompletionItemfromJSON(context, 'operators-syntax_description_type');
    const operatorsHovers = operators['hover'];
    const operatorsCompletions = operators['completion'];
    const allHovers = Object.assign(Object.assign(Object.assign(Object.assign({}, mainHovers), evalHovers), statsHovers), operatorsHovers);
    // ====================== COMPLETION ITEMS ====================== //
    console.log("Start providing completion items");
    // Here we will start our Completion provider
    console.log("Providing base completion items");
    let splunkProvider = vscode.languages.registerCompletionItemProvider(splunkSelector, {
        provideCompletionItems(document, position, token, context) {
            return mainCompletions.concat(evalCompletions, statsCompletions, operatorsCompletions);
        }
    });
    console.log("Providing eval completion items");
    // Here we suggest new commands after eval functions
    let evalSplunkProvider = vscode.languages.registerCompletionItemProvider(splunkSelector, {
        provideCompletionItems(document, position) {
            // matches: pipe followed by 0 or more space followed by "eval" 0 or more space
            // followed by 1 or more word-types followed by 0 or more space followed by "="
            // followed by 0 or more space
            let regexp = new RegExp('eval[\\s]+[\\w\\-\\_]+[\\s]*=[\\s]*');
            let linePrefix = document.lineAt(position).text.substr(0, position.character);
            console.log(linePrefix.match(regexp));
            if (!(linePrefix.match(regexp))) {
                return undefined;
            }
            return evalCompletions;
        }
    }, ' ', '=');
    console.log("Providing stats completion items");
    // Here we try and suggest new commands after stats functions
    let statsSplunkProvider = vscode.languages.registerCompletionItemProvider(splunkSelector, {
        provideCompletionItems(document, position) {
            let regexp = new RegExp('[a-z]*stats[\\s]+');
            let linePrefix = document.lineAt(position).text.substr(0, position.character);
            if (!linePrefix.match(regexp)) {
                return undefined;
            }
            return statsCompletions;
        }
    }, ' ');
    console.log("Providing main completion items");
    // Here we try and suggest new commands after pipe
    let pipeSplunkProvider = vscode.languages.registerCompletionItemProvider(splunkSelector, {
        provideCompletionItems(document, position) {
            let regexp = new RegExp('\\\\|[\\s]*');
            let linePrefix = document.lineAt(position).text.substr(0, position.character);
            if (!(linePrefix.endsWith('| ') || linePrefix.endsWith('|'))) {
                return undefined;
            }
            return mainCompletions;
        }
    }, ' ', '|');
    console.log("Providing operator completion items");
    // Here we try and suggest operators after stats functions
    let operatorSplunkProvider = vscode.languages.registerCompletionItemProvider(splunkSelector, {
        provideCompletionItems(document, position) {
            let regexp = new RegExp('(avg\\s|count\\s|distinct_count\\s|estdc\\s|estdc_error\\s|max\\s|mean\\s|median\\s|min\\s|mode\\s|percentile\\s|range\\s|stdev\\s|stdevp\\s|sum\\s|sumsq\\s|var\\s|varp\\s|first\\s|last\\s|list\\s|values\\s|earliest\\s|earliest_time\\s|latest\\s|latest_time\\s|per_day\\s|per_hour\\s|per_minute\\s|per_second\\s|rate\\s)');
            let linePrefix = document.lineAt(position).text.substr(0, position.character);
            if (!(linePrefix.match(regexp))) {
                return undefined;
            }
            return operatorsCompletions;
        }
    }, ' ');
    // ====================== /COMPLETION ITEMS ====================== //
    console.log("Providing hover items");
    // ========================= HOVER ITEMS ========================= //
    let splunkHoverProvider = vscode.languages.registerHoverProvider(splunkSelector, {
        provideHover(document, position, token) {
            const splunkRange = document.getWordRangeAtPosition(position);
            const hoverWord = document.getText(splunkRange);
            if (!(hoverWord in allHovers)) {
                return undefined;
            }
            return allHovers[hoverWord];
        }
    });
    // ======================== /HOVER ITEMS ======================== //
    console.log("Providing commands");
    // ======================= COMMAND ITEMS ======================== //
    let splunkCommandProvider = splunkParser_1.returnCommandRegister(context);
    context.subscriptions.push(splunkProvider, evalSplunkProvider, statsSplunkProvider, pipeSplunkProvider, operatorSplunkProvider, splunkHoverProvider, splunkCommandProvider);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map