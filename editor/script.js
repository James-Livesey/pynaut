import * as editor from "./editor.js";

window.addEventListener("load", function() {
    var mainEditor = new editor.Editor(document.querySelector("#editor"));

    document.querySelector("#runButton").addEventListener("click", function() {
        Sk.configure({
            output: (data) => document.querySelector("#console textarea").value += data,
            killableWhile: true,
            killableFor: true
        });

        Sk.misceval.asyncToPromise(function() {
            return Sk.importMainWithBody("<stdin>", false, mainEditor.code, true);
        });
    });
});