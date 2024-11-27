// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const styledImport = `import styled from "styled-components";`;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "styled-component-helper" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('styled-component-helper', async () => {
		// The code you place here will be executed every time your command is executed
		const editor = vscode.window.activeTextEditor;
		const selection = editor?.selection;

		if (editor && selection && (editor.document.languageId === 'typescriptreact' || editor.document.languageId === 'javascriptreact')) {
			const documentText = editor.document.getText();
			const lastLine = editor.document.lineCount;

			const cursorPosition = selection.start;
			const wordRange = editor.document.getWordRangeAtPosition(cursorPosition);
			const selectedText = editor.document.getText(wordRange);

			let defaultName = `Styled${selectedText}`;

			const inputOptions: vscode.InputBoxOptions = {
				title: `Name for Styled Component`,
				value: `${defaultName}`,
				validateInput: (value: string): vscode.InputBoxValidationMessage | undefined => {
					return validateVariableName(value);
				},
				ignoreFocusOut: true,
			};

			const userPreferredName = await vscode.window.showInputBox(
				inputOptions,
			);

			if (!userPreferredName) {
				return;
			}

			editor.edit(editBuilder => {
				const styledComponent = prepareStyledComponent(userPreferredName, selectedText);
				editBuilder.insert(new vscode.Position(lastLine, 0), '\n' + styledComponent + '\n');

				if (wordRange) {
					editBuilder.replace(wordRange, userPreferredName);
				}

				if (!documentText.includes(styledImport)) {
					editBuilder.insert(new vscode.Position(0, 0), styledImport + '\n');
				}
			});

			vscode.window.showInformationMessage(`Your Styled Component ${userPreferredName} is ready.`);
		}
		else {
			vscode.window.showErrorMessage("The Styled Component Helper extension is only for React files.");
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }

const prepareStyledComponent = (styledTextVariableName: string, selectedTag: string) => {
	return `const ${styledTextVariableName} = styled(${selectedTag})\`
    // TODO: add styling 
\`;`;
};

const validateVariableName = (name: string) => {
	if (name.substring(0, 1) !== name.substring(0, 1).toLocaleUpperCase()) {
		return {
			message: "Name Should be in Pascal Case.",
			severity: 3
		};
	}
};
