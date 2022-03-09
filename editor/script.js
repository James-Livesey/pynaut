window.addEventListener("load", function() {
    document.querySelector("#runButton").addEventListener("click", function() {
        Sk.configure({
            output: (data) => document.querySelector("#console textarea").value += data,
            killableWhile: true,
            killableFor: true
        });

        Sk.misceval.asyncToPromise(function() {
            return Sk.importMainWithBody("<stdin>", false, [...document.querySelectorAll("#editor pynaut-line")].map((element) => element.textContent).join("\n"), true);
        });
    });
});