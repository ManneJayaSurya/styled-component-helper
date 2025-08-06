import * as vscode from "vscode";

const styledImport = `import styled from "styled-components";`;

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "styled-component-helper" is now active!');
	context.subscriptions.push(disposable);
}

const disposable = vscode.commands.registerCommand("styled-component-helper", async () => {
	const editor = vscode.window.activeTextEditor;
	const selection = editor?.selection;

	if (editor && selection) {
		const documentText = editor.document.getText();
		const lastLine = editor.document.lineCount;
		const cursorPosition = selection.start;
		const wordRange = editor.document.getWordRangeAtPosition(cursorPosition);
		const selectedText = editor.document.getText(wordRange);
		const charBeforeSelectedText = wordRange
			? editor?.document.getText(new vscode.Range(wordRange.start.translate(0, -1), wordRange.start))
			: undefined;

		if (charBeforeSelectedText !== "<") {
			vscode.window.showErrorMessage("Please select a valid HTML tag.");
			return;
		}

		const isHtmlElement = selectedText.slice(0, 1).toLocaleUpperCase() !== selectedText.slice(0, 1);
		let defaultName = `Styled${isHtmlElement ? `${selectedText.substring(0, 1).toLocaleUpperCase()}${selectedText.slice(1)}` : `${selectedText.substring(0, 1).toLocaleUpperCase()}${selectedText.slice(1)}`}`;

		let userPreferredName = defaultName;
		if (wordRange) {
			editor.selections = [new vscode.Selection(wordRange.start, wordRange.end)];
			const inputOptions: vscode.InputBoxOptions = {
				prompt: `Name for Styled Component`,
				value: `${defaultName}`,
				valueSelection: [0, defaultName.length],
				validateInput: (value: string): vscode.InputBoxValidationMessage | undefined => {
					return validateVariableName(value);
				},
				ignoreFocusOut: false,
			};
			const input = await vscode.window.showInputBox(inputOptions);
			if (input) {
				userPreferredName = input;
			} else {
				return;
			}
		} else {
			const inputOptions: vscode.InputBoxOptions = {
				prompt: `Name for Styled Component`,
				value: `${defaultName}`,
				validateInput: (value: string): vscode.InputBoxValidationMessage | undefined => {
					return validateVariableName(value);
				},
				ignoreFocusOut: false,
			};
			const input = await vscode.window.showInputBox(inputOptions);
			if (input) {
				userPreferredName = input;
			} else {
				return;
			}
		}

		if (!userPreferredName) {
			return;
		}

		editor.edit((editBuilder) => {
			const styledComponent = isHtmlElement
				? prepareStyledComponentForElement(userPreferredName, selectedText)
				: prepareStyledComponentForFun(userPreferredName, selectedText);
			editBuilder.insert(new vscode.Position(lastLine, 0), "\n" + styledComponent + "\n");

			if (wordRange) {
				// Replace opening tag
				editBuilder.replace(wordRange, userPreferredName);

				// Find and replace only the corresponding closing tag (no nesting)
				const openTagPos = wordRange.end;
				const docText = editor.document.getText();
				const afterOpenTagOffset = editor.document.offsetAt(openTagPos);
				const closingTagPattern = new RegExp(`</${selectedText}([\s>])`, 'g');
				closingTagPattern.lastIndex = afterOpenTagOffset;
				const match = closingTagPattern.exec(docText);
				if (match) {
					const matchStart = match.index + 2; // skip '</'
					const matchEnd = matchStart + selectedText.length;
					const startPos = editor.document.positionAt(matchStart);
					const endPos = editor.document.positionAt(matchEnd);
					editBuilder.replace(new vscode.Range(startPos, endPos), userPreferredName);
				}
			}

			if (!documentText.includes(styledImport)) {
				editBuilder.insert(new vscode.Position(0, 0), styledImport + "\n");
			}
		});

		vscode.window.showInformationMessage(`Your Styled Component ${userPreferredName} is ready.`);
	}
});

const prepareStyledComponentForFun = (styledTextVariableName: string, selectedTag: string) => {
	return `const ${styledTextVariableName} = styled(${selectedTag})\`
    // TODO: add styling 
\`;`;
};

const prepareStyledComponentForElement = (styledTextVariableName: string, htmlElement: string) => {
	return `const ${styledTextVariableName} = styled.${htmlElement}\`
	// TODO: add styling
\`;`;
};

const validateVariableName = (name: string) => {
	if (name.substring(0, 1) !== name.substring(0, 1).toLocaleUpperCase()) {
		return {
			message: "Name Should be in Pascal Case.",
			severity: 3,
		};
	}
};

