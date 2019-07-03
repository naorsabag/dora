# Get Started
<a name="use"></a>
## How do I work with @dora library ?
Install the library from Yarn/NPM:
`yarn add @dora/common`
or
`npm install --save @dora/common`

Map Manager can be imported into as a module:
```javascript
import * as MapManager from "@dora/common";
```

importing dora by default only imports the common classes!

Typings are included in the package, so TypeScript users can enjoy the benefit of intellisense.

When Dora is added using a script tag, it will be accessible from the global variable "Dora".

# How to use a specific map-component ?

If you are only interested in support for a certain map, it is advised to import the map-specific bundle.
For example, for `Leaflet`, the `dora-leaflet` bundle should be used:
 ```javascript
import * as LLMapManager from "@dora/common/bundle/dora-leaflet";
```
It is also possible to use multiple maps, without importing all the map modules that the library offers.
It can be achieved by importing the `common` bundle, and the needed map components:
 ```javascript
import * as dora from "@dora/common";
import { LeafletMapComponent } from "@dora/common/bundle/dora-leaflet";
import { GoogleEarthMapComponent } from "@dora/common/bundle/dora-google-earth";
```

## How do I add @dora's style files ?

possible on js/ts file
```javascript
import "@dora/common/bundle/style.css";
```
or html if you copy

```html
<link rel="stylesheet" href="dora/bundle/style.css">
```