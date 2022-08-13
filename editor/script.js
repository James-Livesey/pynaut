import * as editor from "./editor.js";

var readCallback = function() {};
var firstRun = true;

function consoleWrite(text, classes = []) {
    for (var i = 0; i < text.length; i++) {
        if (text[i] == "\n") {
            document.querySelector("#consoleOutput").append(document.createElement("br"));
            document.querySelector("#consoleOutput").append(document.createElement("span"));

            continue;
        }

        document.querySelector("#consoleOutput > span:last-child").textContent += text[i];

        document.querySelector("#consoleOutput > span:last-child").classList.add(...classes);
    }

    document.querySelector("#console .scroll").scrollTo(0, document.querySelector("#console .scroll").scrollHeight);
}

function consoleRead() {
    return new Promise(function(resolve, reject) {
        document.querySelector("#consoleInput").setAttribute("contenteditable", "true");

        readCallback = resolve;
    }).then(function(data) {
        document.querySelector("#consoleInput").removeAttribute("contenteditable");

        return Promise.resolve(data);
    });
}

function consoleNew() {
    document.querySelectorAll("#consoleOutput span").forEach((element) => element.classList.add("old"));

    document.querySelector("#consoleOutput").append(document.createElement("hr"));

    consoleWrite("\n");
}

window.addEventListener("load", function() {
    var mainEditor = new editor.Editor(document.querySelector("#editor"));

    document.querySelector("#runButton").addEventListener("click", function() {
        if (!firstRun) {
            consoleNew();
        }

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
            return Sk.importMainWithBody("main", false, mainEditor.code, true);
        }).catch(function(error) {
            consoleWrite(error.toString() + "\n", ["error"]);

            if (error.traceback) {
                error.traceback.forEach(function(trace) {
                    consoleWrite(`    in ${trace.filename} (line ${trace.lineno})`, ["error"]);
                });
            }
        });

        firstRun = false;
    });

    document.querySelector("#console").addEventListener("click", function() {
        document.querySelector("#consoleInput").focus();
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

    mainEditor.code = `print("Hello, world!")`;
});