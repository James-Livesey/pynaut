export const KEYWORDS = ["False", "None", "True", "and", "as", "assert", "break", "class", "continue", "def", "del", "elif", "else", "except", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "nonlocal", "not", "or", "pass", "raise", "return", "try", "while", "with", "yield"];

export class Editor {
    constructor(element) {
        this.element = element;

        this.attachEvents();
    }

    get code() {
        return [...this.element.querySelectorAll("div[pynaut-line]")].map((element) => element.textContent).join("\n");
    }

    set code(value) {
        var thisScope = this;

        this.element.querySelector("pynaut-code").innerHTML = "";

        value.split("\n").forEach(function(line) {
            var lineElement = document.createElement("div");

            lineElement.setAttribute("pynaut-line", "");

            lineElement.innerText = line;

            thisScope.element.querySelector("pynaut-code").append(lineElement);
        });
    }

    clean() {
        if (
            this.element.querySelector("div[pynaut-line]") == null ||
            [...this.element.querySelector("pynaut-code").childNodes].some((node) => node.nodeType == Node.TEXT_NODE && node.nodeValue.trim() != "")
        ) {
            var lineElement = document.createElement("div");

            lineElement.setAttribute("pynaut-line", "");

            lineElement.textContent = this.element.querySelector("pynaut-code").textContent;

            this.element.querySelector("pynaut-code").innerHTML = "";

            this.element.querySelector("pynaut-code").append(lineElement);

            var range = document.createRange();

            range.setStart(lineElement, lineElement.textContent.length);
            range.collapse(true);

            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
        }
    }

    attachEvents() {
        var thisScope = this;

        this.element.querySelector("pynaut-code").addEventListener("paste", function(event) {
            event.preventDefault();

            thisScope.clean();

            var htmlToInsert = event.clipboardData.getData("text/plain")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\n/g, "</div><div pynaut-line>")
            ;

            if (window.getSelection().toString().trim().length == thisScope.code.length) {
                thisScope.code = event.clipboardData.getData("text/plain");

                return;
            }

            document.execCommand("insertHTML", false, htmlToInsert);
        });

        this.element.querySelector("pynaut-code").addEventListener("keydown", function() {
            thisScope.clean();
        });

        this.element.querySelector("pynaut-code").addEventListener("keyup", function(event) {
            thisScope.element.querySelectorAll("div[pynaut-line] br").forEach((element) => element.remove());

            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
                return;
            }

            var selection = thisScope.saveSelection();

            thisScope.highlight();

            if (event.key != "Enter") {
                thisScope.restoreSelection(selection);
            }
        });
    }

    highlight() {
        this.element.querySelectorAll("div[pynaut-line]").forEach(function(lineElement) {
            var lineToParse = lineElement.textContent;
            var tokenToAdd = "";

            function matchesToken(token, contextAfter = ".*") {
                var matches = lineToParse.match(new RegExp(`^(?:${token})`));

                if (matches && lineToParse.substring(matches[0].length).match(contextAfter)) {
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

            lineElement.innerHTML = "";

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

                if (matchesToken("[a-zA-Z_][a-zA-Z0-9_]*", "\\w*\\(")) {
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

            if (lineElement.innerHTML == "") {
                lineElement.textContent = "\u200B";
            }
        });
    }

    // `saveSelection` and `restoreSelection` based off of https://stackoverflow.com/a/13950376

    saveSelection() {
        if (window.getSelection().rangeCount == 0) {
            return new exports.Selection(0, 0);
        }

        var range = window.getSelection().getRangeAt(0);
        var startRange = range.cloneRange();

        startRange.selectNodeContents(this.element);
        startRange.setEnd(range.startContainer, range.startOffset);

        return {start: startRange.toString().length, end: startRange.toString().length + range.toString().length};
    }

    restoreSelection(selection) {
        var index = 0;
        var range = document.createRange();

        range.setStart(this.element, 0);
        range.collapse(true);

        var elementStack = [this.element];
        var element = null;
        var foundStart = false;
        var shouldStop = false;

        while (!shouldStop && (element = elementStack.pop())) {
            if (element.nodeType == Node.TEXT_NODE) {
                var nextIndex = index + element.length;

                if (!foundStart && selection.start >= index && selection.start <= nextIndex) {
                    range.setStart(element, selection.start - index);

                    foundStart = true;
                }

                if (foundStart && selection.end >= index && selection.end <= index) {
                    range.setEnd(element, selection.end - index);

                    shouldStop = true;
                }

                index = nextIndex;
            } else {
                var i = element.childNodes.length;

                while (i--) {
                    elementStack.push(element.childNodes[i]);
                }
            }
        }

        var newSelection = window.getSelection();

        newSelection.removeAllRanges();
        newSelection.addRange(range);
    };
}