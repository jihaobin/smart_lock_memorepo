module.exports = function(api) {
    api.cache(true);

    return {
        presets: [["babel-preset-expo", {
            jsxImportSource: "nativewind"
        }], "nativewind/babel"],

        plugins: [["module-resolver", {
            root: ["./"],
            alias: {
                "@": "./",
                "tailwind.config": "./tailwind.config.js",
                '@smart-lock/shared': '../../packages/shared/dist',
                '@smart-lock/shared/client': '../../packages/shared/dist/client',
            }
        }]]
    };
};