"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageServerInstaller = void 0;
const vscode = require("vscode");
const del = require("del");
const fs = require("fs");
const semver = require("semver");
const utils_1 = require("./utils");
const js_releases_1 = require("@hashicorp/js-releases");
class LanguageServerInstaller {
    install(directory) {
        return __awaiter(this, void 0, void 0, function* () {
            const { version: extensionVersion } = require('../package.json');
            const lsVersionCmd = `${directory}/terraform-ls --version`;
            const userAgent = `Terraform-VSCode/${extensionVersion} VSCode/${vscode.version}`;
            let isInstalled = true;
            try {
                var { stdout, stderr } = yield utils_1.exec(lsVersionCmd);
                var installedVersion = stdout || stderr;
            }
            catch (err) {
                // TODO: verify error was in fact binary not found
                isInstalled = false;
            }
            const currentRelease = yield js_releases_1.getRelease("terraform-ls", "latest", userAgent);
            if (isInstalled) {
                if (semver.gt(currentRelease.version, installedVersion, { includePrerelease: true })) {
                    const selected = yield vscode.window.showInformationMessage(`A new language server release is available: ${currentRelease.version}. Install now?`, 'Install', 'Cancel');
                    if (selected === 'Cancel') {
                        return;
                    }
                }
                else {
                    return;
                }
            }
            try {
                yield this.installPkg(currentRelease, directory, userAgent);
            }
            catch (err) {
                vscode.window.showErrorMessage('Unable to install terraform-ls');
                console.error(err);
                throw err;
            }
            // Do not wait on the showInformationMessage
            vscode.window.showInformationMessage(`Installed terraform-ls ${currentRelease.version}.`, "View Changelog")
                .then(selected => {
                if (selected === "View Changelog") {
                    return vscode.env.openExternal(vscode.Uri.parse(`https://github.com/hashicorp/terraform-ls/releases/tag/v${currentRelease.version}`));
                }
            });
        });
    }
    installPkg(release, installDir, userAgent) {
        return __awaiter(this, void 0, void 0, function* () {
            const destination = `${installDir}/terraform-ls_v${release.version}.zip`;
            fs.mkdirSync(installDir, { recursive: true }); // create install directory if missing
            let os = goOs();
            let arch = goArch();
            const build = release.getBuild(os, arch);
            if (!build) {
                throw new Error(`Install error: no matching terraform-ls binary for ${os}/${arch}`);
            }
            try {
                this.removeOldBinary(installDir, os);
            }
            catch (_a) {
                // ignore missing binary (new install)
            }
            return vscode.window.withProgress({
                cancellable: true,
                location: vscode.ProgressLocation.Notification,
                title: "Installing terraform-ls"
            }, (progress) => __awaiter(this, void 0, void 0, function* () {
                progress.report({ increment: 30 });
                yield release.download(build.url, destination, userAgent);
                progress.report({ increment: 30 });
                yield release.verify(destination, build.filename);
                progress.report({ increment: 30 });
                return release.unpack(installDir, destination);
            }));
        });
    }
    removeOldBinary(directory, goOs) {
        if (goOs === "windows") {
            fs.unlinkSync(`${directory}/terraform-ls.exe`);
        }
        else {
            fs.unlinkSync(`${directory}/terraform-ls`);
        }
    }
    cleanupZips(directory) {
        return __awaiter(this, void 0, void 0, function* () {
            return del(`${directory}/terraform-ls*.zip`, { force: true });
        });
    }
}
exports.LanguageServerInstaller = LanguageServerInstaller;
function goOs() {
    let platform = process.platform.toString();
    if (platform === 'win32') {
        return 'windows';
    }
    if (platform === 'sunos') {
        return 'solaris';
    }
    return platform;
}
function goArch() {
    let arch = process.arch;
    if (arch === 'ia32') {
        return '386';
    }
    if (arch === 'x64') {
        return 'amd64';
    }
    if (arch === 'arm64' && process.platform.toString() === 'darwin') {
        // On Apple Silicon, install the amd64 version and rely on Rosetta2
        // until a native build is available.
        return 'amd64';
    }
    return arch;
}
//# sourceMappingURL=languageServerInstaller.js.map