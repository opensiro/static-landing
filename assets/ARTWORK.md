# Artwork

The three product marks are small SVG assets with CSS animation and built-in
`prefers-reduced-motion` support. They share a pixel grid while using distinct
forms: parent and child squares for vsmlite, comparison bars for opensiro, and
a framed reasoning core for ARCTIC.

The existing mascot and bundled font are preserved. See the repository README
and `DepartureMono-OFL.txt` for credits and licensing.

## Generated assets

These PNG files were generated with the built-in ImageGen tool and copied into
this directory. Source images remain in the tool's generated-images directory.

### `arctic-mountains.png`

Prompt: Use case: stylized-concept. Create a website background asset: a
panoramic silhouette of rugged Arctic mountains, solid near-black #18181b on a
genuinely transparent background. Very wide 3:1 composition. Mountains occupy
the lower 65 percent, peaks varied and asymmetrical, low valley near center,
tall peaks toward sides. Jagged pixel-stepped edges, restrained 1-bit
retro-computing aesthetic, no white snow details inside the silhouette, no
text, no sun, no sky, no stars, no frame. Solid continuous base touching entire
bottom edge, mountain silhouette reaches both side edges. Asset will be used
as an alpha mask recolored blue on hover.

### `pixel-vine.png`

Prompt: Use case: stylized-concept. Create a single tall narrow ornamental
pixel-art climbing vine for the side of a minimalist monospace software
website hero. Genuinely transparent background. Portrait 1:3 composition.
Black #18181b only. One slender angular stem winds upward, small geometric
square-stepped leaves branching left and right, a few tiny detached black
pixel squares. Restrained elegant botanical 1-bit bitmap sprite, consistent
coarse square pixel grid. Whole vine visible with generous transparent margin,
no ground, no planter, no other objects, no typography, no border, no shading,
no color.

The sprite is a static CSS alpha mask (`.vine-static`). Left and right copies
use mirroring and remain visible without JavaScript.

The `.vine-growing.vine-center` ornament is drawn in `vines.js` as an inline SVG
with coordinates snapped to a two-unit pixel grid. Two continuous Bezier stems
emerge behind the central copy, grow randomized bends and spiral tendrils, and
open small buds. The user's Hammerfight chapter-screen reference guides the
intertwined layout. A smaller footprint, muted ink and blue, and a soft center
mask keep this secondary to the copy and the original static side vines.

There is no fade or restarting cycle: new sections attach to the existing tips.
A slow tracking viewport follows upward growth; old sections naturally pass the
bottom edge before being removed. New bends take roughly four seconds each, so
the first 10–15 seconds include several stages of growth and blooming. Pause/
Resume is available; growth also pauses offscreen and in hidden browser tabs.
Reduced motion shows a completed still ornament and hides the pause control.

### `social-preview.png`

Prompt: Landscape branded social-preview image for opensiro. Warm ivory
#faf9f6 background. Refined sparse black monospace typesetting. Large exact
text: "opensiro". Smaller exact text: "Build organizations. Test ideas."
Delicate black pixel-grid ornaments in two corners, small blue #2f6df6 pixel
accents. Lots of whitespace, sharp edges, minimalist retro software research
brand. No additional text, no logos other than the specified wordmark,
no gradients, no shadows, no rounded cards. Composition should read clearly
when cropped or reduced as a social-preview thumbnail. Generate one landscape
image, approximately 1536x1024.
