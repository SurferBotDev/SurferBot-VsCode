// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as request from 'request';

let runningScriptId: number | null = null;



function executeScript(script: string) {
    // Send POST request to execute script
    request.post({
        url: 'http://127.0.0.1:8081/script/execute',
        body: { script: script },
        json: true
    }, (error: any, response: { statusCode: number; }, body: { scriptId: number | null; }) => {
        if (!error && response.statusCode === 200) {
            runningScriptId = body.scriptId;
            checkScriptStatus();
        } else {
            vscode.window.showErrorMessage('Failed to execute script');
        }
    });
}

function checkScriptStatus() {
    setInterval(() => {
        if (runningScriptId !== null) {
            request.get(`http://127.0.0.1:8081/script/${runningScriptId}`, (error: any, response: { statusCode: number; }, body: string) => {
                if (!error && response.statusCode === 200) {
                    const status = JSON.parse(body);
                    if (!status.running) {
                        vscode.window.showInformationMessage('Script execution completed');
                        runningScriptId = null;
                    }
                }
            });
        }
    }, 1000); // Check status every second
}

function stopScript() {
    if (runningScriptId !== null) {
        request.post(`http://127.0.0.1:8081/script/stop/${runningScriptId}`, (error: any, response: { statusCode: number; }, body: any) => {
            if (!error && response.statusCode === 200) {
                vscode.window.showInformationMessage('Script execution stopped');
                runningScriptId = null;
            }
        });
    }
}

export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "surferbot-lua" is now active!');

	let disposable = vscode.commands.registerCommand('extension.executeLuaScript', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const script = editor.document.getText();
            executeScript(script);
        } else {
            vscode.window.showErrorMessage('No active editor');
        }
    });

    // Register command to stop script
    let stopDisposable = vscode.commands.registerCommand('extension.stopLuaScript', () => {
        stopScript();
    });

    context.subscriptions.push(disposable, stopDisposable);


}

// This method is called when your extension is deactivated
export function deactivate() {}
