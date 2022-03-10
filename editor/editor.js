export const KEYWORDS = ["False", "None", "True", "and", "as", "assert", "break", "class", "continue", "def", "del", "elif", "else", "except", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "nonlocal", "not", "or", "pass", "raise", "return", "try", "while", "with", "yield"];

function getRemSize() {
    return parseFloat(getComputedStyle(document.documentElement).fontSize);
}

export class Editor {
    constructor(element) {
        this.element = element;

        this._selectionStart = 0;

        this.attachEvents();
    }

    get code() {
        return this.element.querySelector("textarea[pynaut-data]").value;
    }

    set code(value) {
        this.element.querySelector("textarea[pynaut-data]").value = value;
    }

    attachEvents() {
        var thisScope = this;

        // TODO: Customise caret colour and add scroll syncing

        document.body.addEventListener("keydown", function(event) {
            if (event.shiftKey && ["KeyUp", "KeyDown", "KeyLeft", "KeyRight"].includes(event.key)) {
                thisScope.element.querySelector("pynaut-code").focus();

                return;
            }

            thisScope.element.querySelector("textarea[pynaut-data]").focus();
        });

        this.element.querySelector("textarea[pynaut-data]").addEventListener("input", function() {
            thisScope.render();
        });
    }

    render() {
        var thisScope = this;

        this.element.querySelector("pynaut-code").innerHTML = "";

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

            function addToken(type) {
                var tokenElement = document.createElement("span");

                tokenElement.setAttribute("pynaut-type", type);

                tokenElement.innerText = tokenToAdd;

                lineElement.append(tokenElement);
            }

            while (lineToParse.length > 0) {
                if (matchesToken("#.*")) {
                    addToken("comment");
                    break;
                }

                if (matchesToken(KEYWORDS.join("|"))) {
                    addToken("keyword");
                    continue;
                }

                if (matchesToken("\\s+")) {
                    addToken("whitespace");
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

            lineElement.append(document.createTextNode("\u200B"));

            thisScope.element.querySelector("pynaut-code").append(lineElement);
        });
    }
}