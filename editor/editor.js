export const KEYWORDS = ["False", "None", "True", "and", "as", "assert", "break", "class", "continue", "def", "del", "elif", "else", "except", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "nonlocal", "not", "or", "pass", "raise", "return", "try", "while", "with", "yield"];
export const OPERATORS = ["+", "-", "*", "/", "%", "**", "//", "=", "+=", "-=", "*=", "/=", "%=", "//=", "**=", "&=", "|=", "^=", ">>=", "<<=", "==", "!=", ">", "<", ">=", "<=", "&", "|", "^", "~", "<<", ">>"];

export class Editor {
    constructor(element) {
        this.element = element;
        this.codeElement = element.querySelector("pynaut-code");
        this.internalInput = element.querySelector("textarea[pynaut-data]");

        this._selectionStart = 0;

        this.attachEvents();
    }

    get code() {
        return this.internalInput.value;
    }

    set code(value) {
        this.internalInput.value = value;

        this.render();
    }

    insertCode(value) {
        var selectionStart = this.internalInput.selectionStart;

        this.code = (
            this.code.substring(0, this.internalInput.selectionStart) +
            value +
            this.code.substring(this.internalInput.selectionEnd)
        );

        this.internalInput.selectionStart = selectionStart + value.length;
        this.internalInput.selectionEnd = selectionStart + value.length;

        this.render();
    }

    getLineIndex() {
        return this.code.substring(0, this.internalInput.selectionStart).split("\n").length - 1;
    }

    getColumnIndex() {
        var lines = this.code.substring(0, this.internalInput.selectionStart).split("\n");

        return lines[lines.length - 1].length;
    }

    getSelectedLineCount() {
        return this.code.substring(0, this.internalInput.selectionEnd).split("\n").length - this.getLineIndex();
    }

    getLine(lineIndex = this.getLineIndex()) {
        return this.code.split("\n")[lineIndex];
    }

    setLine(text, lineIndex = this.getLineIndex()) {
        var lines = this.code.split("\n");

        console.log(lines);
        lines[lineIndex] = text;
        console.log(lines, lines.join("\n"));

        this.code = lines.join("\n");
    }

    attachEvents() {
        var thisScope = this;

        this.internalInput.addEventListener("keydown", function(event) {
            switch (event.key) {
                case "Tab":
                    event.preventDefault();

                    var lineIndex = thisScope.getLineIndex();
                    var lineCount = thisScope.getSelectedLineCount();

                    thisScope.internalInput.selectionStart -= thisScope.getColumnIndex();

                    var selectionStart = thisScope.internalInput.selectionStart;

                    if (event.shiftKey) {
                        for (var i = lineIndex; i < lineIndex + lineCount; i++) {
                            var selectionEnd = thisScope.internalInput.selectionEnd;
                            var dedentSpaceCount = thisScope.getLine(i).match(/^\s{0,4}/)[0].length;

                            thisScope.setLine(thisScope.getLine(i).substring(dedentSpaceCount), i);
                            thisScope.render();

                            thisScope.internalInput.selectionEnd = selectionEnd - dedentSpaceCount;
                        }

                        thisScope.internalInput.selectionStart = selectionStart;

                        break;
                    }

                    if (thisScope.getLine().substring(0, thisScope.getColumnIndex()).trim() != "") {
                        thisScope.insertCode("    ");

                        break;
                    }

                    for (var i = lineIndex; i < lineIndex + lineCount; i++) {
                        var selectionEnd = thisScope.internalInput.selectionEnd;

                        thisScope.setLine("    " + thisScope.getLine(i), i);
                        thisScope.render();

                        thisScope.internalInput.selectionEnd = selectionEnd + 4;
                    }

                    thisScope.internalInput.selectionStart = selectionStart + 4;

                    break;

                case "Enter":
                    var spaceCount = thisScope.getLine().match(/^\s*/)[0].length;

                    if (thisScope.getLine().substring(0, thisScope.getColumnIndex()).trim() == "") {
                        break;
                    }

                    if (thisScope.getLine().endsWith(":")) {
                        spaceCount += 4;
                    }

                    event.preventDefault();

                    thisScope.insertCode("\n" + " ".repeat(spaceCount));

                    break;
            }
        });

        this.internalInput.addEventListener("input", function() {
            thisScope.render();
        });

        this.internalInput.addEventListener("scroll", function() {
            thisScope.element.querySelector("pynaut-scroll").scrollTop = thisScope.internalInput.scrollTop;
            thisScope.element.querySelector("pynaut-scroll").scrollLeft = thisScope.internalInput.scrollLeft;
        });
    }

    render() {
        var thisScope = this;

        this.codeElement.innerHTML = "";

        var stringOpener = null;
        var inMultilineString = false;

        this.code.split("\n").forEach(function(line) {
            var lineElement = document.createElement("div");
            var lineToParse = line;
            var tokenToAdd = "";

            lineElement.setAttribute("pynaut-line", "");

            function matchesToken(token, contextAfter = ".*") {
                var matches = lineToParse.match(new RegExp(`^(?:${token})`));

                if (matches && lineToParse.substring(matches[0].length).match(new RegExp(`^(?:${contextAfter})`))) {
                    tokenToAdd = matches[0];
                    lineToParse = lineToParse.substring(matches[0].length);

                    return true;
                }

                return false;
            }

            function matchesTokens(tokens) {
                for (var i = 0; i < tokens.length; i++) {
                    if (lineToParse.startsWith(tokens[i])) {
                        tokenToAdd = lineToParse.substring(0, tokens[i].length);
                        lineToParse = lineToParse.substring(tokens[i].length);

                        return true;
                    }
                }

                return false;
            }

            function addToken(type) {
                var tokenElement = document.createElement("span");

                tokenElement.setAttribute("pynaut-type", type);

                tokenElement.innerText = tokenToAdd;

                lineElement.append(tokenElement);
            }

            while (lineToParse.length > 0) {
                if (matchesToken("\\\\.?")) {
                    addToken("escape");
                    continue;
                }

                if (stringOpener != null) {
                    if (matchesToken(stringOpener)) {
                        addToken("string");

                        stringOpener = null;
                        inMultilineString = false;

                        continue;
                    }

                    matchesToken(".");
                    addToken("string");
                    continue;
                }

                if (matchesToken("\"\"\"|'''")) {
                    stringOpener = tokenToAdd;
                    inMultilineString = true;

                    addToken("string");
                    continue;
                }

                if (matchesToken("\"|'")) {
                    stringOpener = tokenToAdd;

                    addToken("string");
                    continue;
                }

                if (matchesToken("#.*")) {
                    addToken("comment");
                    break;
                }

                if (matchesToken(`\\b(?:${KEYWORDS.join("|")})\\b`)) {
                    addToken("keyword");
                    continue;
                }

                if (matchesToken("\\s+")) {
                    addToken("whitespace");
                    continue;
                }
                
                if (matchesTokens(OPERATORS)) {
                    addToken("operator");
                    continue;
                }

                if (
                    matchesToken("0(x|X)[0-9a-fA-F]+n?") ||
                    matchesToken("0(b|B)[01]+n?") ||
                    matchesToken("0(o|O)?[0-7]+n?") ||
                    matchesToken("(?:(?:[0-9]+\\.[0-9]*)|(?:[0-9]*\\.[0-9]+)|(?:[0-9]+))(?:[eE][+-]?[0-9]+)?")
                ) {
                    addToken("number");
                    continue;
                }

                if (matchesToken("[a-zA-Z_][a-zA-Z0-9_]*", "\\s*\\(")) {
                    addToken("subroutine");
                    continue;
                }

                if (matchesToken("[a-zA-Z_][a-zA-Z0-9_]*")) {
                    addToken("variable");
                    continue;
                }

                matchesToken(".");
                addToken("other");
            }

            if (tokenToAdd != "\\" && !inMultilineString) {
                stringOpener = null;
            }

            lineElement.append(document.createTextNode("\u200B"));

            thisScope.codeElement.append(lineElement);
        });
    }
}