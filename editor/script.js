import * as editor from "./editor.js";

var readCallback = function() {};

function consoleWrite(text) {
    for (var i = 0; i < text.length; i++) {
        if (text[i] == "\n") {
            document.querySelector("#consoleOutput").append(document.createElement("br"));
            document.querySelector("#consoleOutput").append(document.createElement("span"));

            continue;
        }

        document.querySelector("#consoleOutput > span:last-child").textContent += text[i];
    }
}

function consoleRead() {
    return new Promise(function(resolve, reject) {
        readCallback = resolve;
    });
}

window.addEventListener("load", function() {
    var mainEditor = new editor.Editor(document.querySelector("#editor"));

    document.querySelector("#runButton").addEventListener("click", function() {
        Sk.configure({
            inputfun: function(text) {
                consoleWrite(text);

                return consoleRead();
            },
            output: (text) => consoleWrite(text),
            killableWhile: true,
            killableFor: true
        });

        Sk.misceval.asyncToPromise(function() {
            return Sk.importMainWithBody("<stdin>", false, mainEditor.code, true);
        });
    });

    document.querySelector("#consoleInput").addEventListener("keydown", function(event) {
        if (event.key == "Enter") {
            event.preventDefault();

            var text = document.querySelector("#consoleInput").textContent;

            document.querySelector("#consoleInput").textContent = "";

            consoleWrite(text + "\n");
            readCallback(text);

            return;
        }

        if (event.ctrlKey && ["b", "i", "u"].includes(event.key.toLowerCase())) {
            event.preventDefault();

            return;
        }
    });

    document.querySelector("#consoleInput").addEventListener("paste", function(event) {
        var text = event.clipboardData.getData("text/plain");

        event.preventDefault();

        document.execCommand("insertText", false, text);
    });
});