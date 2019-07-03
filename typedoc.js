/**
 * This file is setting all configurations for TypcDoc library for generating documentation.
 */

const typeDoc = require("typedoc");
const path = require("path");

const app = new typeDoc.Application({
    tsconfig: "./tsconfig.json",
    excludePrivate: true,
    excludeProtected: true,
    mode: "library",
    name: "dora"
});

const src = "./app/src";

app.generateDocs(
    [
        // path.resolve(src,"dora-cesium"),
        path.resolve(src, "dora-common"),
        // path.resolve(src,"dora-leaflet"),
        // path.resolve(src,"dora-google-earth"),
        // path.resolve(src,"dora-google-maps")
    ], "api_documentation",

);
