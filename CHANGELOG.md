# @dora 1.0.0-beta.16 [2019-05-15]

### **Bugs :bug:**
* `instanceof` conditions were removed from `initNativeMapInstance(..)`.

# @dora 1.0.0-beta.14 [2019-05-14]

### **Features :new:**
* `isOnMap new API` - previous name `isAdded` (was protected), an indicator getter if a geometry is on map or not . 
* `Rasters & Layers support on leaflet` - Now available.
* `GeoJSON` - support basic shapes beside Feature shapes on `Geometry.setGeoJSON(...)`
* `Line patterns on cesium` - now available

### **Fixes :wrench:**
* `peerDependencies` - Aligning all specific map libraries as peerDependencies (All in devDependencies for convinient)

### **Bugs :bug:**
* `Designed point` - *regression* - applyDesign on point removed somehow, now working.
* `is2D not reliable on cesium` - for cesium on initial.

# @dora 1.0.0-beta.12 [2019-05-02]

### **Fixes :wrench:**
* import paths for geometry design interfaces & enums.

# @dora 1.0.0-beta.11 [2019-05-01]

### **Bugs :bug:**
* fix is2D is not reliable [issue #53].

# @dora 1.0.0-beta.4 [2019-04-18]

### **Features :new:**
* Exporting from `MapComponent` - Map's library object as `mapComponent.mapLibraryObject` and map-instance    as `mapComponent.nativeMapInstance`.
* Entity hover mark [KML FLOW].

## **DEPRECATIONS :warning: :x:**
* `mapComponent.setNativeMapInstance(...)` - Changed to `initNativeMapInstance(...)` due to the purpose of this function is to initial `@dora` map-component with an instance of a map, and not to set it whenever the user wants, Validations has added.
* `geometryBuilder.buildFromGeoJSONFeature<...>(...)` - Changed to `buildFromGeoJSON<..>(...)` - *Will be deprecate on version 1.0.0* - The new function does the same thing but support basic GeoJSON geometries as well and has the same parameters so only the user will have to change only the name.