"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const commandInfoPath = "command_info";
function returnCompletionItemfromJSON(context, fileName) {
    let completeFilePath = path.join(context.extensionPath, commandInfoPath, `${fileName}.json`);
    console.log(`file path: "${completeFilePath}"`);
    let file;
    file = fs.readFileSync(completeFilePath, 'utf-8');
    try {
        file = fs.readFileSync(completeFilePath, 'utf-8');
    }
    catch (e) {
        console.log("Error: ", e.stack);
    }
    const fileJson = JSON.parse(file);
    // iterate through json entry and output completion items
    const name = "Command_Name";
    const description = "Description";
    const syntax = "Supported functions and syntax";
    const related = "Related commands";
    const functionType = "Type of function";
    const params = "Parameters";
    const re = /\s/g;
    const completionArray = [];
    //const hoverArray = [];
    const hoverDict = {};
    for (const entry of fileJson) {
        const splunkCompletionItem = new vscode.CompletionItem(entry[name]);
        splunkCompletionItem.kind = vscode.CompletionItemKind.Keyword;
        splunkCompletionItem.commitCharacters = ['\t'];
        let hasSyntax = false;
        let hasParams = false;
        let hasType = false;
        let hasRelated = false;
        if (functionType in entry) {
            hasType = true;
        }
        if (syntax in entry) {
            hasSyntax = true;
        }
        if (related in entry) {
            hasRelated = true;
        }
        if (params in entry) {
            hasParams = true;
        }
        let detail = "";
        let documentation = entry[description];
        let docString = "";
        if (hasParams) {
            splunkCompletionItem.kind = vscode.CompletionItemKind.Class;
            const requiredParams = entry['Parameters']['Required'];
            const optionalParams = entry['Parameters']['Optional'];
            if (requiredParams) {
                docString = docString + "\n#### Required Arguments:";
                // Loop through params and create docstring
                for (const i in requiredParams) {
                    docString = docString + "\n_@param_ `" + i + "` -- " + requiredParams[i] + "\n";
                }
            }
            if (optionalParams) {
                docString = docString + "\n#### Optional Arguments: \n";
                // Loop through params and create docstring
                for (const i in optionalParams) {
                    docString = docString + "\n_@param_ `" + i + "` -- " + optionalParams[i] + "\n";
                }
            }
        }
        let hoverDocs;
        if (hasRelated) {
            documentation = new vscode.MarkdownString(documentation + docString + "\n##### Related Commands:\n" + entry[related]);
            hoverDocs = documentation + docString + "\n##### Related Commands:\n" + entry[related];
        }
        if (hasType) {
            detail = detail + '(' + entry[functionType].toLowerCase().replace(re, "_") + ') ';
            splunkCompletionItem.kind = vscode.CompletionItemKind.Method;
        }
        if (hasSyntax) {
            detail = detail + entry[syntax];
        }
        else {
            detail = entry[name];
        }
        if (entry[functionType] === "Keyword") {
            splunkCompletionItem.kind = vscode.CompletionItemKind.Keyword;
        }
        //console.log(detail);
        //console.log(documentation);
        splunkCompletionItem.detail = detail;
        splunkCompletionItem.documentation = documentation;
        let splunkHoverItem = new vscode.Hover(entry[name]);
        splunkHoverItem.contents = [new vscode.MarkdownString(detail), documentation];
        completionArray.push(splunkCompletionItem);
        //hoverArray.push(splunkHoverItem);
        hoverDict[entry[name]] = splunkHoverItem;
    }
    return {
        "completion": completionArray,
        "hover": hoverDict
    };
}
exports.returnCompletionItemfromJSON = returnCompletionItemfromJSON;
function testNewline(docText, position) {
    for (position; position > 0; position--) {
        if (docText[position] === " " || docText[position] === "\t" || docText[position] === "[") {
            continue;
        }
        else if (docText[position] === "\n" || docText[position] === "\r") {
            return true;
        }
        else {
            return false;
        }
    }
}
function getMainCommand(docText, position) {
    //assuming we trigger this on every pipe or open bracket, we can assume
    // the next word is a command
    let word = '';
    for (position; position > 0; position++) {
        if ((docText[position] === " " || docText[position] === "\t" || docText[position] === "[" || docText[position] === "|") && word === "") {
            continue;
        }
        else if (docText[position]) {
        }
    }
}
function returnCommandRegister(context) {
    const splunkCommandHandler = vscode.commands.registerCommand('splunk_search.Prettify', function () {
        let editor = vscode.window.activeTextEditor;
        if (editor) {
            console.log("editor is active");
            let document = editor.document;
            //docText is actual string we're going to return, docTextCopy is 
            // a copy to iterate through that doesn't change
            let docText = document.getText();
            let docTextCopy = docText;
            // define new vars:
            // keep track of position in docText
            let i = 0;
            // keep track of whether or not we're going to skip a pipe
            let inBaseBracket = false;
            // keep track of wheter or not we're in a quote
            let inQuote = false;
            // keep track of what level we're at in brackets
            let bracketLevel = 0;
            // keep track of what global splunk command we're in 
            for (const character of docTextCopy) {
                if (i === 0) {
                    i++;
                    continue;
                }
                if (inBaseBracket) {
                    if (character === '|') {
                        inBaseBracket = false;
                        i++;
                        continue;
                    }
                    else if (character === ' ') {
                        i++;
                        continue;
                    }
                    else {
                        inBaseBracket = false;
                        i++;
                        continue;
                    }
                }
                else if (character === "\"") {
                    // if quote is escaped, it doesn't matter
                    if (docText[i - 1] === "\\") {
                        i++;
                        continue;
                    }
                    if (inQuote) {
                        inQuote = false;
                        i++;
                        continue;
                    }
                    else {
                        inQuote = true;
                        i++;
                        continue;
                    }
                }
                else if (character === "[") {
                    console.log("open bracket found");
                    if (docText[i - 1] === "\\" || inQuote) {
                        console.log("we're either escaping or in a quote");
                        i++;
                        continue;
                    }
                    if (testNewline(docText, i - 1)) {
                        console.log("found newline with function");
                        i++;
                        continue;
                    }
                    let lengthToIncrease = 2;
                    let insertString = '\n';
                    // insert string increases indent per bracketLevel
                    bracketLevel++;
                    for (var x = 0; x < bracketLevel; x++) {
                        insertString = insertString + '  ';
                        lengthToIncrease += 2;
                    }
                    docText = docText.slice(0, i) + insertString + docText.slice(i);
                    inBaseBracket = true;
                    i += lengthToIncrease;
                }
                else if (character === "]") {
                    console.log("close bracket found");
                    if (docText[i - 1] === "\\" || inQuote) {
                        console.log("we're either escaping or in a quote");
                        i++;
                        continue;
                    }
                    let lengthToIncrease = 1;
                    let insertString = '';
                    // make sure bracketLevel is decreased before adding in \t
                    bracketLevel--;
                    for (var x = 0; x < bracketLevel; x++) {
                        insertString = insertString + '  ';
                        lengthToIncrease += 2;
                    }
                    docText = docText.slice(0, i + 1) + insertString + docText.slice(i + 1);
                    i += lengthToIncrease;
                }
                else if (character === '|') {
                    console.log("Pipe found");
                    if (docText[i - 1] === "\\" || inQuote) {
                        console.log("we're either escaping or in a quote");
                        i++;
                        continue;
                    }
                    if (testNewline(docText, i - 1)) {
                        console.log("found newline with function");
                        i++;
                        continue;
                    }
                    /* if (docText[i] === "\n" || docText[i - 1] === "\n" || docText[i - 2] === "\n") {
                        i++;
                        console.log("found newline; leaving it alone");
                        continue;
                    } */
                    let lengthToIncrease = 2;
                    let insertString = '\n';
                    // insert string increases indent per bracketLevel
                    for (var x = 0; x < bracketLevel; x++) {
                        insertString = insertString + '  ';
                        lengthToIncrease += 2;
                    }
                    docText = docText.slice(0, i) + insertString + docText.slice(i);
                    i += lengthToIncrease;
                }
                else {
                    i++;
                }
            }
            editor.edit(editBuilder => {
                let numLines = document.lineCount;
                console.log(numLines);
                let range = new vscode.Range(0, 0, numLines, document.lineAt(numLines - 1).text.length);
                editBuilder.replace(range, docText);
                console.log("replaced");
            });
        }
    });
    return splunkCommandHandler;
}
exports.returnCommandRegister = returnCommandRegister;
//# sourceMappingURL=splunkParser.js.map