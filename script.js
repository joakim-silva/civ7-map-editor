/*
============================================================
LIMESPACE MAP GENERATOR
VERSION 0.9

FEATURES

- Exact six-way snowflake symmetry
- Deterministic terrain
- Grassland / plains / desert / tundra
- Hills / mountains / forests
- Coast and deep ocean
- Six symmetrical player starts
- Resource slot engine
- Automatic connected rivers
- Six-way river rotation
- Freshwater calculation
- Balance analysis
- Manual terrain editing
- Manual river editing
- Browser save/load
- JSON export/import
============================================================
*/


// ============================================================
// DOM
// ============================================================

const canvas =
    document.getElementById(
        "mapCanvas"
    );

const context =
    canvas.getContext(
        "2d"
    );


const mapSizeInput =
    document.getElementById(
        "mapSize"
    );

const armLengthInput =
    document.getElementById(
        "armLength"
    );

const armWidthInput =
    document.getElementById(
        "armWidth"
    );

const hubSizeInput =
    document.getElementById(
        "hubSize"
    );


const generateButton =
    document.getElementById(
        "generateButton"
    );

const toggleGridButton =
    document.getElementById(
        "toggleGridButton"
    );


const symmetryToggle =
    document.getElementById(
        "symmetryToggle"
    );


const startDistanceInput =
    document.getElementById(
        "startDistance"
    );

const startZoneRadiusInput =
    document.getElementById(
        "startZoneRadius"
    );

const showStartsToggle =
    document.getElementById(
        "showStartsToggle"
    );

const showStartZonesToggle =
    document.getElementById(
        "showStartZonesToggle"
    );


const resourceDensityInput =
    document.getElementById(
        "resourceDensity"
    );

const centralRichnessInput =
    document.getElementById(
        "centralRichness"
    );

const autoResourceToggle =
    document.getElementById(
        "autoResourceToggle"
    );

const showResourceSlotsToggle =
    document.getElementById(
        "showResourceSlotsToggle"
    );


const showRiversToggle =
    document.getElementById(
        "showRiversToggle"
    );

const showFreshWaterToggle =
    document.getElementById(
        "showFreshWaterToggle"
    );

const clearRiversButton =
    document.getElementById(
        "clearRiversButton"
    );

const regenerateRiversButton =
    document.getElementById(
        "regenerateRiversButton"
    );


const landCountElement =
    document.getElementById(
        "landCount"
    );

const coastCountElement =
    document.getElementById(
        "coastCount"
    );

const oceanCountElement =
    document.getElementById(
        "oceanCount"
    );

const riverCountElement =
    document.getElementById(
        "riverCount"
    );

const freshWaterCountElement =
    document.getElementById(
        "freshWaterCount"
    );

const resourceSlotCountElement =
    document.getElementById(
        "resourceSlotCount"
    );


const centreCoordinatesElement =
    document.getElementById(
        "centreCoordinates"
    );

const coordinatesElement =
    document.getElementById(
        "coordinates"
    );

const brushNameElement =
    document.getElementById(
        "brushName"
    );


const startDistanceValue =
    document.getElementById(
        "startDistanceValue"
    );

const startRadiusValue =
    document.getElementById(
        "startRadiusValue"
    );

const resourceDensityValue =
    document.getElementById(
        "resourceDensityValue"
    );

const centralRichnessValue =
    document.getElementById(
        "centralRichnessValue"
    );


const balanceStatusElement =
    document.getElementById(
        "balanceStatus"
    );

const balanceTableElement =
    document.getElementById(
        "balanceTable"
    );


const saveMapButton =
    document.getElementById(
        "saveMapButton"
    );

const loadMapButton =
    document.getElementById(
        "loadMapButton"
    );

const exportMapButton =
    document.getElementById(
        "exportMapButton"
    );


const exportCiv7Button =
    document.getElementById(
        "exportCiv7Button"
    );

const importMapButton =
    document.getElementById(
        "importMapButton"
    );

const importMapFile =
    document.getElementById(
        "importMapFile"
    );

const mapFileStatus =
    document.getElementById(
        "mapFileStatus"
    );


const brushButtons =
    document.querySelectorAll(
        ".brush"
    );


// ============================================================
// SAVE FORMAT
// ============================================================

const LIMESPACE_SAVE_KEY =
    "limespaceSnowflakeMap";

const LIMESPACE_MAP_FORMAT =
    "LIMESPACE_SNOWFLAKE";

const LIMESPACE_MAP_VERSION =
    "0.9";


// ============================================================
// HEX CONFIG
// ============================================================

const HEX_SIZE =
    9;

const HEX_HEIGHT =
    Math.sqrt(3) *
    HEX_SIZE;

const HEX_WIDTH =
    HEX_SIZE *
    2;

const HORIZONTAL_SPACING =
    HEX_SIZE *
    1.5;


// ============================================================
// RIVER CONFIG
// ============================================================

const AUTO_RIVER_TARGET_LENGTH =
    11;

const RIVER_VERTEX_TOLERANCE =
    1.5;


// ============================================================
// STATE
// ============================================================

let mapWidth =
    61;

let mapHeight =
    61;

let centreColumn =
    30;

let centreRow =
    30;


let mapTiles =
    [];

let playerStarts =
    [];

let riverEdges =
    new Map();


let showGrid =
    true;

let selectedBrush =
    "grassland";

let mouseDown =
    false;


// ============================================================
// RESOURCE SLOT TYPES
// ============================================================

const SLOT_NONE =
    null;

const SLOT_FOOD =
    "food";

const SLOT_TRADEABLE =
    "tradeable";

const SLOT_STRATEGIC =
    "strategic";

const SLOT_MARINE =
    "marine";

const SLOT_CONTESTED =
    "contested";

const SLOT_ANY =
    "any";


// ============================================================
// TILE
// ============================================================

function createTile(
    land,
    terrain,
    elevation,
    feature
) {

    return {

        land,

        terrain,

        elevation,

        feature,

        resourceSlot:
            SLOT_NONE,

        resourceSource:
            null,

        manualWater:
            false,

        baseLand:
            land,

        baseTerrain:
            terrain,

        baseElevation:
            elevation,

        baseFeature:
            feature
    };
}


// ============================================================
// HEX COORDINATES
// ============================================================

function hexToPixel(
    column,
    row
) {

    return {

        x:
            HEX_SIZE +
            column *
            HORIZONTAL_SPACING,

        y:
            HEX_SIZE +
            row *
            HEX_HEIGHT +
            (
                column & 1
                    ? HEX_HEIGHT / 2
                    : 0
            )
    };
}


function offsetToAxial(
    column,
    row
) {

    return {

        q:
            column,

        r:
            row -
            (
                column -
                (column & 1)
            )
            /
            2
    };
}


function axialToOffset(
    q,
    r
) {

    return {

        x:
            q,

        y:
            r +
            (
                q -
                (q & 1)
            )
            /
            2
    };
}


function axialToCube(
    q,
    r
) {

    return {

        x:
            q,

        y:
            -q - r,

        z:
            r
    };
}


function offsetToCube(
    column,
    row
) {

    const axial =
        offsetToAxial(
            column,
            row
        );

    return axialToCube(
        axial.q,
        axial.r
    );
}


function getCentreCube() {

    return offsetToCube(
        centreColumn,
        centreRow
    );
}


function tileToLocalCube(
    column,
    row
) {

    const cube =
        offsetToCube(
            column,
            row
        );

    const centre =
        getCentreCube();


    return {

        x:
            cube.x -
            centre.x,

        y:
            cube.y -
            centre.y,

        z:
            cube.z -
            centre.z
    };
}


function localCubeToTile(
    cube
) {

    const centre =
        getCentreCube();


    return axialToOffset(

        cube.x +
        centre.x,

        cube.z +
        centre.z
    );
}


function rotateCube60(
    cube
) {

    return {

        x:
            -cube.z,

        y:
            -cube.x,

        z:
            -cube.y
    };
}


function rotateCubeTimes(
    cube,
    times
) {

    let result = {

        x:
            cube.x,

        y:
            cube.y,

        z:
            cube.z
    };


    for (
        let i = 0;
        i < times;
        i++
    ) {

        result =
            rotateCube60(
                result
            );
    }


    return result;
}


function cubeDistance(
    a,
    b
) {

    return Math.max(

        Math.abs(
            a.x -
            b.x
        ),

        Math.abs(
            a.y -
            b.y
        ),

        Math.abs(
            a.z -
            b.z
        )
    );
}


function tileHexDistance(
    x1,
    y1,
    x2,
    y2
) {

    return cubeDistance(

        offsetToCube(
            x1,
            y1
        ),

        offsetToCube(
            x2,
            y2
        )
    );
}


// ============================================================
// SIX-WAY ORBIT
// ============================================================

function getFullOrbit(
    column,
    row
) {

    let cube =
        tileToLocalCube(
            column,
            row
        );


    const results =
        [];

    const used =
        new Set();


    for (
        let i = 0;
        i < 6;
        i++
    ) {

        const tile =
            localCubeToTile(
                cube
            );


        if (

            tile.x >= 0 &&
            tile.x < mapWidth &&

            tile.y >= 0 &&
            tile.y < mapHeight

        ) {

            const key =
                tile.x +
                "," +
                tile.y;


            if (
                !used.has(key)
            ) {

                used.add(key);


                results.push({

                    x:
                        tile.x,

                    y:
                        tile.y
                });
            }
        }


        cube =
            rotateCube60(
                cube
            );
    }


    return results;
}


function getSymmetricalTiles(
    column,
    row
) {

    if (
        !symmetryToggle.checked
    ) {

        return [

            {
                x:
                    column,

                y:
                    row
            }

        ];
    }


    return getFullOrbit(
        column,
        row
    );
}


function getCanonicalTile(
    column,
    row
) {

    const orbit =
        getFullOrbit(
            column,
            row
        );


    orbit.sort(

        (a, b) =>

            (
                a.y *
                mapWidth +
                a.x
            )

            -

            (
                b.y *
                mapWidth +
                b.x
            )
    );


    return orbit[0];
}


function isCanonicalRepresentative(
    column,
    row
) {

    const canonical =
        getCanonicalTile(
            column,
            row
        );


    return (

        canonical.x ===
            column &&

        canonical.y ===
            row
    );
}


// ============================================================
// WORLD POSITION
// ============================================================

function tileToWorld(
    column,
    row
) {

    const tilePixel =
        hexToPixel(
            column,
            row
        );


    const centrePixel =
        hexToPixel(
            centreColumn,
            centreRow
        );


    return {

        x:
            tilePixel.x -
            centrePixel.x,

        y:
            tilePixel.y -
            centrePixel.y
    };
}


// ============================================================
// GEOMETRY
// ============================================================

function distanceToSegment(
    px,
    py,
    ax,
    ay,
    bx,
    by
) {

    const abx =
        bx - ax;

    const aby =
        by - ay;

    const apx =
        px - ax;

    const apy =
        py - ay;


    const lengthSquared =
        abx * abx +
        aby * aby;


    if (
        lengthSquared ===
        0
    ) {

        const dx =
            px - ax;

        const dy =
            py - ay;


        return Math.sqrt(
            dx * dx +
            dy * dy
        );
    }


    let t =
        (
            apx * abx +
            apy * aby
        )
        /
        lengthSquared;


    t =
        Math.max(
            0,
            Math.min(
                1,
                t
            )
        );


    const nearestX =
        ax +
        abx * t;

    const nearestY =
        ay +
        aby * t;


    const dx =
        px -
        nearestX;

    const dy =
        py -
        nearestY;


    return Math.sqrt(
        dx * dx +
        dy * dy
    );
}


function getMapScalePixels() {

    return Math.min(

        mapWidth *
        HORIZONTAL_SPACING,

        mapHeight *
        HEX_HEIGHT
    );
}


// ============================================================
// SNOWFLAKE
// ============================================================

function rawSnowflakeTest(
    column,
    row
) {

    const point =
        tileToWorld(
            column,
            row
        );


    const radius =
        Math.sqrt(

            point.x *
            point.x +

            point.y *
            point.y
        );


    const mapScale =
        getMapScalePixels();


    const hubRadius =
        mapScale *
        (
            Number(
                hubSizeInput.value
            )
            /
            100
        );


    const armEnd =
        mapScale *
        (
            Number(
                armLengthInput.value
            )
            /
            100
        );


    const armHalfWidth =
        mapScale *
        (
            Number(
                armWidthInput.value
            )
            /
            100
        );


    const armStart =
        hubRadius *
        0.65;


    const branchStart =
        mapScale *
        0.20;


    const branchLength =
        mapScale *
        0.105;


    const branchHalfWidth =
        armHalfWidth *
        0.70;


    if (
        radius <=
        hubRadius
    ) {

        return true;
    }


    for (
        let arm = 0;
        arm < 6;
        arm++
    ) {

        const angle =
            arm *
            Math.PI /
            3;


        const cosA =
            Math.cos(angle);


        const sinA =
            Math.sin(angle);


        const armDistance =
            distanceToSegment(

                point.x,
                point.y,

                cosA *
                armStart,

                sinA *
                armStart,

                cosA *
                armEnd,

                sinA *
                armEnd
            );


        if (
            armDistance <=
            armHalfWidth
        ) {

            return true;
        }


        const branchBaseX =
            cosA *
            branchStart;


        const branchBaseY =
            sinA *
            branchStart;


        const leftAngle =
            angle +
            Math.PI /
            3;


        const rightAngle =
            angle -
            Math.PI /
            3;


        const leftDistance =
            distanceToSegment(

                point.x,
                point.y,

                branchBaseX,
                branchBaseY,

                branchBaseX +
                Math.cos(
                    leftAngle
                ) *
                branchLength,

                branchBaseY +
                Math.sin(
                    leftAngle
                ) *
                branchLength
            );


        const rightDistance =
            distanceToSegment(

                point.x,
                point.y,

                branchBaseX,
                branchBaseY,

                branchBaseX +
                Math.cos(
                    rightAngle
                ) *
                branchLength,

                branchBaseY +
                Math.sin(
                    rightAngle
                ) *
                branchLength
            );


        if (

            leftDistance <=
                branchHalfWidth ||

            rightDistance <=
                branchHalfWidth

        ) {

            return true;
        }
    }


    return false;
}


function isSnowflakeLand(
    column,
    row
) {

    const canonical =
        getCanonicalTile(
            column,
            row
        );


    return rawSnowflakeTest(
        canonical.x,
        canonical.y
    );
}


// ============================================================
// HASH
// ============================================================

function hashString(
    value
) {

    let hash =
        2166136261;


    for (
        let i = 0;
        i < value.length;
        i++
    ) {

        hash ^=
            value.charCodeAt(i);


        hash =
            Math.imul(
                hash,
                16777619
            );
    }


    return (
        hash >>>
        0
    );
}


function getTileHash(
    column,
    row
) {

    const canonical =
        getCanonicalTile(
            column,
            row
        );


    return hashString(

        canonical.x +
        ":" +
        canonical.y
    );
}


// ============================================================
// TERRAIN GENERATION
// ============================================================

function chooseGeneratedBiome(
    column,
    row
) {

    const point =
        tileToWorld(
            column,
            row
        );


    const radius =
        Math.sqrt(

            point.x *
            point.x +

            point.y *
            point.y
        );


    const normalizedRadius =
        radius /
        getMapScalePixels();


    const variation =
        getTileHash(
            column,
            row
        )
        %
        100;


    if (
        normalizedRadius <
        0.11
    ) {

        return (
            variation < 68
                ? "grassland"
                : "plains"
        );
    }


    if (
        normalizedRadius <
        0.22
    ) {

        if (
            variation < 48
        ) {
            return "grassland";
        }


        if (
            variation < 82
        ) {
            return "plains";
        }


        return "desert";
    }


    if (
        normalizedRadius <
        0.31
    ) {

        if (
            variation < 35
        ) {
            return "grassland";
        }


        if (
            variation < 67
        ) {
            return "plains";
        }


        if (
            variation < 84
        ) {
            return "desert";
        }


        return "tundra";
    }


    if (
        variation < 28
    ) {
        return "grassland";
    }


    if (
        variation < 55
    ) {
        return "plains";
    }


    if (
        variation < 74
    ) {
        return "desert";
    }


    return "tundra";
}


function chooseGeneratedElevation(
    column,
    row
) {

    const point =
        tileToWorld(
            column,
            row
        );


    const radius =
        Math.sqrt(

            point.x *
            point.x +

            point.y *
            point.y
        );


    const normalizedRadius =
        radius /
        getMapScalePixels();


    const variation =
        (
            getTileHash(
                column,
                row
            )
            >>>
            8
        )
        %
        100;


    if (
        normalizedRadius <
        0.11
    ) {

        return "flat";
    }


    if (
        normalizedRadius <
        0.18
    ) {

        return (
            variation < 15
                ? "hill"
                : "flat"
        );
    }


    if (
        normalizedRadius <
        0.30
    ) {

        if (
            variation < 9
        ) {
            return "mountain";
        }


        if (
            variation < 35
        ) {
            return "hill";
        }


        return "flat";
    }


    if (
        variation < 12
    ) {
        return "mountain";
    }


    if (
        variation < 42
    ) {
        return "hill";
    }


    return "flat";
}


function chooseGeneratedFeature(
    column,
    row,
    terrain,
    elevation
) {

    if (
        elevation ===
        "mountain"
    ) {

        return null;
    }


    if (
        terrain ===
        "desert"
    ) {

        return null;
    }


    const variation =
        (
            getTileHash(
                column,
                row
            )
            >>>
            16
        )
        %
        100;


    if (

        terrain ===
            "grassland" &&

        variation <
            34

    ) {

        return "forest";
    }


    if (

        terrain ===
            "plains" &&

        variation <
            22

    ) {

        return "forest";
    }


    if (

        terrain ===
            "tundra" &&

        variation <
            28

    ) {

        return "forest";
    }


    return null;
}


function buildGeneratedTile(
    column,
    row
) {

    const land =
        isSnowflakeLand(
            column,
            row
        );


    if (
        !land
    ) {

        return createTile(
            false,
            "ocean",
            "flat",
            null
        );
    }


    const terrain =
        chooseGeneratedBiome(
            column,
            row
        );


    const elevation =
        chooseGeneratedElevation(
            column,
            row
        );


    const feature =
        chooseGeneratedFeature(
            column,
            row,
            terrain,
            elevation
        );


    return createTile(
        true,
        terrain,
        elevation,
        feature
    );
}


// ============================================================
// ADJACENCY
// ============================================================

const CUBE_DIRECTIONS = [

    {
        x: 1,
        y: -1,
        z: 0
    },

    {
        x: 1,
        y: 0,
        z: -1
    },

    {
        x: 0,
        y: 1,
        z: -1
    },

    {
        x: -1,
        y: 1,
        z: 0
    },

    {
        x: -1,
        y: 0,
        z: 1
    },

    {
        x: 0,
        y: -1,
        z: 1
    }

];


function getAdjacentTiles(
    column,
    row
) {

    const cube =
        offsetToCube(
            column,
            row
        );


    const results =
        [];


    for (
        const direction
        of CUBE_DIRECTIONS
    ) {

        const nextCube = {

            x:
                cube.x +
                direction.x,

            y:
                cube.y +
                direction.y,

            z:
                cube.z +
                direction.z
        };


        const tile =
            axialToOffset(
                nextCube.x,
                nextCube.z
            );


        if (

            tile.x >= 0 &&
            tile.x < mapWidth &&

            tile.y >= 0 &&
            tile.y < mapHeight

        ) {

            results.push(
                tile
            );
        }
    }


    return results;
}


function areAdjacent(
    a,
    b
) {

    return (

        cubeDistance(

            offsetToCube(
                a.x,
                a.y
            ),

            offsetToCube(
                b.x,
                b.y
            )
        )

        ===
        1
    );
}


// ============================================================
// COAST
// ============================================================

function isAdjacentToLand(
    column,
    row
) {

    for (
        const neighbour
        of getAdjacentTiles(
            column,
            row
        )
    ) {

        if (
            mapTiles[
                neighbour.y
            ][
                neighbour.x
            ].land
        ) {

            return true;
        }
    }


    return false;
}


function updateCoastlines() {

    for (
        let row = 0;
        row < mapHeight;
        row++
    ) {

        for (
            let column = 0;
            column < mapWidth;
            column++
        ) {

            const tile =
                mapTiles[
                    row
                ][
                    column
                ];


            if (
                tile.land
            ) {

                continue;
            }


            if (
                tile.manualWater
            ) {

                continue;
            }


            tile.terrain =
                isAdjacentToLand(
                    column,
                    row
                )
                    ? "coast"
                    : "ocean";
        }
    }
}


function saveGeneratedBaseState() {

    for (
        let row = 0;
        row < mapHeight;
        row++
    ) {

        for (
            let column = 0;
            column < mapWidth;
            column++
        ) {

            const tile =
                mapTiles[
                    row
                ][
                    column
                ];


            tile.baseLand =
                tile.land;


            tile.baseTerrain =
                tile.terrain;


            tile.baseElevation =
                tile.elevation;


            tile.baseFeature =
                tile.feature;
        }
    }
}


// ============================================================
// STARTS
// ============================================================

function findNearestValidLandTile(
    targetX,
    targetY
) {

    let bestTile =
        null;


    let bestDistance =
        Infinity;


    for (
        let row = 0;
        row < mapHeight;
        row++
    ) {

        for (
            let column = 0;
            column < mapWidth;
            column++
        ) {

            const tile =
                mapTiles[
                    row
                ][
                    column
                ];


            if (
                !tile.land
            ) {

                continue;
            }


            if (
                tile.elevation ===
                "mountain"
            ) {

                continue;
            }


            const point =
                tileToWorld(
                    column,
                    row
                );


            const dx =
                point.x -
                targetX;


            const dy =
                point.y -
                targetY;


            const distance =
                dx * dx +
                dy * dy;


            if (
                distance <
                bestDistance
            ) {

                bestDistance =
                    distance;


                bestTile = {

                    x:
                        column,

                    y:
                        row
                };
            }
        }
    }


    return bestTile;
}


function generatePlayerStarts() {

    playerStarts =
        [];


    const targetDistance =

        Number(
            startDistanceInput.value
        )

        *

        HORIZONTAL_SPACING;


    const reference =
        findNearestValidLandTile(
            targetDistance,
            0
        );


    if (
        !reference
    ) {

        return;
    }


    const orbit =
        getFullOrbit(
            reference.x,
            reference.y
        );


    for (
        let i = 0;
        i < orbit.length;
        i++
    ) {

        const position =
            orbit[i];


        playerStarts.push({

            player:
                i + 1,

            x:
                position.x,

            y:
                position.y,

            cube:
                tileToLocalCube(
                    position.x,
                    position.y
                )
        });
    }


    preparePlayerStartTiles();
}


function preparePlayerStartTiles() {

    for (
        const start
        of playerStarts
    ) {

        const tile =
            mapTiles[
                start.y
            ][
                start.x
            ];


        tile.land =
            true;


        tile.terrain =
            "grassland";


        tile.elevation =
            "flat";


        tile.feature =
            null;


        tile.resourceSlot =
            null;


        tile.resourceSource =
            null;
    }
}


function getStartZonePlayer(
    column,
    row
) {

    const radius =
        Number(
            startZoneRadiusInput.value
        );


    for (
        const start
        of playerStarts
    ) {

        if (

            tileHexDistance(
                column,
                row,
                start.x,
                start.y
            )

            <=
            radius

        ) {

            return start.player;
        }
    }


    return null;
}


// ============================================================
// RIVER STORAGE
// ============================================================

function tileKey(
    tile
) {

    return (
        tile.x +
        "," +
        tile.y
    );
}


function normaliseEdge(
    a,
    b
) {

    const first =
        tileKey(a);

    const second =
        tileKey(b);


    if (
        first <
        second
    ) {

        return {

            key:
                first +
                "|" +
                second,

            a: {
                x: a.x,
                y: a.y
            },

            b: {
                x: b.x,
                y: b.y
            }
        };
    }


    return {

        key:
            second +
            "|" +
            first,

        a: {
            x: b.x,
            y: b.y
        },

        b: {
            x: a.x,
            y: a.y
        }
    };
}


function canPlaceRiverEdge(
    a,
    b
) {

    if (
        !areAdjacent(
            a,
            b
        )
    ) {

        return false;
    }


    const tileA =
        mapTiles[
            a.y
        ][
            a.x
        ];


    const tileB =
        mapTiles[
            b.y
        ][
            b.x
        ];


    return (
        tileA.land ||
        tileB.land
    );
}


function addRiverEdge(
    a,
    b
) {

    if (
        !canPlaceRiverEdge(
            a,
            b
        )
    ) {

        return false;
    }


    const edge =
        normaliseEdge(
            a,
            b
        );


    riverEdges.set(
        edge.key,
        edge
    );


    return true;
}


function removeRiverEdge(
    a,
    b
) {

    const edge =
        normaliseEdge(
            a,
            b
        );


    riverEdges.delete(
        edge.key
    );
}


function rotateTileAroundCentre(
    tile,
    times
) {

    const local =
        tileToLocalCube(
            tile.x,
            tile.y
        );


    return localCubeToTile(

        rotateCubeTimes(
            local,
            times
        )
    );
}


function getSymmetricalRiverEdges(
    a,
    b
) {

    if (
        !symmetryToggle.checked
    ) {

        return [
            {
                a,
                b
            }
        ];
    }


    const results =
        [];

    const used =
        new Set();


    for (
        let rotation = 0;
        rotation < 6;
        rotation++
    ) {

        const rotatedA =
            rotateTileAroundCentre(
                a,
                rotation
            );


        const rotatedB =
            rotateTileAroundCentre(
                b,
                rotation
            );


        if (

            rotatedA.x < 0 ||
            rotatedA.x >= mapWidth ||

            rotatedA.y < 0 ||
            rotatedA.y >= mapHeight ||

            rotatedB.x < 0 ||
            rotatedB.x >= mapWidth ||

            rotatedB.y < 0 ||
            rotatedB.y >= mapHeight

        ) {

            continue;
        }


        const edge =
            normaliseEdge(
                rotatedA,
                rotatedB
            );


        if (
            !used.has(
                edge.key
            )
        ) {

            used.add(
                edge.key
            );


            results.push(
                edge
            );
        }
    }


    return results;
}


// ============================================================
// RIVER GEOMETRY
// ============================================================

function getRiverEdgePixelGeometry(
    edge
) {

    const a =
        hexToPixel(
            edge.a.x,
            edge.a.y
        );


    const b =
        hexToPixel(
            edge.b.x,
            edge.b.y
        );


    const midX =
        (
            a.x +
            b.x
        )
        /
        2;


    const midY =
        (
            a.y +
            b.y
        )
        /
        2;


    const dx =
        b.x -
        a.x;


    const dy =
        b.y -
        a.y;


    const length =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    if (
        length === 0
    ) {

        return null;
    }


    const perpendicularX =
        -dy /
        length;


    const perpendicularY =
        dx /
        length;


    const halfLength =
        HEX_SIZE *
        0.50;


    return {

        midpoint: {
            x: midX,
            y: midY
        },

        vertexA: {

            x:
                midX +
                perpendicularX *
                halfLength,

            y:
                midY +
                perpendicularY *
                halfLength
        },

        vertexB: {

            x:
                midX -
                perpendicularX *
                halfLength,

            y:
                midY -
                perpendicularY *
                halfLength
        }
    };
}


function pixelDistance(
    a,
    b
) {

    const dx =
        a.x -
        b.x;


    const dy =
        a.y -
        b.y;


    return Math.sqrt(
        dx * dx +
        dy * dy
    );
}


function pixelRadiusFromCentre(
    point
) {

    const centre =
        hexToPixel(
            centreColumn,
            centreRow
        );


    const dx =
        point.x -
        centre.x;


    const dy =
        point.y -
        centre.y;


    return Math.sqrt(
        dx * dx +
        dy * dy
    );
}


function isCoastalRiverEdge(
    edge
) {

    const tileA =
        mapTiles[
            edge.a.y
        ][
            edge.a.x
        ];


    const tileB =
        mapTiles[
            edge.b.y
        ][
            edge.b.x
        ];


    return (

        (
            tileA.land &&
            !tileB.land &&
            tileB.terrain ===
                "coast"
        )

        ||

        (
            tileB.land &&
            !tileA.land &&
            tileA.terrain ===
                "coast"
        )
    );
}


function getEdgesAroundTile(
    tile
) {

    const edges =
        [];

    const used =
        new Set();


    for (
        const neighbour
        of getAdjacentTiles(
            tile.x,
            tile.y
        )
    ) {

        if (
            !canPlaceRiverEdge(
                tile,
                neighbour
            )
        ) {

            continue;
        }


        const edge =
            normaliseEdge(
                tile,
                neighbour
            );


        if (
            used.has(
                edge.key
            )
        ) {

            continue;
        }


        used.add(
            edge.key
        );


        edges.push(
            edge
        );
    }


    return edges;
}


function getNeighbouringRiverEdges(
    currentEdge
) {

    const results =
        [];

    const used =
        new Set();


    const tilesToSearch = [

        currentEdge.a,
        currentEdge.b

    ];


    for (
        const tile
        of [
            currentEdge.a,
            currentEdge.b
        ]
    ) {

        for (
            const neighbour
            of getAdjacentTiles(
                tile.x,
                tile.y
            )
        ) {

            tilesToSearch.push(
                neighbour
            );
        }
    }


    for (
        const tile
        of tilesToSearch
    ) {

        if (

            tile.x < 0 ||
            tile.x >= mapWidth ||

            tile.y < 0 ||
            tile.y >= mapHeight

        ) {

            continue;
        }


        for (
            const edge
            of getEdgesAroundTile(
                tile
            )
        ) {

            if (
                edge.key ===
                currentEdge.key
            ) {

                continue;
            }


            if (
                used.has(
                    edge.key
                )
            ) {

                continue;
            }


            used.add(
                edge.key
            );


            results.push(
                edge
            );
        }
    }


    return results;
}


function getConnectedRiverGeometry(
    currentEdge,
    candidateEdge
) {

    const currentGeometry =
        getRiverEdgePixelGeometry(
            currentEdge
        );


    const candidateGeometry =
        getRiverEdgePixelGeometry(
            candidateEdge
        );


    if (
        !currentGeometry ||
        !candidateGeometry
    ) {

        return null;
    }


    const currentVertices = [

        currentGeometry.vertexA,
        currentGeometry.vertexB

    ];


    const candidateVertices = [

        candidateGeometry.vertexA,
        candidateGeometry.vertexB

    ];


    let best =
        null;


    let bestDistance =
        Infinity;


    for (
        let i = 0;
        i < 2;
        i++
    ) {

        for (
            let j = 0;
            j < 2;
            j++
        ) {

            const distance =
                pixelDistance(
                    currentVertices[i],
                    candidateVertices[j]
                );


            if (
                distance <
                bestDistance
            ) {

                bestDistance =
                    distance;


                best = {

                    currentVertex:
                        currentVertices[i],

                    candidateVertex:
                        candidateVertices[j],

                    candidateOtherVertex:
                        candidateVertices[
                            j === 0
                                ? 1
                                : 0
                        ]
                };
            }
        }
    }


    if (
        bestDistance >
        RIVER_VERTEX_TOLERANCE
    ) {

        return null;
    }


    return best;
}


function chooseInitialRiverEdge(
    start
) {

    const edges =
        getEdgesAroundTile(
            start
        );


    if (
        edges.length ===
        0
    ) {

        return null;
    }


    const centre =
        hexToPixel(
            centreColumn,
            centreRow
        );


    const startPixel =
        hexToPixel(
            start.x,
            start.y
        );


    const radialX =
        startPixel.x -
        centre.x;


    const radialY =
        startPixel.y -
        centre.y;


    const radialLength =
        Math.sqrt(

            radialX *
            radialX +

            radialY *
            radialY
        );


    if (
        radialLength === 0
    ) {

        return edges[0];
    }


    const unitX =
        radialX /
        radialLength;


    const unitY =
        radialY /
        radialLength;


    let best =
        null;


    let bestScore =
        Infinity;


    for (
        const edge
        of edges
    ) {

        const geometry =
            getRiverEdgePixelGeometry(
                edge
            );


        if (
            !geometry
        ) {

            continue;
        }


        const dx =
            geometry.midpoint.x -
            startPixel.x;


        const dy =
            geometry.midpoint.y -
            startPixel.y;


        const outward =
            Math.abs(

                dx *
                unitX +

                dy *
                unitY
            );


        const sideways =
            Math.abs(

                dx *
                unitY -

                dy *
                unitX
            );


        const score =

            outward *
            2.5 -

            sideways;


        if (
            score <
            bestScore
        ) {

            bestScore =
                score;


            best =
                edge;
        }
    }


    return best;
}


function chooseNextRiverEdge(
    currentEdge,
    usedEdges,
    previousVertex,
    step
) {

    const candidates =
        getNeighbouringRiverEdges(
            currentEdge
        );


    const currentGeometry =
        getRiverEdgePixelGeometry(
            currentEdge
        );


    if (
        !currentGeometry
    ) {

        return null;
    }


    let downstreamVertex =
        currentGeometry.vertexA;


    if (
        pixelRadiusFromCentre(
            currentGeometry.vertexB
        )
        >
        pixelRadiusFromCentre(
            currentGeometry.vertexA
        )
    ) {

        downstreamVertex =
            currentGeometry.vertexB;
    }


    if (
        previousVertex
    ) {

        const distanceA =
            pixelDistance(
                currentGeometry.vertexA,
                previousVertex
            );


        const distanceB =
            pixelDistance(
                currentGeometry.vertexB,
                previousVertex
            );


        downstreamVertex =

            distanceA >
            distanceB

                ? currentGeometry.vertexA
                : currentGeometry.vertexB;
    }


    let best =
        null;


    let bestScore =
        Infinity;


    for (
        const candidate
        of candidates
    ) {

        if (
            usedEdges.has(
                candidate.key
            )
        ) {

            continue;
        }


        const connection =
            getConnectedRiverGeometry(
                currentEdge,
                candidate
            );


        if (
            !connection
        ) {

            continue;
        }


        if (
            pixelDistance(
                connection.currentVertex,
                downstreamVertex
            )
            >
            RIVER_VERTEX_TOLERANCE
        ) {

            continue;
        }


        const currentRadius =
            pixelRadiusFromCentre(
                downstreamVertex
            );


        const nextRadius =
            pixelRadiusFromCentre(
                connection.candidateOtherVertex
            );


        const outwardGain =
            nextRadius -
            currentRadius;


        let backwardsPenalty =
            0;


        if (
            outwardGain <
            -0.5
        ) {

            backwardsPenalty =
                500;
        }


        let bendPenalty =
            0;


        if (
            previousVertex
        ) {

            const incomingX =
                downstreamVertex.x -
                previousVertex.x;


            const incomingY =
                downstreamVertex.y -
                previousVertex.y;


            const outgoingX =
                connection.candidateOtherVertex.x -
                downstreamVertex.x;


            const outgoingY =
                connection.candidateOtherVertex.y -
                downstreamVertex.y;


            const incomingLength =
                Math.sqrt(

                    incomingX *
                    incomingX +

                    incomingY *
                    incomingY
                );


            const outgoingLength =
                Math.sqrt(

                    outgoingX *
                    outgoingX +

                    outgoingY *
                    outgoingY
                );


            if (

                incomingLength >
                0 &&

                outgoingLength >
                0

            ) {

                const dot =

                    (
                        incomingX *
                        outgoingX +

                        incomingY *
                        outgoingY
                    )

                    /

                    (
                        incomingLength *
                        outgoingLength
                    );


                if (
                    dot < 0
                ) {

                    bendPenalty +=
                        250;

                } else {

                    const desiredDot =

                        step %
                        3 === 1

                            ? 0.55
                            : 0.85;


                    bendPenalty +=

                        Math.abs(
                            dot -
                            desiredDot
                        )

                        *
                        12;
                }
            }
        }


        const deterministicVariation =

            (
                hashString(
                    candidate.key +
                    ":" +
                    step
                )
                %
                100
            )

            /
            100;


        const coastalBonus =

            isCoastalRiverEdge(
                candidate
            )

                ? -30
                : 0;


        const outwardReward =

            -outwardGain *
            3;


        const score =

            backwardsPenalty +

            bendPenalty +

            outwardReward +

            deterministicVariation +

            coastalBonus;


        if (
            score <
            bestScore
        ) {

            bestScore =
                score;


            best = {

                edge:
                    candidate,

                sharedVertex:
                    connection.currentVertex,

                downstreamVertex:
                    connection.candidateOtherVertex
            };
        }
    }


    return best;
}


function addAutomaticRiverOrbit(
    edge
) {

    const symmetrical =
        getSymmetricalRiverEdges(
            edge.a,
            edge.b
        );


    for (
        const rotated
        of symmetrical
    ) {

        addRiverEdge(
            rotated.a,
            rotated.b
        );
    }
}


function findCoastalContinuation(
    currentEdge,
    usedEdges,
    previousVertex
) {

    const candidates =
        getNeighbouringRiverEdges(
            currentEdge
        );


    const currentGeometry =
        getRiverEdgePixelGeometry(
            currentEdge
        );


    if (
        !currentGeometry
    ) {

        return null;
    }


    let downstream =
        currentGeometry.vertexA;


    if (
        previousVertex
    ) {

        downstream =

            pixelDistance(
                currentGeometry.vertexA,
                previousVertex
            )

            >

            pixelDistance(
                currentGeometry.vertexB,
                previousVertex
            )

                ? currentGeometry.vertexA
                : currentGeometry.vertexB;

    } else {

        downstream =

            pixelRadiusFromCentre(
                currentGeometry.vertexA
            )

            >

            pixelRadiusFromCentre(
                currentGeometry.vertexB
            )

                ? currentGeometry.vertexA
                : currentGeometry.vertexB;
    }


    let best =
        null;


    let bestRadius =
        -Infinity;


    for (
        const candidate
        of candidates
    ) {

        if (
            usedEdges.has(
                candidate.key
            )
        ) {

            continue;
        }


        if (
            !isCoastalRiverEdge(
                candidate
            )
        ) {

            continue;
        }


        const connection =
            getConnectedRiverGeometry(
                currentEdge,
                candidate
            );


        if (
            !connection
        ) {

            continue;
        }


        if (
            pixelDistance(
                connection.currentVertex,
                downstream
            )
            >
            RIVER_VERTEX_TOLERANCE
        ) {

            continue;
        }


        const radius =
            pixelRadiusFromCentre(
                connection.candidateOtherVertex
            );


        if (
            radius >
            bestRadius
        ) {

            bestRadius =
                radius;


            best = {

                edge:
                    candidate,

                sharedVertex:
                    connection.currentVertex
            };
        }
    }


    return best;
}


function generateAutomaticRivers() {

    riverEdges.clear();


    if (
        playerStarts.length !==
        6
    ) {

        console.warn(
            "Automatic rivers require six starts."
        );

        return;
    }


    const referenceStart =
        playerStarts[0];


    const firstEdge =
        chooseInitialRiverEdge(
            referenceStart
        );


    if (
        !firstEdge
    ) {

        return;
    }


    const canonicalRiver =
        [];


    const usedEdges =
        new Set();


    canonicalRiver.push(
        firstEdge
    );


    usedEdges.add(
        firstEdge.key
    );


    let currentEdge =
        firstEdge;


    let previousVertex =
        null;


    let reachedCoast =
        isCoastalRiverEdge(
            currentEdge
        );


    for (
        let step = 1;
        step <
        AUTO_RIVER_TARGET_LENGTH;
        step++
    ) {

        if (
            reachedCoast
        ) {

            break;
        }


        const next =
            chooseNextRiverEdge(
                currentEdge,
                usedEdges,
                previousVertex,
                step
            );


        if (
            !next
        ) {

            break;
        }


        canonicalRiver.push(
            next.edge
        );


        usedEdges.add(
            next.edge.key
        );


        previousVertex =
            next.sharedVertex;


        currentEdge =
            next.edge;


        reachedCoast =
            isCoastalRiverEdge(
                currentEdge
            );
    }


    if (
        !reachedCoast
    ) {

        const mouth =
            findCoastalContinuation(
                currentEdge,
                usedEdges,
                previousVertex
            );


        if (
            mouth
        ) {

            canonicalRiver.push(
                mouth.edge
            );


            reachedCoast =
                true;
        }
    }


    for (
        const edge
        of canonicalRiver
    ) {

        addAutomaticRiverOrbit(
            edge
        );
    }


    console.log(
        "Canonical river length:",
        canonicalRiver.length
    );


    console.log(
        "Reached coast:",
        reachedCoast
    );


    console.log(
        "Total river edges:",
        riverEdges.size
    );
}


// ============================================================
// MANUAL RIVER EDITOR
// ============================================================

function findClosestRiverEdge(
    mouseX,
    mouseY
) {

    const tile =
        findClosestTile(
            mouseX,
            mouseY
        );


    if (
        !tile
    ) {

        return null;
    }


    const centre =
        hexToPixel(
            tile.x,
            tile.y
        );


    let best =
        null;


    let bestDistance =
        Infinity;


    for (
        const neighbour
        of getAdjacentTiles(
            tile.x,
            tile.y
        )
    ) {

        const neighbourPixel =
            hexToPixel(
                neighbour.x,
                neighbour.y
            );


        const midpoint = {

            x:
                (
                    centre.x +
                    neighbourPixel.x
                )
                /
                2,

            y:
                (
                    centre.y +
                    neighbourPixel.y
                )
                /
                2
        };


        const dx =
            midpoint.x -
            mouseX;


        const dy =
            midpoint.y -
            mouseY;


        const distance =
            dx * dx +
            dy * dy;


        if (
            distance <
            bestDistance
        ) {

            bestDistance =
                distance;


            best = {

                a: {
                    x: tile.x,
                    y: tile.y
                },

                b: {
                    x: neighbour.x,
                    y: neighbour.y
                }
            };
        }
    }


    return best;
}


function paintRiverEdge(
    edge
) {

    const symmetricalEdges =
        getSymmetricalRiverEdges(
            edge.a,
            edge.b
        );


    for (
        const rotated
        of symmetricalEdges
    ) {

        if (
            selectedBrush ===
            "river-add"
        ) {

            addRiverEdge(
                rotated.a,
                rotated.b
            );

        } else if (
            selectedBrush ===
            "river-remove"
        ) {

            removeRiverEdge(
                rotated.a,
                rotated.b
            );
        }
    }


    updateStats();

    updateBalancePanel();

    drawMap();

    verifyRiverSymmetry();
}


// ============================================================
// FRESH WATER
// ============================================================

function tileHasFreshWater(
    column,
    row
) {

    if (
        !mapTiles[
            row
        ][
            column
        ].land
    ) {

        return false;
    }


    const key =
        column +
        "," +
        row;


    for (
        const edge
        of riverEdges.values()
    ) {

        if (

            tileKey(
                edge.a
            )
            ===
            key ||

            tileKey(
                edge.b
            )
            ===
            key

        ) {

            return true;
        }
    }


    return false;
}


function countFreshWaterLand() {

    let count =
        0;


    for (
        let row = 0;
        row < mapHeight;
        row++
    ) {

        for (
            let column = 0;
            column < mapWidth;
            column++
        ) {

            if (
                tileHasFreshWater(
                    column,
                    row
                )
            ) {

                count++;
            }
        }
    }


    return count;
}


function removeInvalidRiverEdges() {

    const invalid =
        [];


    for (
        const edge
        of riverEdges.values()
    ) {

        if (
            !canPlaceRiverEdge(
                edge.a,
                edge.b
            )
        ) {

            invalid.push(
                edge.key
            );
        }
    }


    for (
        const key
        of invalid
    ) {

        riverEdges.delete(
            key
        );
    }
}


// ============================================================
// RESOURCE ENGINE
// ============================================================

function wouldCreateSlotCluster(
    column,
    row
) {

    for (
        const neighbour
        of getAdjacentTiles(
            column,
            row
        )
    ) {

        if (
            mapTiles[
                neighbour.y
            ][
                neighbour.x
            ].resourceSlot
        ) {

            return true;
        }
    }


    return false;
}


function clearAutomaticResourceSlots() {

    for (
        let row = 0;
        row < mapHeight;
        row++
    ) {

        for (
            let column = 0;
            column < mapWidth;
            column++
        ) {

            const tile =
                mapTiles[
                    row
                ][
                    column
                ];


            if (
                tile.resourceSource ===
                "world"
            ) {

                tile.resourceSlot =
                    null;


                tile.resourceSource =
                    null;
            }
        }
    }
}


function chooseWorldSlotType(
    column,
    row
) {

    const tile =
        mapTiles[
            row
        ][
            column
        ];


    if (
        !tile.land
    ) {

        return SLOT_MARINE;
    }


    const point =
        tileToWorld(
            column,
            row
        );


    const radius =
        Math.sqrt(

            point.x *
            point.x +

            point.y *
            point.y
        );


    const normalizedRadius =
        radius /
        getMapScalePixels();


    const roll =
        (
            getTileHash(
                column,
                row
            )
            >>>
            12
        )
        %
        100;


    if (
        normalizedRadius <
        0.12
    ) {

        if (
            roll < 42
        ) {
            return SLOT_CONTESTED;
        }


        if (
            roll < 68
        ) {
            return SLOT_STRATEGIC;
        }


        if (
            roll < 88
        ) {
            return SLOT_TRADEABLE;
        }


        return SLOT_ANY;
    }


    if (
        normalizedRadius <
        0.28
    ) {

        if (
            roll < 30
        ) {
            return SLOT_FOOD;
        }


        if (
            roll < 57
        ) {
            return SLOT_TRADEABLE;
        }


        if (
            roll < 78
        ) {
            return SLOT_STRATEGIC;
        }


        return SLOT_ANY;
    }


    if (
        roll < 38
    ) {
        return SLOT_FOOD;
    }


    if (
        roll < 65
    ) {
        return SLOT_TRADEABLE;
    }


    if (
        roll < 82
    ) {
        return SLOT_STRATEGIC;
    }


    return SLOT_ANY;
}


function shouldGenerateResourceOrbit(
    column,
    row
) {

    const tile =
        mapTiles[
            row
        ][
            column
        ];


    const hash =
        getTileHash(
            column,
            row
        );


    const baseDensity =
        Number(
            resourceDensityInput.value
        );


    const centralRichness =
        Number(
            centralRichnessInput.value
        );


    const point =
        tileToWorld(
            column,
            row
        );


    const radius =
        Math.sqrt(

            point.x *
            point.x +

            point.y *
            point.y
        );


    const normalizedRadius =
        radius /
        getMapScalePixels();


    let threshold =
        baseDensity *
        0.28;


    if (
        !tile.land
    ) {

        threshold *=

            tile.terrain ===
            "coast"

                ? 0.85
                : 0.35;
    }


    if (
        normalizedRadius <
        0.13
    ) {

        threshold +=
            centralRichness *
            0.18;
    }


    return (
        hash %
        100
        <
        threshold
    );
}


function placeResourceSlotOrbit(
    column,
    row,
    slotType,
    source
) {

    const orbit =
        getFullOrbit(
            column,
            row
        );


    for (
        const position
        of orbit
    ) {

        const tile =
            mapTiles[
                position.y
            ][
                position.x
            ];


        tile.resourceSlot =
            slotType;


        tile.resourceSource =
            source;
    }
}


function generateWorldResourceSlots() {

    clearAutomaticResourceSlots();


    if (
        !autoResourceToggle.checked
    ) {

        return;
    }


    for (
        let row = 0;
        row < mapHeight;
        row++
    ) {

        for (
            let column = 0;
            column < mapWidth;
            column++
        ) {

            if (
                !isCanonicalRepresentative(
                    column,
                    row
                )
            ) {

                continue;
            }


            const tile =
                mapTiles[
                    row
                ][
                    column
                ];


            if (
                tile.resourceSlot
            ) {

                continue;
            }


            if (
                getStartZonePlayer(
                    column,
                    row
                )
                !==
                null
            ) {

                continue;
            }


            if (
                !shouldGenerateResourceOrbit(
                    column,
                    row
                )
            ) {

                continue;
            }


            const slotType =
                chooseWorldSlotType(
                    column,
                    row
                );


            if (

                slotType ===
                    SLOT_MARINE &&

                tile.land

            ) {

                continue;
            }


            if (

                slotType !==
                    SLOT_MARINE &&

                !tile.land

            ) {

                continue;
            }


            if (
                tile.elevation ===
                "mountain"
            ) {

                continue;
            }


            let cluster =
                false;


            for (
                const position
                of getFullOrbit(
                    column,
                    row
                )
            ) {

                if (
                    wouldCreateSlotCluster(
                        position.x,
                        position.y
                    )
                ) {

                    cluster =
                        true;

                    break;
                }
            }


            if (
                cluster
            ) {

                continue;
            }


            placeResourceSlotOrbit(
                column,
                row,
                slotType,
                "world"
            );
        }
    }
}


// ============================================================
// START RESOURCE PACKAGE
// ============================================================

const START_SLOT_TEMPLATE = [

    {
        cube: {
            x: 1,
            y: -1,
            z: 0
        },

        slot:
            SLOT_FOOD
    },


    {
        cube: {
            x: 1,
            y: 0,
            z: -1
        },

        slot:
            SLOT_TRADEABLE
    },


    {
        cube: {
            x: 0,
            y: 1,
            z: -1
        },

        slot:
            SLOT_STRATEGIC
    }

];


function applyStartResourceSlots() {

    if (
        playerStarts.length !==
        6
    ) {

        return;
    }


    const reference =
        playerStarts[0];


    for (
        const template
        of START_SLOT_TEMPLATE
    ) {

        const targetCube = {

            x:
                reference.cube.x +
                template.cube.x,

            y:
                reference.cube.y +
                template.cube.y,

            z:
                reference.cube.z +
                template.cube.z
        };


        const target =
            localCubeToTile(
                targetCube
            );


        if (

            target.x < 0 ||
            target.x >= mapWidth ||

            target.y < 0 ||
            target.y >= mapHeight

        ) {

            continue;
        }


        const orbit =
            getFullOrbit(
                target.x,
                target.y
            );


        for (
            const position
            of orbit
        ) {

            const tile =
                mapTiles[
                    position.y
                ][
                    position.x
                ];


            tile.land =
                true;


            if (
                tile.elevation ===
                "mountain"
            ) {

                tile.elevation =
                    "flat";
            }


            if (

                tile.terrain ===
                    "coast" ||

                tile.terrain ===
                    "ocean"

            ) {

                tile.terrain =
                    "grassland";
            }
        }


        placeResourceSlotOrbit(
            target.x,
            target.y,
            template.slot,
            "start"
        );
    }


    updateCoastlines();
}


// ============================================================
// BALANCE
// ============================================================

function analyseStart(
    start
) {

    const radius =
        Number(
            startZoneRadiusInput.value
        );


    const result = {

        land:
            0,

        hills:
            0,

        forests:
            0,

        food:
            0,

        tradeable:
            0,

        strategic:
            0,

        freshwater:
            0
    };


    for (
        let row = 0;
        row < mapHeight;
        row++
    ) {

        for (
            let column = 0;
            column < mapWidth;
            column++
        ) {

            if (

                tileHexDistance(
                    column,
                    row,
                    start.x,
                    start.y
                )

                >

                radius

            ) {

                continue;
            }


            const tile =
                mapTiles[
                    row
                ][
                    column
                ];


            if (
                tile.land
            ) {
                result.land++;
            }


            if (
                tile.elevation ===
                "hill"
            ) {
                result.hills++;
            }


            if (
                tile.feature ===
                "forest"
            ) {
                result.forests++;
            }


            if (
                tile.resourceSlot ===
                SLOT_FOOD
            ) {
                result.food++;
            }


            if (
                tile.resourceSlot ===
                SLOT_TRADEABLE
            ) {
                result.tradeable++;
            }


            if (
                tile.resourceSlot ===
                SLOT_STRATEGIC
            ) {
                result.strategic++;
            }


            if (
                tileHasFreshWater(
                    column,
                    row
                )
            ) {
                result.freshwater++;
            }
        }
    }


    return result;
}


function getBalanceSignature(
    result
) {

    return [

        result.land,

        result.hills,

        result.forests,

        result.food,

        result.tradeable,

        result.strategic,

        result.freshwater

    ].join(":");
}


function updateBalancePanel() {

    balanceTableElement.innerHTML =
        "";


    const results =
        [];


    for (
        const start
        of playerStarts
    ) {

        const result =
            analyseStart(
                start
            );


        results.push(
            result
        );


        const row =
            document.createElement(
                "div"
            );


        row.className =
            "balance-row";


        row.innerHTML = `

            <div class="balance-player">
                P${start.player}
            </div>

            <div class="balance-data">

                🍞 ${result.food}
                &nbsp;

                💎 ${result.tradeable}
                &nbsp;

                ⚔ ${result.strategic}

                <br>

                ≋ Fresh ${result.freshwater}
                &nbsp;

                ⛰ ${result.hills}
                &nbsp;

                🌲 ${result.forests}

                <br>

                Land ${result.land}

            </div>
        `;


        balanceTableElement.appendChild(
            row
        );
    }


    if (
        results.length ===
        0
    ) {

        balanceStatusElement.textContent =
            "No starts";

        return;
    }


    const signature =
        getBalanceSignature(
            results[0]
        );


    const balanced =
        results.every(

            result =>

                getBalanceSignature(
                    result
                )

                ===

                signature
        );


    balanceStatusElement.classList.remove(
        "good",
        "bad"
    );


    if (
        balanced
    ) {

        balanceStatusElement.textContent =
            "✓ All six start zones are identical";


        balanceStatusElement.classList.add(
            "good"
        );

    } else {

        balanceStatusElement.textContent =
            "⚠ Start zones differ";


        balanceStatusElement.classList.add(
            "bad"
        );
    }
}


// ============================================================
// GENERATE MAP
// ============================================================

function generateMap() {

    mapWidth =
        Number(
            mapSizeInput.value
        );


    mapHeight =
        mapWidth;


    centreColumn =
        Math.floor(
            mapWidth /
            2
        );


    centreRow =
        Math.floor(
            mapHeight /
            2
        );


    centreCoordinatesElement.textContent =

        centreColumn +
        ", " +
        centreRow;


    mapTiles =
        [];


    riverEdges.clear();


    for (
        let row = 0;
        row < mapHeight;
        row++
    ) {

        mapTiles[row] =
            [];


        for (
            let column = 0;
            column < mapWidth;
            column++
        ) {

            mapTiles[
                row
            ][
                column
            ] =
                buildGeneratedTile(
                    column,
                    row
                );
        }
    }


    updateCoastlines();


    saveGeneratedBaseState();


    resizeCanvas();


    generatePlayerStarts();


    applyStartResourceSlots();


    generateAutomaticRivers();


    generateWorldResourceSlots();


    updateStats();


    updateBalancePanel();


    drawMap();


    verifySymmetry();


    verifyRiverSymmetry();


    console.log(
        "Limespace Map Generator V0.10 regenerated."
    );
}


// ============================================================
// VERIFY SYMMETRY
// ============================================================

function verifySymmetry() {

    let mismatches =
        0;


    for (
        let row = 0;
        row < mapHeight;
        row++
    ) {

        for (
            let column = 0;
            column < mapWidth;
            column++
        ) {

            const orbit =
                getFullOrbit(
                    column,
                    row
                );


            if (
                orbit.length ===
                0
            ) {

                continue;
            }


            const first =
                mapTiles[
                    orbit[0].y
                ][
                    orbit[0].x
                ];


            for (
                const position
                of orbit
            ) {

                const tile =
                    mapTiles[
                        position.y
                    ][
                        position.x
                    ];


                if (

                    tile.land !==
                        first.land ||

                    tile.terrain !==
                        first.terrain ||

                    tile.elevation !==
                        first.elevation ||

                    tile.feature !==
                        first.feature ||

                    tile.resourceSlot !==
                        first.resourceSlot

                ) {

                    mismatches++;
                }
            }
        }
    }


    console.log(
        "Terrain symmetry mismatches:",
        mismatches
    );
}


function verifyRiverSymmetry() {

    if (
        !symmetryToggle.checked
    ) {

        return;
    }


    let mismatches =
        0;


    for (
        const edge
        of riverEdges.values()
    ) {

        for (
            const rotated
            of getSymmetricalRiverEdges(
                edge.a,
                edge.b
            )
        ) {

            if (
                !riverEdges.has(
                    normaliseEdge(
                        rotated.a,
                        rotated.b
                    ).key
                )
            ) {

                mismatches++;
            }
        }
    }


    console.log(
        "River symmetry mismatches:",
        mismatches
    );
}


// ============================================================
// CANVAS
// ============================================================

function resizeCanvas() {

    canvas.width =
        Math.ceil(

            mapWidth *
            HORIZONTAL_SPACING +

            HEX_WIDTH
        );


    canvas.height =
        Math.ceil(

            mapHeight *
            HEX_HEIGHT +

            HEX_HEIGHT
        );
}


function getTileColor(
    tile
) {

    if (
        !tile.land &&
        tile.terrain ===
        "ocean"
    ) {

        return "#15364e";
    }


    if (
        !tile.land &&
        tile.terrain ===
        "coast"
    ) {

        return "#2b6b8a";
    }


    if (
        tile.elevation ===
        "mountain"
    ) {

        return "#85898d";
    }


    if (
        tile.elevation ===
        "hill"
    ) {

        switch (
            tile.terrain
        ) {

            case "grassland":
                return "#687e4d";

            case "plains":
                return "#8f8252";

            case "desert":
                return "#aa8c51";

            case "tundra":
                return "#888f8c";
        }
    }


    switch (
        tile.terrain
    ) {

        case "grassland":
            return "#7d935a";

        case "plains":
            return "#ad9d60";

        case "desert":
            return "#c7a765";

        case "tundra":
            return "#a7afac";

        default:
            return "#7d935a";
    }
}


function drawHex(
    centreX,
    centreY,
    fillColour,
    strokeColour
) {

    context.beginPath();


    for (
        let corner = 0;
        corner < 6;
        corner++
    ) {

        const angle =

            Math.PI /
            180 *

            (
                60 *
                corner
            );


        const x =
            centreX +
            HEX_SIZE *
            Math.cos(angle);


        const y =
            centreY +
            HEX_SIZE *
            Math.sin(angle);


        if (
            corner === 0
        ) {

            context.moveTo(
                x,
                y
            );

        } else {

            context.lineTo(
                x,
                y
            );
        }
    }


    context.closePath();


    context.fillStyle =
        fillColour;


    context.fill();


    if (
        showGrid
    ) {

        context.strokeStyle =
            strokeColour;


        context.lineWidth =
            0.7;


        context.stroke();
    }
}


function drawTileDetails(
    tile,
    pixel
) {

    if (
        tile.feature ===
        "forest"
    ) {

        context.fillStyle =
            "#174628";


        context.beginPath();


        context.moveTo(
            pixel.x,
            pixel.y - 5
        );


        context.lineTo(
            pixel.x - 4,
            pixel.y + 3
        );


        context.lineTo(
            pixel.x + 4,
            pixel.y + 3
        );


        context.closePath();


        context.fill();
    }


    if (
        tile.elevation ===
        "mountain"
    ) {

        context.fillStyle =
            "#3f454b";


        context.beginPath();


        context.moveTo(
            pixel.x,
            pixel.y - 5
        );


        context.lineTo(
            pixel.x - 5,
            pixel.y + 4
        );


        context.lineTo(
            pixel.x + 5,
            pixel.y + 4
        );


        context.closePath();


        context.fill();
    }


    if (
        tile.elevation ===
        "hill"
    ) {

        context.fillStyle =
            "rgba(40,40,40,0.38)";


        context.beginPath();


        context.arc(
            pixel.x,
            pixel.y,
            2.1,
            0,
            Math.PI * 2
        );


        context.fill();
    }
}


// ============================================================
// RESOURCE DRAWING
// ============================================================

const RESOURCE_SLOT_STYLE = {

    food: {
        label: "F",
        fill: "#d7c454"
    },

    tradeable: {
        label: "T",
        fill: "#b277c6"
    },

    strategic: {
        label: "S",
        fill: "#cc6c5f"
    },

    marine: {
        label: "M",
        fill: "#63a4c7"
    },

    contested: {
        label: "★",
        fill: "#e0a94d"
    },

    any: {
        label: "?",
        fill: "#8993a2"
    }
};


function drawResourceSlot(
    tile,
    pixel
) {

    if (
        !showResourceSlotsToggle.checked ||
        !tile.resourceSlot
    ) {

        return;
    }


    const style =
        RESOURCE_SLOT_STYLE[
            tile.resourceSlot
        ];


    if (
        !style
    ) {

        return;
    }


    context.beginPath();


    context.arc(
        pixel.x,
        pixel.y,
        4.15,
        0,
        Math.PI * 2
    );


    context.fillStyle =
        style.fill;


    context.fill();


    context.strokeStyle =
        "#ffffff";


    context.lineWidth =
        0.7;


    context.stroke();


    context.fillStyle =
        "#111111";


    context.font =
        "bold 6px Arial";


    context.textAlign =
        "center";


    context.textBaseline =
        "middle";


    context.fillText(
        style.label,
        pixel.x,
        pixel.y
    );
}


// ============================================================
// RIVER DRAWING
// ============================================================

function drawFreshWaterOverlay() {

    if (
        !showFreshWaterToggle.checked
    ) {

        return;
    }


    for (
        let row = 0;
        row < mapHeight;
        row++
    ) {

        for (
            let column = 0;
            column < mapWidth;
            column++
        ) {

            if (
                !tileHasFreshWater(
                    column,
                    row
                )
            ) {

                continue;
            }


            const pixel =
                hexToPixel(
                    column,
                    row
                );


            context.beginPath();


            context.arc(
                pixel.x,
                pixel.y,
                HEX_SIZE *
                0.66,
                0,
                Math.PI * 2
            );


            context.fillStyle =
                "rgba(78,186,235,0.16)";


            context.fill();
        }
    }
}


function drawRiverEdge(
    edge
) {

    const geometry =
        getRiverEdgePixelGeometry(
            edge
        );


    if (
        !geometry
    ) {

        return;
    }


    context.beginPath();


    context.moveTo(
        geometry.vertexA.x,
        geometry.vertexA.y
    );


    context.lineTo(
        geometry.vertexB.x,
        geometry.vertexB.y
    );


    context.strokeStyle =
        "rgba(5,35,55,0.95)";


    context.lineWidth =
        4.1;


    context.lineCap =
        "round";


    context.stroke();


    context.beginPath();


    context.moveTo(
        geometry.vertexA.x,
        geometry.vertexA.y
    );


    context.lineTo(
        geometry.vertexB.x,
        geometry.vertexB.y
    );


    context.strokeStyle =
        "#5ec7f2";


    context.lineWidth =
        2.4;


    context.stroke();
}


function drawRivers() {

    if (
        !showRiversToggle.checked
    ) {

        return;
    }


    for (
        const edge
        of riverEdges.values()
    ) {

        drawRiverEdge(
            edge
        );
    }
}


// ============================================================
// START DRAWING
// ============================================================

function drawStartZones() {

    if (
        !showStartZonesToggle.checked
    ) {

        return;
    }


    for (
        let row = 0;
        row < mapHeight;
        row++
    ) {

        for (
            let column = 0;
            column < mapWidth;
            column++
        ) {

            if (
                getStartZonePlayer(
                    column,
                    row
                )
                ===
                null
            ) {

                continue;
            }


            const pixel =
                hexToPixel(
                    column,
                    row
                );


            context.beginPath();


            context.arc(
                pixel.x,
                pixel.y,
                HEX_SIZE *
                0.72,
                0,
                Math.PI * 2
            );


            context.fillStyle =
                "rgba(255,255,255,0.09)";


            context.fill();
        }
    }
}


function drawPlayerStarts() {

    if (
        !showStartsToggle.checked
    ) {

        return;
    }


    for (
        const start
        of playerStarts
    ) {

        const pixel =
            hexToPixel(
                start.x,
                start.y
            );


        context.beginPath();


        context.arc(
            pixel.x,
            pixel.y,
            HEX_SIZE *
            0.78,
            0,
            Math.PI * 2
        );


        context.fillStyle =
            "#ffffff";


        context.fill();


        context.beginPath();


        context.arc(
            pixel.x,
            pixel.y,
            HEX_SIZE *
            0.58,
            0,
            Math.PI * 2
        );


        context.fillStyle =
            "#202632";


        context.fill();


        context.fillStyle =
            "#ffffff";


        context.font =
            "bold 8px Arial";


        context.textAlign =
            "center";


        context.textBaseline =
            "middle";


        context.fillText(
            "P" +
            start.player,
            pixel.x,
            pixel.y
        );
    }
}


function drawCentreMarker() {

    const pixel =
        hexToPixel(
            centreColumn,
            centreRow
        );


    context.beginPath();


    context.arc(
        pixel.x,
        pixel.y,
        3,
        0,
        Math.PI * 2
    );


    context.fillStyle =
        "#ffffff";


    context.fill();
}


// ============================================================
// DRAW MAP
// ============================================================

function drawMap() {

    context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    for (
        let row = 0;
        row < mapHeight;
        row++
    ) {

        for (
            let column = 0;
            column < mapWidth;
            column++
        ) {

            const tile =
                mapTiles[
                    row
                ][
                    column
                ];


            const pixel =
                hexToPixel(
                    column,
                    row
                );


            let stroke =
                "#46523e";


            if (

                !tile.land &&

                tile.terrain ===
                    "coast"

            ) {

                stroke =
                    "#4485a3";

            } else if (
                !tile.land
            ) {

                stroke =
                    "#234a63";
            }


            drawHex(
                pixel.x,
                pixel.y,
                getTileColor(
                    tile
                ),
                stroke
            );


            if (
                tile.land
            ) {

                drawTileDetails(
                    tile,
                    pixel
                );
            }


            drawResourceSlot(
                tile,
                pixel
            );
        }
    }


    drawFreshWaterOverlay();


    drawStartZones();


    drawRivers();


    drawPlayerStarts();


    drawCentreMarker();
}


// ============================================================
// CLOSEST TILE
// ============================================================

function findClosestTile(
    mouseX,
    mouseY
) {

    let bestTile =
        null;


    let bestDistance =
        Infinity;


    for (
        let row = 0;
        row < mapHeight;
        row++
    ) {

        for (
            let column = 0;
            column < mapWidth;
            column++
        ) {

            const pixel =
                hexToPixel(
                    column,
                    row
                );


            const dx =
                pixel.x -
                mouseX;


            const dy =
                pixel.y -
                mouseY;


            const distance =
                dx * dx +
                dy * dy;


            if (
                distance <
                bestDistance
            ) {

                bestDistance =
                    distance;


                bestTile = {

                    x:
                        column,

                    y:
                        row
                };
            }
        }
    }


    return bestTile;
}


// ============================================================
// TILE BRUSH
// ============================================================

function ensureLand(
    tile
) {

    if (
        tile.land
    ) {

        return;
    }


    tile.land =
        true;


    tile.terrain =
        "grassland";


    tile.elevation =
        "flat";


    tile.feature =
        null;


    tile.manualWater =
        false;


    if (
        tile.resourceSlot ===
        SLOT_MARINE
    ) {

        tile.resourceSlot =
            null;


        tile.resourceSource =
            null;
    }
}


function applyBrushToTile(
    column,
    row
) {

    const tile =
        mapTiles[
            row
        ][
            column
        ];


    if (
        selectedBrush ===
        "slot-food"
    ) {

        ensureLand(tile);

        tile.resourceSlot =
            SLOT_FOOD;

        tile.resourceSource =
            "manual";

        return;
    }


    if (
        selectedBrush ===
        "slot-tradeable"
    ) {

        ensureLand(tile);

        tile.resourceSlot =
            SLOT_TRADEABLE;

        tile.resourceSource =
            "manual";

        return;
    }


    if (
        selectedBrush ===
        "slot-strategic"
    ) {

        ensureLand(tile);

        tile.resourceSlot =
            SLOT_STRATEGIC;

        tile.resourceSource =
            "manual";

        return;
    }


    if (
        selectedBrush ===
        "slot-marine"
    ) {

        tile.land =
            false;

        tile.terrain =
            "coast";

        tile.elevation =
            "flat";

        tile.feature =
            null;

        tile.manualWater =
            true;

        tile.resourceSlot =
            SLOT_MARINE;

        tile.resourceSource =
            "manual";

        return;
    }


    if (
        selectedBrush ===
        "slot-contested"
    ) {

        ensureLand(tile);

        tile.resourceSlot =
            SLOT_CONTESTED;

        tile.resourceSource =
            "manual";

        return;
    }


    if (
        selectedBrush ===
        "slot-any"
    ) {

        tile.resourceSlot =
            SLOT_ANY;

        tile.resourceSource =
            "manual";

        return;
    }


    if (
        selectedBrush ===
        "clear-slot"
    ) {

        tile.resourceSlot =
            null;

        tile.resourceSource =
            null;

        return;
    }


    if (
        selectedBrush ===
        "coast"
    ) {

        tile.land =
            false;

        tile.terrain =
            "coast";

        tile.elevation =
            "flat";

        tile.feature =
            null;

        tile.manualWater =
            true;

        return;
    }


    if (
        selectedBrush ===
        "ocean"
    ) {

        tile.land =
            false;

        tile.terrain =
            "ocean";

        tile.elevation =
            "flat";

        tile.feature =
            null;

        tile.manualWater =
            true;

        return;
    }


    if (
        selectedBrush ===
        "restore"
    ) {

        tile.land =
            tile.baseLand;

        tile.terrain =
            tile.baseTerrain;

        tile.elevation =
            tile.baseElevation;

        tile.feature =
            tile.baseFeature;

        tile.resourceSlot =
            null;

        tile.resourceSource =
            null;

        tile.manualWater =
            false;

        return;
    }


    ensureLand(
        tile
    );


    if (
        selectedBrush ===
        "grassland"
    ) {

        tile.terrain =
            "grassland";
    }


    else if (
        selectedBrush ===
        "plains"
    ) {

        tile.terrain =
            "plains";
    }


    else if (
        selectedBrush ===
        "desert"
    ) {

        tile.terrain =
            "desert";

        tile.feature =
            null;
    }


    else if (
        selectedBrush ===
        "tundra"
    ) {

        tile.terrain =
            "tundra";
    }


    else if (
        selectedBrush ===
        "hill"
    ) {

        tile.elevation =
            "hill";
    }


    else if (
        selectedBrush ===
        "mountain"
    ) {

        tile.elevation =
            "mountain";

        tile.feature =
            null;

        tile.resourceSlot =
            null;

        tile.resourceSource =
            null;
    }


    else if (
        selectedBrush ===
        "forest"
    ) {

        if (
            tile.elevation !==
            "mountain"
        ) {

            tile.feature =
                "forest";
        }
    }
}


function paintTile(
    column,
    row
) {

    for (
        const position
        of getSymmetricalTiles(
            column,
            row
        )
    ) {

        applyBrushToTile(
            position.x,
            position.y
        );
    }


    updateCoastlines();


    removeInvalidRiverEdges();


    updateStats();


    updateBalancePanel();


    drawMap();
}


// ============================================================
// MOUSE
// ============================================================

function paintFromMouse(
    event
) {

    const rect =
        canvas.getBoundingClientRect();


    const mouseX =
        event.clientX -
        rect.left;


    const mouseY =
        event.clientY -
        rect.top;


    if (

        selectedBrush ===
            "river-add" ||

        selectedBrush ===
            "river-remove"

    ) {

        const edge =
            findClosestRiverEdge(
                mouseX,
                mouseY
            );


        if (
            edge
        ) {

            paintRiverEdge(
                edge
            );
        }


        return;
    }


    const tile =
        findClosestTile(
            mouseX,
            mouseY
        );


    if (
        tile
    ) {

        paintTile(
            tile.x,
            tile.y
        );
    }
}


// ============================================================
// STATS
// ============================================================

function updateStats() {

    let land =
        0;

    let coast =
        0;

    let ocean =
        0;

    let slots =
        0;


    for (
        let row = 0;
        row < mapHeight;
        row++
    ) {

        for (
            let column = 0;
            column < mapWidth;
            column++
        ) {

            const tile =
                mapTiles[
                    row
                ][
                    column
                ];


            if (
                tile.land
            ) {

                land++;

            } else if (
                tile.terrain ===
                "coast"
            ) {

                coast++;

            } else {

                ocean++;
            }


            if (
                tile.resourceSlot
            ) {

                slots++;
            }
        }
    }


    landCountElement.textContent =
        land;


    coastCountElement.textContent =
        coast;


    oceanCountElement.textContent =
        ocean;


    riverCountElement.textContent =
        riverEdges.size;


    freshWaterCountElement.textContent =
        countFreshWaterLand();


    resourceSlotCountElement.textContent =
        slots;
}


// ============================================================
// BRUSH SELECTION
// ============================================================

function selectBrush(
    brush
) {

    selectedBrush =
        brush;


    for (
        const button
        of brushButtons
    ) {

        button.classList.toggle(

            "active",

            button.dataset.brush ===
            brush
        );
    }


    const names = {

        grassland:
            "Grassland",

        plains:
            "Plains",

        desert:
            "Desert",

        tundra:
            "Tundra",

        hill:
            "Hills",

        mountain:
            "Mountain",

        forest:
            "Forest",

        coast:
            "Coast",

        ocean:
            "Ocean",

        restore:
            "Restore",

        "river-add":
            "Add River Edge",

        "river-remove":
            "Remove River Edge",

        "slot-food":
            "Food Slot",

        "slot-tradeable":
            "Tradeable Slot",

        "slot-strategic":
            "Strategic Slot",

        "slot-marine":
            "Marine Slot",

        "slot-contested":
            "Contested Slot",

        "slot-any":
            "Any Valid Slot",

        "clear-slot":
            "Clear Slot"
    };


    brushNameElement.textContent =
        names[brush] ||
        brush;
}


// ============================================================
// V0.9 SERIALISATION
// ============================================================

function buildMapExportData() {

    const tiles =
        [];


    for (
        let row = 0;
        row < mapHeight;
        row++
    ) {

        const tileRow =
            [];


        for (
            let column = 0;
            column < mapWidth;
            column++
        ) {

            const tile =
                mapTiles[
                    row
                ][
                    column
                ];


            tileRow.push({

                x:
                    column,

                y:
                    row,

                land:
                    tile.land,

                terrain:
                    tile.terrain,

                elevation:
                    tile.elevation,

                feature:
                    tile.feature,

                resourceSlot:
                    tile.resourceSlot,

                resourceSource:
                    tile.resourceSource,

                manualWater:
                    tile.manualWater,

                baseLand:
                    tile.baseLand,

                baseTerrain:
                    tile.baseTerrain,

                baseElevation:
                    tile.baseElevation,

                baseFeature:
                    tile.baseFeature
            });
        }


        tiles.push(
            tileRow
        );
    }


    const rivers =
        Array.from(
            riverEdges.values()
        ).map(

            edge => ({

                a: {
                    x: edge.a.x,
                    y: edge.a.y
                },

                b: {
                    x: edge.b.x,
                    y: edge.b.y
                }
            })
        );


    const starts =
        playerStarts.map(

            start => ({

                player:
                    start.player,

                x:
                    start.x,

                y:
                    start.y,

                cube: {
                    x: start.cube.x,
                    y: start.cube.y,
                    z: start.cube.z
                }
            })
        );


    return {

        format:
            LIMESPACE_MAP_FORMAT,

        version:
            LIMESPACE_MAP_VERSION,

        name:
            "Limespace Snowflake",

        exportedAt:
            new Date().toISOString(),


        dimensions: {

            width:
                mapWidth,

            height:
                mapHeight,

            centreColumn:
                centreColumn,

            centreRow:
                centreRow
        },


        generatorSettings: {

            mapSize:
                Number(
                    mapSizeInput.value
                ),

            armLength:
                Number(
                    armLengthInput.value
                ),

            armWidth:
                Number(
                    armWidthInput.value
                ),

            centreSize:
                Number(
                    hubSizeInput.value
                ),

            startDistance:
                Number(
                    startDistanceInput.value
                ),

            startZoneRadius:
                Number(
                    startZoneRadiusInput.value
                ),

            resourceDensity:
                Number(
                    resourceDensityInput.value
                ),

            centralRichness:
                Number(
                    centralRichnessInput.value
                )
        },


        editorSettings: {

            symmetry:
                symmetryToggle.checked,

            showGrid:
                showGrid,

            showStarts:
                showStartsToggle.checked,

            showStartZones:
                showStartZonesToggle.checked,

            showRivers:
                showRiversToggle.checked,

            showFreshWater:
                showFreshWaterToggle.checked,

            showResourceSlots:
                showResourceSlotsToggle.checked,

            autoResources:
                autoResourceToggle.checked
        },


        playerStarts:
            starts,

        rivers:
            rivers,

        tiles:
            tiles
    };
}


// ============================================================
// VALIDATION
// ============================================================

function validateMapData(
    data
) {

    if (
        !data ||
        typeof data !==
        "object"
    ) {

        throw new Error(
            "Invalid map data."
        );
    }


    if (
        data.format !==
        LIMESPACE_MAP_FORMAT
    ) {

        throw new Error(
            "This is not a Limespace Snowflake map."
        );
    }


    if (
        !data.dimensions ||
        !Array.isArray(
            data.tiles
        )
    ) {

        throw new Error(
            "Map dimensions or tiles are missing."
        );
    }


    const width =
        Number(
            data.dimensions.width
        );


    const height =
        Number(
            data.dimensions.height
        );


    if (

        !Number.isInteger(
            width
        ) ||

        !Number.isInteger(
            height
        ) ||

        width <= 0 ||
        height <= 0

    ) {

        throw new Error(
            "Invalid map dimensions."
        );
    }


    if (
        data.tiles.length !==
        height
    ) {

        throw new Error(
            "Tile row count does not match map height."
        );
    }


    for (
        const row
        of data.tiles
    ) {

        if (

            !Array.isArray(
                row
            ) ||

            row.length !==
                width

        ) {

            throw new Error(
                "Tile data does not match map width."
            );
        }
    }


    return true;
}


// ============================================================
// RESTORE SETTINGS
// ============================================================

function restoreGeneratorSettings(
    data
) {

    const settings =
        data.generatorSettings ||
        {};


    if (
        settings.mapSize !==
        undefined
    ) {

        mapSizeInput.value =
            String(
                settings.mapSize
            );
    }


    if (
        settings.armLength !==
        undefined
    ) {

        armLengthInput.value =
            settings.armLength;
    }


    if (
        settings.armWidth !==
        undefined
    ) {

        armWidthInput.value =
            settings.armWidth;
    }


    if (
        settings.centreSize !==
        undefined
    ) {

        hubSizeInput.value =
            settings.centreSize;
    }


    if (
        settings.startDistance !==
        undefined
    ) {

        startDistanceInput.value =
            settings.startDistance;
    }


    if (
        settings.startZoneRadius !==
        undefined
    ) {

        startZoneRadiusInput.value =
            settings.startZoneRadius;
    }


    if (
        settings.resourceDensity !==
        undefined
    ) {

        resourceDensityInput.value =
            settings.resourceDensity;
    }


    if (
        settings.centralRichness !==
        undefined
    ) {

        centralRichnessInput.value =
            settings.centralRichness;
    }


    startDistanceValue.textContent =
        startDistanceInput.value;


    startRadiusValue.textContent =
        startZoneRadiusInput.value;


    resourceDensityValue.textContent =

        resourceDensityInput.value +
        "%";


    centralRichnessValue.textContent =

        centralRichnessInput.value +
        "%";
}


function restoreEditorSettings(
    data
) {

    const settings =
        data.editorSettings ||
        {};


    if (
        settings.symmetry !==
        undefined
    ) {

        symmetryToggle.checked =
            Boolean(
                settings.symmetry
            );
    }


    if (
        settings.showGrid !==
        undefined
    ) {

        showGrid =
            Boolean(
                settings.showGrid
            );
    }


    if (
        settings.showStarts !==
        undefined
    ) {

        showStartsToggle.checked =
            Boolean(
                settings.showStarts
            );
    }


    if (
        settings.showStartZones !==
        undefined
    ) {

        showStartZonesToggle.checked =
            Boolean(
                settings.showStartZones
            );
    }


    if (
        settings.showRivers !==
        undefined
    ) {

        showRiversToggle.checked =
            Boolean(
                settings.showRivers
            );
    }


    if (
        settings.showFreshWater !==
        undefined
    ) {

        showFreshWaterToggle.checked =
            Boolean(
                settings.showFreshWater
            );
    }


    if (
        settings.showResourceSlots !==
        undefined
    ) {

        showResourceSlotsToggle.checked =
            Boolean(
                settings.showResourceSlots
            );
    }


    if (
        settings.autoResources !==
        undefined
    ) {

        autoResourceToggle.checked =
            Boolean(
                settings.autoResources
            );
    }
}


// ============================================================
// RESTORE MAP
// ============================================================

function restoreMapFromData(
    data
) {

    validateMapData(
        data
    );


    mapWidth =
        Number(
            data.dimensions.width
        );


    mapHeight =
        Number(
            data.dimensions.height
        );


    centreColumn =
        Number(
            data.dimensions.centreColumn
        );


    centreRow =
        Number(
            data.dimensions.centreRow
        );


    restoreGeneratorSettings(
        data
    );


    restoreEditorSettings(
        data
    );


    mapTiles =
        [];


    for (
        let row = 0;
        row < mapHeight;
        row++
    ) {

        mapTiles[row] =
            [];


        for (
            let column = 0;
            column < mapWidth;
            column++
        ) {

            const saved =
                data.tiles[
                    row
                ][
                    column
                ];


            mapTiles[
                row
            ][
                column
            ] = {

                land:
                    Boolean(
                        saved.land
                    ),

                terrain:
                    saved.terrain,

                elevation:
                    saved.elevation,

                feature:
                    saved.feature ??
                    null,

                resourceSlot:
                    saved.resourceSlot ??
                    null,

                resourceSource:
                    saved.resourceSource ??
                    null,

                manualWater:
                    Boolean(
                        saved.manualWater
                    ),

                baseLand:
                    saved.baseLand !==
                    undefined
                        ? Boolean(
                            saved.baseLand
                        )
                        : Boolean(
                            saved.land
                        ),

                baseTerrain:
                    saved.baseTerrain ??
                    saved.terrain,

                baseElevation:
                    saved.baseElevation ??
                    saved.elevation,

                baseFeature:
                    saved.baseFeature ??
                    saved.feature ??
                    null
            };
        }
    }


    playerStarts =
        [];


    if (
        Array.isArray(
            data.playerStarts
        )
    ) {

        for (
            const savedStart
            of data.playerStarts
        ) {

            playerStarts.push({

                player:
                    savedStart.player,

                x:
                    savedStart.x,

                y:
                    savedStart.y,

                cube:
                    savedStart.cube
                        ? {
                            x:
                                savedStart.cube.x,

                            y:
                                savedStart.cube.y,

                            z:
                                savedStart.cube.z
                        }
                        : tileToLocalCube(
                            savedStart.x,
                            savedStart.y
                        )
            });
        }
    }


    riverEdges.clear();


    if (
        Array.isArray(
            data.rivers
        )
    ) {

        for (
            const savedRiver
            of data.rivers
        ) {

            if (
                !savedRiver.a ||
                !savedRiver.b
            ) {

                continue;
            }


            const edge =
                normaliseEdge(
                    savedRiver.a,
                    savedRiver.b
                );


            riverEdges.set(
                edge.key,
                edge
            );
        }
    }


    centreCoordinatesElement.textContent =

        centreColumn +
        ", " +
        centreRow;


    resizeCanvas();


    updateStats();


    updateBalancePanel();


    drawMap();


    verifySymmetry();


    verifyRiverSymmetry();


    console.log(
        "✓ Map restored."
    );
}


// ============================================================
// BROWSER SAVE
// ============================================================

function saveMapToBrowser() {

    try {

        const data =
            buildMapExportData();


        localStorage.setItem(

            LIMESPACE_SAVE_KEY,

            JSON.stringify(
                data
            )
        );


        mapFileStatus.textContent =
            "✓ Map saved in browser";


        console.log(
            "✓ Browser save complete."
        );

    } catch (
        error
    ) {

        console.error(
            error
        );


        mapFileStatus.textContent =
            "⚠ Could not save map";
    }
}


// ============================================================
// BROWSER LOAD
// ============================================================

function loadMapFromBrowser() {

    try {

        const stored =
            localStorage.getItem(
                LIMESPACE_SAVE_KEY
            );


        if (
            !stored
        ) {

            mapFileStatus.textContent =
                "No saved map found.";

            return;
        }


        const data =
            JSON.parse(
                stored
            );


        restoreMapFromData(
            data
        );


        mapFileStatus.textContent =
            "✓ Saved map loaded";

    } catch (
        error
    ) {

        console.error(
            error
        );


        mapFileStatus.textContent =
            "⚠ Saved map could not be loaded";
    }
}


// ============================================================
// V0.10 CIVILIZATION VII EXPORT
// ============================================================

function buildCiv7MapData() {

    const terrainRows = [];

    for (let y = 0; y < mapHeight; y++) {

        const row = [];

        for (let x = 0; x < mapWidth; x++) {

            const tile = mapTiles[y][x];

            row.push({
                x: x,
                y: y,
                terrain: tile.terrain
            });
        }

        terrainRows.push(row);
    }

    return {
        format: "LIMESPACE_CIV7_MAP_DATA",
        version: "1.0",
        name: "Limespace Snowflake",
        width: mapWidth,
        height: mapHeight,
        centreColumn: centreColumn,
        centreRow: centreRow,
        terrainRows: terrainRows
    };
}


function exportMapForCiv7() {

    try {

        const data =
            buildCiv7MapData();

        const source =
`// ============================================================
// Limespace Snowflake - Civilization VII map data
// Generated by Limespace Map Generator V0.10
// Stage 1: terrain + coast + ocean only
// ============================================================

export const LIMESPACE_SNOWFLAKE_MAP = ${JSON.stringify(data, null, 4)};
`;

        const blob =
            new Blob(
                [source],
                {
                    type:
                        "text/javascript;charset=utf-8"
                }
            );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;
        link.download =
            "snowflake-map-data.js";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        mapFileStatus.textContent =
            "Civ VII map data exported: snowflake-map-data.js";

        console.log(
            "Civ VII Stage 1 map data exported.",
            data
        );
    }
    catch (error) {

        console.error(
            "Civ VII export failed:",
            error
        );

        mapFileStatus.textContent =
            "Civ VII export failed. Check the browser console.";
    }
}


// ============================================================
// EXPORT JSON
// ============================================================

function exportMapAsJSON() {

    try {

        const data =
            buildMapExportData();


        const json =
            JSON.stringify(
                data,
                null,
                2
            );


        const blob =
            new Blob(

                [
                    json
                ],

                {
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        const timestamp =
            new Date()
                .toISOString()
                .replace(
                    /[:.]/g,
                    "-"
                );


        link.href =
            url;


        link.download =

            "limespace-snowflake-" +
            timestamp +
            ".json";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        mapFileStatus.textContent =
            "✓ JSON exported";


        console.log(
            "✓ JSON export complete."
        );

    } catch (
        error
    ) {

        console.error(
            error
        );


        mapFileStatus.textContent =
            "⚠ JSON export failed";
    }
}


// ============================================================
// IMPORT JSON
// ============================================================

function importMapFromFile(
    file
) {

    if (
        !file
    ) {

        return;
    }


    const reader =
        new FileReader();


    reader.onload =
        event => {

            try {

                const data =
                    JSON.parse(
                        event.target.result
                    );


                restoreMapFromData(
                    data
                );


                mapFileStatus.textContent =
                    "✓ JSON map imported";


                console.log(
                    "✓ Imported:",
                    file.name
                );

            } catch (
                error
            ) {

                console.error(
                    error
                );


                mapFileStatus.textContent =
                    "⚠ Invalid map file";


                alert(
                    "Unable to load this Limespace map.\n\n" +
                    error.message
                );
            }


            importMapFile.value =
                "";
        };


    reader.onerror =
        () => {

            mapFileStatus.textContent =
                "⚠ Could not read file";


            importMapFile.value =
                "";
        };


    reader.readAsText(
        file
    );
}


// ============================================================
// CANVAS EVENTS
// ============================================================

canvas.addEventListener(

    "mousedown",

    event => {

        mouseDown =
            true;


        paintFromMouse(
            event
        );
    }
);


canvas.addEventListener(

    "mousemove",

    event => {

        const rect =
            canvas.getBoundingClientRect();


        const mouseX =
            event.clientX -
            rect.left;


        const mouseY =
            event.clientY -
            rect.top;


        const tile =
            findClosestTile(
                mouseX,
                mouseY
            );


        if (
            tile
        ) {

            const cube =
                tileToLocalCube(
                    tile.x,
                    tile.y
                );


            const mapTile =
                mapTiles[
                    tile.y
                ][
                    tile.x
                ];


            let info =

                "X: " +
                tile.x +

                " Y: " +
                tile.y +

                " | Cube: " +
                cube.x +
                "," +
                cube.y +
                "," +
                cube.z;


            if (
                !mapTile.land
            ) {

                info +=
                    " | " +
                    mapTile.terrain;
            }


            if (
                tileHasFreshWater(
                    tile.x,
                    tile.y
                )
            ) {

                info +=
                    " | Fresh Water";
            }


            if (
                mapTile.resourceSlot
            ) {

                info +=
                    " | Slot: " +
                    mapTile.resourceSlot;
            }


            coordinatesElement.textContent =
                info;
        }


        if (

            mouseDown &&

            selectedBrush !==
                "river-add" &&

            selectedBrush !==
                "river-remove"

        ) {

            paintFromMouse(
                event
            );
        }
    }
);


canvas.addEventListener(

    "mouseleave",

    () => {

        mouseDown =
            false;


        coordinatesElement.textContent =
            "X: — Y: —";
    }
);


window.addEventListener(

    "mouseup",

    () => {

        mouseDown =
            false;
    }
);


// ============================================================
// BRUSH BUTTONS
// ============================================================

for (
    const button
    of brushButtons
) {

    button.addEventListener(

        "click",

        () => {

            selectBrush(
                button.dataset.brush
            );
        }
    );
}


// ============================================================
// MAP CONTROLS
// ============================================================

generateButton.addEventListener(
    "click",
    generateMap
);


toggleGridButton.addEventListener(

    "click",

    () => {

        showGrid =
            !showGrid;


        drawMap();
    }
);


mapSizeInput.addEventListener(
    "change",
    generateMap
);


armLengthInput.addEventListener(
    "input",
    generateMap
);


armWidthInput.addEventListener(
    "input",
    generateMap
);


hubSizeInput.addEventListener(
    "input",
    generateMap
);


// ============================================================
// RIVERS
// ============================================================

regenerateRiversButton.addEventListener(

    "click",

    () => {

        generateAutomaticRivers();


        updateStats();


        updateBalancePanel();


        drawMap();


        verifyRiverSymmetry();
    }
);


clearRiversButton.addEventListener(

    "click",

    () => {

        riverEdges.clear();


        updateStats();


        updateBalancePanel();


        drawMap();
    }
);


showRiversToggle.addEventListener(
    "change",
    drawMap
);


showFreshWaterToggle.addEventListener(
    "change",
    drawMap
);


// ============================================================
// RESOURCES
// ============================================================

resourceDensityInput.addEventListener(

    "input",

    () => {

        resourceDensityValue.textContent =

            resourceDensityInput.value +
            "%";
    }
);


resourceDensityInput.addEventListener(
    "change",
    generateMap
);


centralRichnessInput.addEventListener(

    "input",

    () => {

        centralRichnessValue.textContent =

            centralRichnessInput.value +
            "%";
    }
);


centralRichnessInput.addEventListener(
    "change",
    generateMap
);


autoResourceToggle.addEventListener(
    "change",
    generateMap
);


showResourceSlotsToggle.addEventListener(
    "change",
    drawMap
);


// ============================================================
// START CONTROLS
// ============================================================

startDistanceInput.addEventListener(

    "input",

    () => {

        startDistanceValue.textContent =
            startDistanceInput.value;
    }
);


startDistanceInput.addEventListener(
    "change",
    generateMap
);


startZoneRadiusInput.addEventListener(

    "input",

    () => {

        startRadiusValue.textContent =
            startZoneRadiusInput.value;


        updateBalancePanel();


        drawMap();
    }
);


showStartsToggle.addEventListener(
    "change",
    drawMap
);


showStartZonesToggle.addEventListener(
    "change",
    drawMap
);


// ============================================================
// FILE CONTROLS
// ============================================================

saveMapButton.addEventListener(
    "click",
    saveMapToBrowser
);


loadMapButton.addEventListener(
    "click",
    loadMapFromBrowser
);


exportMapButton.addEventListener(
    "click",
    exportMapAsJSON
);


exportCiv7Button.addEventListener(
    "click",
    exportMapForCiv7
);


importMapButton.addEventListener(

    "click",

    () => {

        importMapFile.click();
    }
);


importMapFile.addEventListener(

    "change",

    event => {

        const file =
            event.target.files[0];


        if (
            file
        ) {

            importMapFromFile(
                file
            );
        }
    }
);


// ============================================================
// INITIAL UI
// ============================================================

startDistanceValue.textContent =
    startDistanceInput.value;


startRadiusValue.textContent =
    startZoneRadiusInput.value;


resourceDensityValue.textContent =

    resourceDensityInput.value +
    "%";


centralRichnessValue.textContent =

    centralRichnessInput.value +
    "%";


// ============================================================
// START
// ============================================================

selectBrush(
    "grassland"
);


generateMap();


console.log(
    "Limespace Map Generator V0.10 loaded."
);