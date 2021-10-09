import purs from "rollup-plugin-purs";

export default {
    input: "purescript-core/src/QrReader.purs",
    output: {
        dir: "purescript-lib",
        format: "esm"
    },
    plugins: [
        purs()
    ]
};