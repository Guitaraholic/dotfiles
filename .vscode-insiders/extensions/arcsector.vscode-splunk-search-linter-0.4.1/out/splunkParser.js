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
    const completionArray = [];
    for (const entry of fileJson) {
        const splunkCompletionItem = new vscode.CompletionItem(entry[name]);
        splunkCompletionItem.kind = vscode.CompletionItemKind.Class;
        splunkCompletionItem.commitCharacters = ['\t'];
        let hasSyntax = false;
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
        let detail = "";
        let documentation = entry[description];
        if (hasRelated) {
            documentation = new vscode.MarkdownString(documentation + "\n##### Related Commands:\n" + entry[related]);
        }
        if (hasType) {
            detail = detail + '(' + entry[functionType] + ') ';
        }
        if (hasSyntax) {
            detail = detail + entry[syntax];
            splunkCompletionItem.kind = vscode.CompletionItemKind.Method;
        }
        else {
            detail = entry[name];
        }
        //console.log(detail);
        //console.log(documentation);
        splunkCompletionItem.detail = detail;
        splunkCompletionItem.documentation = documentation;
        completionArray.push(splunkCompletionItem);
    }
    return completionArray;
}
exports.returnCompletionItemfromJSON = returnCompletionItemfromJSON;
//# sourceMappingURL=splunkParser.js.map